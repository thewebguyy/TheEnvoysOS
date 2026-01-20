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

const CURRENT_SCHEMA_VERSION = 1;
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

// Render Persistent Disk Support
const PERSISTENT_DIR = process.env.PERSISTENT_DISK_PATH || __dirname;
const uploadDir = process.env.UPLOADS_PATH || path.join(PERSISTENT_DIR, 'uploads');
const dbPath = process.env.DB_PATH || path.join(PERSISTENT_DIR, 'database.sqlite');
const backupDir = path.join(PERSISTENT_DIR, 'backups');

const app = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "DELETE"]
}));
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000
});
app.use('/api/', limiter);

// Ensure directories exist
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(backupDir);

app.use('/uploads', express.static(uploadDir));

const STORAGE_QUOTA_BYTES = (parseInt(process.env.STORAGE_QUOTA_MB) || 1000) * 1024 * 1024;

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
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
    }
});

const uploadFilter = async (req, file, cb) => {
    try {
        const usage = await getStorageUsage();
        if (usage + (file.size || 0) > STORAGE_QUOTA_BYTES) {
            return cb(new Error('Storage quota exceeded.'));
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, WEBP, MP4, and WEBM are allowed.'));
        }
    } catch (e) {
        cb(e);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: uploadFilter
});

let db;
let appState = {
    timers: {
        segment: { duration: 1200, remaining: 1200, running: false, type: 'countdown', behavior: 'stop' },
        target: { targetTime: '12:00', remaining: 0, running: false, type: 'target' },
        elapsed: { seconds: 0, running: false, type: 'elapsed' }
    },
    currentScene: {
        background: null,
        overlayText: '',
        timerVisible: true,
        theme: 'default',
        chromaKey: false,
        positions: { timer: 'center', overlay: 'bottom' }
    },
    templates: []
};

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
    }

    const savedState = await db.get('SELECT data FROM state WHERE id = 1');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState.data);
            appState = { ...appState, ...parsed };
            appState.timers.segment.running = false;
            appState.timers.target.running = false;
            appState.timers.elapsed.running = false;
        } catch (e) {
            console.error('State corruption detected.');
        }
    }
}

async function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `state_${timestamp}.sqlite`);
    try {
        if (await fs.pathExists(dbPath)) {
            await fs.copy(dbPath, backupPath);
            const backups = await fs.readdir(backupDir);
            if (backups.length > 5) {
                const sorted = backups.sort();
                await fs.remove(path.join(backupDir, sorted[0]));
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
app.post('/api/upload', (req, res) => {
    upload.single('media')(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        try {
            const { filename, mimetype, originalname } = req.file;
            const result = await db.run(
                'INSERT INTO media (name, path, type) VALUES (?, ?, ?)',
                [originalname, `/uploads/${filename}`, mimetype]
            );
            const newMedia = { id: result.lastID, name: originalname, path: `/uploads/${filename}`, type: mimetype };
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

app.delete('/api/media/:id', async (req, res) => {
    try {
        const item = await db.get('SELECT * FROM media WHERE id = ?', req.params.id);
        if (item) {
            const filePath = path.join(uploadDir, path.basename(item.path));
            if (await fs.pathExists(filePath)) await fs.remove(filePath);
            await db.run('DELETE FROM media WHERE id = ?', req.params.id);
            io.emit('mediaDeleted', req.params.id);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Media not found' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

app.get('/api/info', (req, res) => {
    res.json({ networks: getNetworkInfo(), port: PORT });
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] }
});

// Precision Ticker
setInterval(() => {
    let changed = false;

    if (appState.timers.segment.running) {
        if (appState.timers.segment.remaining > -360000) {
            appState.timers.segment.remaining -= 1;
            if (appState.timers.segment.remaining <= 0 && appState.timers.segment.behavior === 'stop') {
                appState.timers.segment.remaining = 0;
                appState.timers.segment.running = false;
            }
            changed = true;
        }
    }

    if (appState.timers.elapsed.running) {
        if (appState.timers.elapsed.seconds < 359999) {
            appState.timers.elapsed.seconds += 1;
            changed = true;
        } else {
            appState.timers.elapsed.running = false;
            changed = true;
        }
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
        io.emit('stateUpdate', appState);
    }
}, 1000);

setInterval(() => {
    saveState();
    createBackup();
}, 60000);

io.on('connection', (socket) => {
    socket.emit('stateUpdate', appState);

    socket.on('updateTimer', (data, ack) => {
        try {
            appState.timers = { ...appState.timers, ...data };
            socket.broadcast.emit('stateUpdate', appState);
            if (ack) ack({ status: 'ok' });
            saveState();
        } catch (e) {
            if (ack) ack({ status: 'error', message: e.message });
        }
    });

    socket.on('updateScene', (data, ack) => {
        try {
            appState.currentScene = { ...appState.currentScene, ...data };
            socket.broadcast.emit('stateUpdate', appState);
            if (ack) ack({ status: 'ok' });
            saveState();
        } catch (e) {
            if (ack) ack({ status: 'error', message: e.message });
        }
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
        const nets = getNetworkInfo();
        console.log(`\n🚀 EnvoysOS v1.2.2 Production Ready`);
        console.log(` Port: ${PORT}`);
        console.log(` Bound: 0.0.0.0`);
    });
});

// Production Serving
const clientPath = path.join(__dirname, '../client/dist');
if (fs.pathExistsSync(clientPath)) {
    app.use(express.static(clientPath));
    app.get(/.*/, (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
        res.sendFile(path.join(clientPath, 'index.html'));
    });
}
