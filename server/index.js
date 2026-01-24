require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const multer = require('multer');
const fs = require('fs-extra');
const os = require('os');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const CURRENT_SCHEMA_VERSION = 2; // Incremented for migration strategy
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'envoys-secret-2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Validate Environment Variables
if (isNaN(PORT)) {
    console.error('CRITICAL: Invalid PORT environment variable.');
    process.exit(1);
}

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

const uploadLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20, // 20 uploads per minute
    message: { error: 'Upload rate limit exceeded.' }
});

app.use('/api/', globalLimiter);
app.use('/api/upload', uploadLimiter);

// Auth Middleware
const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, role: 'admin' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/health', (req, res) => res.status(200).send('OK'));

// Ensure directories exist
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(backupDir);

app.use('/uploads', express.static(uploadDir, {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

const STORAGE_QUOTA_BYTES = (parseInt(process.env.STORAGE_QUOTA_MB) || 5000) * 1024 * 1024;

async function getStorageUsage() {
    try {
        const files = await fs.readdir(uploadDir);
        let totalSize = 0;
        for (const file of files) {
            const stats = await fs.stat(path.join(uploadDir, file));
            totalSize += stats.size;
        }
        return totalSize;
    } catch (e) {
        return 0;
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueId = uuidv4();
        cb(null, `${uniqueId}${ext}`);
    }
});

const uploadFilter = async (req, file, cb) => {
    try {
        const usage = await getStorageUsage();
        if (usage > STORAGE_QUOTA_BYTES) {
            return cb(new Error('Storage quota exceeded.'));
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type.'));
        }
    } catch (e) {
        cb(e);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
    fileFilter: uploadFilter
});

let db;
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

async function runMigrations() {
    const versionRow = await db.get('SELECT value FROM meta WHERE key = "schema_version"');
    let currentVersion = versionRow ? parseInt(versionRow.value) : 1;

    if (currentVersion < 2) {
        console.log('[Migration] Upgrading to v2...');
        // Example: Add staging field to state
        await db.run('UPDATE meta SET value = "2" WHERE key = "schema_version"');
        currentVersion = 2;
    }
}

async function initDB() {
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
        CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, data TEXT);
        CREATE TABLE IF NOT EXISTS media (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            path TEXT,
            type TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    const versionRow = await db.get('SELECT value FROM meta WHERE key = "schema_version"');
    if (!versionRow) {
        await db.run('INSERT INTO meta (key, value) VALUES ("schema_version", ?)', [CURRENT_SCHEMA_VERSION.toString()]);
    } else {
        await runMigrations();
    }

    const savedState = await db.get('SELECT data FROM state WHERE id = 1');
    if (savedState) {
        try {
            appState = { ...appState, ...JSON.parse(savedState.data) };
            // Ensure timers are stopped on restart
            Object.keys(appState.timers).forEach(k => appState.timers[k].running = false);
        } catch (e) {
            console.error('[Error] State corruption');
        }
    }
}

async function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `state_${timestamp}.sqlite`);
    try {
        if (await fs.pathExists(dbPath)) {
            await fs.copy(dbPath, backupPath);
            const backups = (await fs.readdir(backupDir)).sort();
            if (backups.length > 20) {
                await fs.remove(path.join(backupDir, backups[0]));
            }
        }
    } catch (e) {
        console.error('Backup failed', e);
    }
}

async function saveState() {
    if (!db) return;
    try {
        await db.run('INSERT OR REPLACE INTO state (id, data) VALUES (1, ?)', JSON.stringify(appState));
    } catch (e) {
        console.error('Failed to save state', e);
    }
}

function getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const result = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                result.push({ name, address: iface.address });
            }
        }
    }
    return result;
}

// Routes
app.post('/api/upload', authenticate, (req, res) => {
    upload.single('media')(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        try {
            const { filename, mimetype, originalname } = req.file;
            const resDB = await db.run(
                'INSERT INTO media (name, path, type) VALUES (?, ?, ?)',
                [originalname, `/uploads/${filename}`, mimetype]
            );
            const newMedia = { id: resDB.lastID, name: originalname, path: `/uploads/${filename}`, type: mimetype };
            io.emit('mediaAdded', newMedia);
            res.json(newMedia);
        } catch (dbErr) {
            res.status(500).json({ error: 'Database save failed' });
        }
    });
});

app.get('/api/media', async (req, res) => {
    try {
        const media = await db.all('SELECT * FROM media ORDER BY createdAt DESC');
        const usage = await getStorageUsage();
        res.json({ media, usage, quota: STORAGE_QUOTA_BYTES });
    } catch (e) {
        res.status(500).json({ error: 'DB Error' });
    }
});

app.delete('/api/media/:id', authenticate, async (req, res) => {
    try {
        const item = await db.get('SELECT * FROM media WHERE id = ?', req.params.id);
        if (item) {
            const filePath = path.join(uploadDir, path.basename(item.path));
            if (await fs.pathExists(filePath)) await fs.remove(filePath).catch(e => console.log('File remove skip'));
            await db.run('DELETE FROM media WHERE id = ?', req.params.id);
            io.emit('mediaDeleted', req.params.id);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

app.get('/api/export', authenticate, async (req, res) => {
    res.json(appState);
});

app.get('/api/info', (req, res) => {
    res.json({ networks: getNetworkInfo(), port: PORT, version: '2.0.0-PRO' });
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Precision Ticker
setInterval(() => {
    let changed = false;

    if (appState.timers.segment.running) {
        // Cap at -1800 seconds (30 mins overrun)
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

    if (changed) {
        io.emit('stateUpdate', { timers: appState.timers });
    }
}, 1000);

setInterval(() => {
    saveState();
    createBackup();
}, 60000);

io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);
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

    socket.on('stagingChange', (data) => {
        socket.broadcast.emit('stagingUpdate', { ...data, userId: socket.id });
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

initDB().then(() => {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 EnvoysOS v2.0.0 Production Ready`);
        console.log(` Port: ${PORT}`);
    });
});

const clientPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientPath));
app.get(/^(?!\/api|\/uploads|\/socket\.io).*/, (req, res) => {
    const indexPath = path.join(clientPath, 'index.html');
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send('Build not found.');
});

