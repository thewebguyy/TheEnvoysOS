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
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('media'), async (req, res) => {
    const { filename, mimetype, originalname } = req.file;
    const result = await db.run(
        'INSERT INTO media (name, path, type) VALUES (?, ?, ?)',
        [originalname, `/uploads/${filename}`, mimetype]
    );
    const newMedia = { id: result.lastID, name: originalname, path: `/uploads/${filename}`, type: mimetype };
    io.emit('mediaAdded', newMedia);
    res.json(newMedia);
});

app.get('/api/media', async (req, res) => {
    const media = await db.all('SELECT * FROM media');
    res.json(media);
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let db;

(async () => {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      path TEXT,
      type TEXT
    );
  `);
})();

// Global state for timers
let appState = {
    timers: {
        segment: { duration: 1200, remaining: 1200, running: false, type: 'countdown' },
        target: { targetTime: '12:00', remaining: 0, running: false, type: 'target' },
        elapsed: { seconds: 0, running: false, type: 'elapsed' }
    },
    currentScene: {
        background: null,
        overlayText: '',
        timerVisible: true
    }
};

// Ticker logic (runs every 1 second)
setInterval(() => {
    let changed = false;

    // Segment Countdown
    if (appState.timers.segment.running && appState.timers.segment.remaining > 0) {
        appState.timers.segment.remaining -= 1;
        changed = true;
    }

    // Elapsed Timer
    if (appState.timers.elapsed.running) {
        appState.timers.elapsed.seconds += 1;
        changed = true;
    }

    // Target Time Countdown
    const now = new Date();
    const [targetH, targetM] = appState.timers.target.targetTime.split(':').map(Number);
    const targetDate = new Date();
    targetDate.setHours(targetH, targetM, 0, 0);

    // If target time is earlier today, assume it's tomorrow (or just handle it)
    // For simplicity, let's just do a basic diff for now
    const diff = Math.floor((targetDate - now) / 1000);
    if (appState.timers.target.running) {
        appState.timers.target.remaining = diff > 0 ? diff : 0;
        changed = true;
    }

    if (changed) {
        io.emit('stateUpdate', appState);
    }
}, 1000);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.emit('stateUpdate', appState);

    socket.on('updateTimer', (data) => {
        appState.timers = { ...appState.timers, ...data };
        io.emit('stateUpdate', appState);
    });

    socket.on('updateScene', (data) => {
        appState.currentScene = { ...appState.currentScene, ...data };
        io.emit('stateUpdate', appState);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
