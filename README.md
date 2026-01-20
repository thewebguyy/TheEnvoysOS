# EnvoysOS 🚀 (v1.2 Production Hardened)

**EnvoysOS** is a master-class, web-based live production tool for church media teams. It's designed for mission-critical reliability on low-spec hardware, providing a lean orchestration system for timers and visuals.

---

## 🔥 New in v1.2 (Hardened)
- **State Resilience**: Precision SQLite persistence with automated timestamped backups.
- **Optimistic Sync**: Instant UI response with background synchronization and automatic error rollback.
- **Chroma Key Support**: Integrated green-screen mode for hardware mixers/blackmagic switchers.
- **Smart Connectivity**: Cross-network IP discovery—see exactly what URL to type on your iPad or Smart TV.
- **Storage Protection**: Configurable media quota and automatic file validation (Safety First).
- **Keyboard Mastery**: Hardened global shortcuts (e.g., `SPACE` to toggle segments) that respect text inputs.
- **Production Standard**: Helmet security, rate limiting, and Express 5 modern core for mission-critical uptime.

---

## ✨ Core Displays
- **`/` (Dashboard)**: The Master Commander. Control all timers, visuals, and media gallery.
- **`/audience`**: High-impact viewer for projectors. Supports video backgrounds and animated lower-thirds.
- **`/stage`**: High-contrast confidence monitor for the pulpit (Huge timers + system clock + notes).
- **`/stream`**: OBS-ready overlay with transparency/chroma options and smooth alpha-transitions.

---

## 🛠 Advanced Tech Stack
- **Frontend**: React 19, Tailwind CSS, Framer Motion, Zustand.
- **Backend**: Node.js 18+, Socket.io v4, SQLite3, Multer, Express 5.
- **Global**: i18next (English & Yoruba supported), Docker-ready.

---

## 🚀 Deployment

### Render / Vercel (Production)
**Build Command:**
```bash
cd client && npm install && npm run build && cd ../server && npm install
```
**Start Command:**
```bash
cd server && node index.js
```

### Quick Start (Local)
1. **Init**: `npm run setup`
2. **Start**: `npm start`
3. **Access**: Check the terminal logs for your local IP (e.g., `192.168.1.5:3001`).

### Environment Config (`server/.env`)
```env
PORT=10000
DB_PATH='./data.db'
UPLOAD_DIR='./uploads'
STORAGE_QUOTA_MB=1000
```

### Docker
```bash
docker build -t envoysos .
docker run -p 3001:3001 envoysos
```

---

## 🎹 Keyboard Shortcuts
| Key | Action |
| --- | --- |
| `SPACE` | Toggle Active Segment Timer |
| `CTRL+ALT+R` | (Coming) Global Hardware Reset |

---

## 📜 License
MIT | Built for the global church.
