require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const os = require('os');

// Core Modules
const { prisma, SystemState, SystemMeta, Media } = require('./db');
const { authenticate, login } = require('./auth');
const { upload, getStorageUsage, S3_ENABLED } = require('./media');
const { triggerSync } = require('./sync');

const PORT = process.env.PORT || 3001;
const STORAGE_QUOTA_BYTES = (parseInt(process.env.STORAGE_QUOTA_MB) || 5000) * 1024 * 1024;

const app = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.set('trust proxy', 1);
app.use(cors({
    origin: '*',
    methods: ["GET", "POST", "DELETE"]
}));
app.use(express.json());

// Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', globalLimiter);

// Auth Routes
app.post('/api/login', (req, res) => {
    const session = login(req.body.password);
    if (session) {
        res.json(session);
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/health', (req, res) => res.status(200).send('OK'));

// Global State
let appState = {
    timers: {
        segment: { duration: 1200, remaining: 1200, running: false, type: 'countdown' },
        target: { targetTime: '12:00', remaining: 0, running: false, type: 'target' },
        elapsed: { seconds: 0, running: false, type: 'elapsed' }
    },
    currentScene: {
        background: null,
        overlayText: '',
        timerVisible: true,
        theme: 'default',
        chromaKey: false,
        positions: { timer: 'center', overlay: 'top' }
    }
};

// State Management with DB fallback
async function saveState() {
    try {
        await SystemState.upsert({
            where: { id: 1 },
            update: { data: JSON.stringify(appState) },
            create: { id: 1, data: JSON.stringify(appState) }
        });
    } catch (e) {
        console.error('[Core] Failed to save state to DB:', e.message);
    }
}

async function loadState() {
    try {
        const saved = await SystemState.findUnique({ where: { id: 1 } });
        if (saved) {
            const parsed = JSON.parse(saved.data);
            appState = { ...appState, ...parsed };
            // Ensure timers are stopped on boot
            Object.keys(appState.timers).forEach(k => appState.timers[k].running = false);
        }
    } catch (e) {
        console.error('[Core] Error loading state from DB:', e.message);
    }
}

// Media API
app.get('/api/media', async (req, res) => {
    try {
        const media = await Media.findMany({
            orderBy: { createdAt: 'desc' }
        });
        const usage = await getStorageUsage();
        res.json({ media, usage, quota: STORAGE_QUOTA_BYTES });
    } catch (e) {
        res.status(500).json({ error: 'DB Error' });
    }
});

app.post('/api/upload', authenticate, upload.single('media'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    try {
        const { originalname, mimetype, key, location, path: localPath, size } = req.file;
        const fileUrl = location || localPath || `/uploads/${req.file.filename}`;
        
        const newMedia = await Media.create({
            data: {
                name: originalname,
                key: key || req.file.filename,
                url: fileUrl,
                type: mimetype,
                size: size || 0,
                tenantId: 'default' // Placeholder
            }
        });
        
        io.emit('mediaAdded', newMedia);
        res.json(newMedia);
    } catch (e) {
        res.status(500).json({ error: 'Save failed' });
    }
});

app.delete('/api/media/:id', authenticate, async (req, res) => {
    try {
        await Media.delete({ where: { id: req.params.id } });
        io.emit('mediaDeleted', req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

// Service Lifecycle API
app.post('/api/services', authenticate, async (req, res) => {
    try {
        const { name } = req.body;
        const service = await prisma.service.create({
            data: {
                name: name || `Sunday Service ${new Date().toLocaleDateString()}`,
                date: new Date(),
                status: 'LIVE',
                tenantId: 'default' // Placeholder
            }
        });
        res.json(service);
    } catch (e) {
        res.status(500).json({ error: 'Failed to create service' });
    }
});

app.patch('/api/services/:id', authenticate, async (req, res) => {
    try {
        const { status } = req.body;
        const service = await prisma.service.update({
            where: { id: req.params.id },
            data: { status }
        });
        res.json(service);
    } catch (e) {
        res.status(500).json({ error: 'Failed to update service' });
    }
});

// Sermon (Handoff) API
app.post('/api/sermons', authenticate, async (req, res) => {
    try {
        const { title, speaker, serviceId, mediaId } = req.body;
        const sermon = await prisma.sermon.create({
            data: {
                title,
                speaker,
                serviceId,
                mediaId,
                tenantId: 'default' // Placeholder
            }
        });
        res.json(sermon);
    } catch (e) {
        res.status(500).json({ error: 'Failed to create sermon record' });
    }
});

app.get('/api/sermons', async (req, res) => {
    try {
        const sermons = await prisma.sermon.findMany({
            include: { media: true, _count: { select: { segments: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(sermons);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch sermons' });
    }
});

app.get('/api/sermons/:id', async (req, res) => {
    try {
        const sermon = await prisma.sermon.findUnique({
            where: { id: req.params.id },
            include: { 
                media: true, 
                segments: { 
                    include: { clips: true },
                    orderBy: { startTime: 'asc' } 
                } 
            }
        });
        if (!sermon) return res.status(404).json({ error: 'Not found' });
        res.json(sermon);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch sermon detail' });
    }
});

// Clips (Distribution Prep) API
app.get('/api/clips', async (req, res) => {
    try {
        const clips = await prisma.clip.findMany({
            include: { sermon: true, segment: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(clips);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch global clips' });
    }
});

app.post('/api/segments/:id/clip', authenticate, async (req, res) => {
    try {
        const segmentId = req.params.id;
        const segment = await prisma.sermonSegment.findUnique({
            where: { id: segmentId }
        });
        if (!segment) return res.status(404).json({ error: 'Segment not found' });

        const { title, caption, platform } = req.body;
        const clip = await prisma.clip.create({
            data: {
                segmentId,
                sermonId: segment.sermonId,
                title: title || segment.title,
                caption: caption || '',
                platform: platform || 'YOUTUBE',
                status: 'DRAFT'
            }
        });
        res.json(clip);
    } catch (e) {
        res.status(500).json({ error: 'Failed to create clip' });
    }
});

app.get('/api/sermons/:id/clips', async (req, res) => {
    try {
        const clips = await prisma.clip.findMany({
            where: { sermonId: req.params.id },
            include: { segment: true }
        });
        res.json(clips);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch sermon clips' });
    }
});

app.patch('/api/clips/:id', authenticate, async (req, res) => {
    try {
        const clip = await prisma.clip.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(clip);
    } catch (e) {
        res.status(500).json({ error: 'Failed to update clip' });
    }
});

app.delete('/api/clips/:id', authenticate, async (req, res) => {
    try {
        await prisma.clip.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

// Sync Engine API
app.post('/api/clips/:id/sync', authenticate, async (req, res) => {
    try {
        const job = await triggerSync(req.params.id);
        res.json(job);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.get('/api/clips/:id/status', async (req, res) => {
    try {
        const clip = await prisma.clip.findUnique({
            where: { id: req.params.id },
            select: { 
                status: true, 
                exportUrl: true, 
                error: true, 
                exportedAt: true,
                syncJobs: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        if (!clip) return res.status(404).json({ error: 'Clip not found' });
        res.json(clip);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch clip status' });
    }
});


// Sermon Segmenting API
app.post('/api/sermons/:id/segments', authenticate, async (req, res) => {
    try {
        const { title, startTime, endTime, type } = req.body;
        const segment = await prisma.sermonSegment.create({
            data: {
                sermonId: req.params.id,
                title,
                startTime: parseInt(startTime) || 0,
                endTime: parseInt(endTime) || 0,
                type: type || 'CLIP'
            }
        });
        res.json(segment);
    } catch (e) {
        res.status(500).json({ error: 'Failed to create segment' });
    }
});

app.patch('/api/segments/:id', authenticate, async (req, res) => {
    try {
        const segment = await prisma.sermonSegment.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(segment);
    } catch (e) {
        res.status(500).json({ error: 'Failed to update segment' });
    }
});

app.delete('/api/segments/:id', authenticate, async (req, res) => {
    try {
        await prisma.sermonSegment.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

app.get('/api/info', (req, res) => {
    const interfaces = os.networkInterfaces();
    const networks = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                networks.push({ name, address: iface.address });
            }
        }
    }
    res.json({ networks, port: PORT, version: '2.1.0-MODULAR' });
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Precision Ticker (Preserve Envoys Speed)
setInterval(() => {
    let changed = false;
    if (appState.timers.segment.running) {
        if (appState.timers.segment.remaining > -1800) {
            appState.timers.segment.remaining -= 1;
            changed = true;
        }
    }
    if (appState.timers.elapsed.running) {
        appState.timers.elapsed.seconds += 1;
        changed = true;
    }
    const now = new Date();
    const [tH, tM] = appState.timers.target.targetTime.split(':').map(Number);
    let tD = new Date();
    tD.setHours(tH, tM, 0, 0);
    if (tD < now) tD.setDate(tD.getDate() + 1);
    const diff = Math.floor((tD - now) / 1000);
    if (appState.timers.target.remaining !== diff) {
        appState.timers.target.remaining = diff;
        changed = true;
    }
    if (changed) io.emit('stateUpdate', { timers: appState.timers });
}, 1000);

// Autosave
setInterval(saveState, 60000);

io.on('connection', (socket) => {
    socket.emit('stateUpdate', appState);

    socket.on('updateTimer', (data, ack) => {
        appState.timers = { ...appState.timers, ...data };
        socket.broadcast.emit('stateUpdate', { timers: appState.timers });
        if (ack) ack({ status: 'ok' });
        saveState();
    });

    socket.on('updateScene', (data, ack) => {
        appState.currentScene = { ...appState.currentScene, ...data };
        socket.broadcast.emit('stateUpdate', { currentScene: appState.currentScene });
        if (ack) ack({ status: 'ok' });
        saveState();
    });

    socket.on('resetAll', (ack) => {
        appState.timers.segment.remaining = appState.timers.segment.duration;
        appState.timers.segment.running = false;
        appState.timers.elapsed.seconds = 0;
        appState.timers.elapsed.running = false;
        io.emit('stateUpdate', appState);
        saveState();
        if (ack) ack({ status: 'ok' });
    });
});

// Boostrap
async function bootstrap() {
    await prisma.$connect();
    await loadState();
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 Envoys OS Core v2.1.0 (Modular)`);
        console.log(` Port: ${PORT}`);
        console.log(` Storage: ${S3_ENABLED ? 'S3 (Minio/AWS)' : 'Local Disk'}`);
    });
}

bootstrap().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
