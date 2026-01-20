require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// Serve production build of client
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
}

// Multer storage config with validation
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 50 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, WEBP, MP4, and WEBM are allowed.'));
        }
    }
});

// Database Setup
let db;
let appState = {
    timers: {
        segment: { duration: 1200, remaining: 1200, running: false, type: 'countdown', autoStop: true, behavior: 'stop' }, // behavior: 'stop' or 'overrun'
        target: { targetTime: '12:00', remaining: 0, running: false, type: 'target' },
        elapsed: { seconds: 0, running: false, type: 'elapsed', autoStopAt: null }
    },
    currentScene: {
        background: null,
        overlayText: '',
        timerVisible: true,
        theme: 'default'
    }
};

async function initDB() {
    db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS state (
            id INTEGER PRIMARY KEY,
            data TEXT
        );
        CREATE TABLE IF NOT EXISTS media (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            path TEXT,
            type TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Load persisted state
    const savedState = await db.get('SELECT data FROM state WHERE id = 1');
    if (savedState) {
        const parsed = JSON.parse(savedState.data);
        // Merge logic to ensure new fields in schema are preserved
        appState = { ...appState, ...parsed };
        // Reset running states on boot for safety? Or keep them? 
        // Let's reset running to false but keep remaining/seconds
        appState.timers.segment.running = false;
        appState.timers.target.running = false;
        appState.timers.elapsed.running = false;
    }
}

async function saveState() {
    if (!db) return;
    await db.run('INSERT OR REPLACE INTO state (id, data) VALUES (1, ?)', JSON.stringify(appState));
}

// API Endpoints
app.post('/api/upload', upload.single('media'), async (req, res) => {
    try {
        const { filename, mimetype, originalname } = req.file;
        const result = await db.run(
            'INSERT INTO media (name, path, type) VALUES (?, ?, ?)',
            [originalname, `/uploads/${filename}`, mimetype]
        );
        const newMedia = { id: result.lastID, name: originalname, path: `/uploads/${filename}`, type: mimetype };
        io.emit('mediaAdded', newMedia);
        res.json(newMedia);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/media', async (req, res) => {
    const media = await db.all('SELECT * FROM media ORDER BY createdAt DESC');
    res.json(media);
});

app.delete('/api/media/:id', async (req, res) => {
    const item = await db.get('SELECT * FROM media WHERE id = ?', req.params.id);
    if (item) {
        const filePath = path.join(__dirname, item.path);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await db.run('DELETE FROM media WHERE id = ?', req.params.id);
        io.emit('mediaDeleted', req.params.id);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Media not found' });
    }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Ticker Logic (Precision heartbeat)
setInterval(() => {
    let changed = false;

    // Segment Countdown
    if (appState.timers.segment.running) {
        if (appState.timers.segment.remaining > 0) {
            appState.timers.segment.remaining -= 1;
            changed = true;
        } else if (appState.timers.segment.behavior === 'overrun') {
            appState.timers.segment.remaining -= 1; // Goes negative
            changed = true;
        } else {
            appState.timers.segment.running = false;
            changed = true;
        }
    }

    // Elapsed Timer
    if (appState.timers.elapsed.running) {
        appState.timers.elapsed.seconds += 1;
        if (appState.timers.elapsed.autoStopAt && appState.timers.elapsed.seconds >= appState.timers.elapsed.autoStopAt) {
            appState.timers.elapsed.running = false;
        }
        changed = true;
    }

    // Target Time Calculation
    const now = new Date();
    const [targetH, targetM] = appState.timers.target.targetTime.split(':').map(Number);
    let targetDate = new Date();
    targetDate.setHours(targetH, targetM, 0, 0);

    // If target is in the past, it's for tomorrow
    if (targetDate < now) {
        targetDate.setDate(targetDate.getDate() + 1);
    }

    const diff = Math.floor((targetDate - now) / 1000);
    if (appState.timers.target.remaining !== diff) {
        appState.timers.target.remaining = diff;
        changed = true;
    }

    if (changed) {
        io.emit('stateUpdate', appState);
    }
}, 1000);

// Auto-save state every 30 seconds
setInterval(saveState, 30000);

io.on('connection', (socket) => {
    socket.emit('stateUpdate', appState);

    socket.on('updateTimer', (data) => {
        appState.timers = { ...appState.timers, ...data };
        io.emit('stateUpdate', appState);
        saveState();
    });

    socket.on('updateScene', (data) => {
        appState.currentScene = { ...appState.currentScene, ...data };
        io.emit('stateUpdate', appState);
        saveState();
    });

    socket.on('resetAll', async () => {
        appState.timers.segment.remaining = appState.timers.segment.duration;
        appState.timers.segment.running = false;
        appState.timers.elapsed.seconds = 0;
        appState.timers.elapsed.running = false;
        io.emit('stateUpdate', appState);
        saveState();
    });
});

const PORT = process.env.PORT || 3001;
initDB().then(() => {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
});

// Fallback for SPA routing in production
if (fs.existsSync(clientDist)) {
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}
