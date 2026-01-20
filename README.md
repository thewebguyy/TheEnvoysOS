# TheEnvoysOS 🚀

**TheEnvoysOS** is a lightweight, web-based live production tool for church media teams. It's a time-first orchestration system designed to manage countdown timers, visual overlays, and multi-output displays during worship services.

Optimized for resource-limited environments (e.g., Lagos, Nigeria), it works on low-spec hardware and provides real-time synchronization across multiple browser-based displays on a local LAN.

## ✨ Features

- **Triple Timer System**:
  - **Segment Countdown**: For specific service parts (e.g., Sermon, Worship).
  - **Target Time**: Countdown to a specific clock time (e.g., Service Start).
  - **Elapsed Timer**: Stopwatch for tracking total service duration.
- **Multi-Output Routing**:
  - `/audience`: High-impact, bold timers + media backgrounds for main screens.
  - `/stage`: Confidence monitor for pastors with system clock and notes.
  - `/stream`: Transparent overlay for OBS integration.
- **Scene Management**: Dynamic background switching (Images/Videos) and animated text overlays.
- **Offline-First & Local LAN**: Runs locally on a basic laptop; no internet required once setup.
- **Real-Time Collaboration**: Multiple controllers can connect via phone/tablet to adjust timers on the fly.

## 🛠 Tech Stack

- **Frontend**: React.js, Tailwind CSS, Framer Motion, Zustand.
- **Backend**: Node.js, Express, Socket.io (Real-time sync).
- **Storage**: SQLite3 (Local persistence).
- **Media**: Browser-native HTML5 Video/Image handling.

## 🚀 Quick Start

### Prerequisites
- Node.js installed on the host machine.

### Installation & Setup
1. Clone the repository.
2. Install dependencies for both server and client:
   ```bash
   # Root directory
   npm install
   
   # Server directory
   cd server && npm install
   
   # Client directory
   cd ../client && npm install
   ```

### Running the App
From the root directory, run:
```bash
npm start
```
- **Operator Dashboard**: `http://localhost:5173`
- **Audience Display**: `http://localhost:5173/audience`
- **Stage Monitor**: `http://localhost:5173/stage`
- **OBS Overlay**: `http://localhost:5173/stream`

*To access from other devices (Smart TVs, Tablets), use the host laptop's IP address (e.g., `http://192.168.1.5:5173`).*

## 📦 Deployment for Low-Spec Hardware

TheEnvoysOS is designed to be extremely "lean":
- **Low CPU Usage**: Real-time logic is handled via efficient WebSockets.
- **Browser-Native**: No heavy Electron wrappers or native installs required.
- **PWA Support**: Can be "installed" as a web app on most devices.

## 📜 License
MIT
