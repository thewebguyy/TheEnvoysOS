# EnvoysOS 🚀 (v1.1)

**EnvoysOS** is a master-class, web-based live production tool for church media teams. It's designed to replace complex hardware with a lean, browser-first orchestration system for timers and visuals, optimized for resource-limited environments (e.g., Lagos churches).

---

## 🔥 New in v1.1
- **Persistence Engine**: Native SQLite storage saves your timer states and library even after a power cut.
- **Smart Target Logic**: Countdown to a specific time correctly, even past midnight.
- **Precision Segment Timer**: Toggle between "Hard Stop" and "Overrun" (counts negative with red alerts).
- **Control Shortcuts**: Hit `SPACE` to pause/start your active segment timer.
- **Content Manager**: Full delete capability, 50MB file validation, and instant "GO LIVE" previews.
- **Unified Branding**: Premium dark-mode UI with consistent fonts and glassmorphism.
- **Production Routing**: Backend now correctly serves built frontend files for single-command deployment.

---

## ✨ Core Features
- **Triple-Timer Sync**: Segment (Sermon), Target (Service End), and Elapsed (Total) timers.
- **Multi-View Outputs**:
  - `/audience`: Cinematic display for projectors.
  - `/stage`: High-visibility monitor for pastors (System Clock + Notes).
  - `/stream`: Low-third overlay with alpha-transparency (OBS ready).
- **Collaborative**: Connect infinite devices on the same LAN (Smart TVs, Tablets, Phones).

---

## 🛠 Tech Stack
- **Frontend**: React 19, Tailwind CSS, Framer Motion, Zustand.
- **Backend*: Node.js, Express, Socket.io, SQLite3.
- **Security**: `.env` configuration for secrets and ports.

---

## 🚀 One-Step Setup

### 1. Installation
```bash
# Clone and install dependencies
git clone <repo-url>
cd TheEnvoysOS
npm run setup
```

### 2. Configuration
Create a `.env` file in the root (already generated if using this AI):
```env
PORT=3001
JWT_SECRET=your_secret
ADMIN_PASSWORD=admin123
```

### 3. Start Orchestrator
```bash
npm start
```

---

## 📺 Outputs
- **Operator Hub**: `http://localhost:3001` (or your IP)
- **Audience**: `http://localhost:3001/audience`
- **Stage**: `http://localhost:3001/stage`
- **OBS**: `http://localhost:3001/stream`

---

## 🎹 Keyboard Shortcuts
| Key | Action |
| --- | --- |
| `SPACE` | Toggle Active Segment Timer (Play/Pause) |
| `R` | Reset System (Coming soon) |

---

## 📜 License
MIT | Built for the global church by Antigravity.
