# EnvoysOS 🚀 (v2.0 Pro - Production Ready)

**EnvoysOS** is a master-class, web-based live production tool for church media teams. It's designed for mission-critical reliability, providing a high-performance orchestration system for timers, visuals, and overlays.

---

## 🔥 New in v2.0 (Pro)
- **Role-Based Security**: Secure JWT-based authentication for Administrators vs Volunteers.
- **Visual Confidence**: Chroma Key indicators and active staging alerts for collaborative environments.
- **Production Resiliency**: Connection hardening with exponential backoff and action queueing.
- **Mobile Orchestration**: All-new responsive sidebar and touch-optimized controls for iPad/Tablet use.
- **Advanced State Management**: Unified Scene/Timer Undo-Redo system (50-step stack).
- **Security Hardened**: uuidv4 file paths, rate-limiting on uploads, and schema migrations.

---

## ✨ Core Displays
- **`/` (Dashboard)**: The Master Commander. Control hub with Stage Preparation (Preview) mode.
- **`/audience`**: High-impact viewer for projectors. 
- **`/stage`**: Confidence monitor with massive timers and system clock.
- **`/stream`**: Transparent OBS overlay with chroma-key confirmation.

---

## 🛠 Tech Stack
- **Frontend**: React 19, Tailwind CSS, Framer Motion, Zustand.
- **Backend**: Node.js, Socket.io v4, SQLite3, Multer, Express 5.
- **Security**: JWT, Helmet, CSRF protection, UUIDs.

---

## 🚀 Deployment

### Quick Start
1. `npm install` in both `client` and `server` folders.
2. Build client: `cd client && npm run build`.
3. Start server: `cd server && node index.js`.

### Environment Config (`server/.env`)
```env
PORT=3001
JWT_SECRET=your-secret-here
ADMIN_PASSWORD=your-admin-password
STORAGE_QUOTA_MB=5000
```

---

## 🎹 Keyboard Shortcuts
| Key | Action |
| --- | --- |
| `SPACE` | Toggle Active Segment Timer |
| `1-9` | Set Timer Preset (5m to 45m) |
| `ESC` | Emergency Scene Clear |
| `CTRL+Z / Y` | Global Undo / Redo |
| `P` | Toggle Preview / Live Mode |
| `?` | Show Shortcuts Helper |

---

## 📜 License
MIT | Built for the global church.
