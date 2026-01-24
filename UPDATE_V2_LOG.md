# EnvoysOS v2.0.0 Pro - Unified Update Log

This update transitions EnvoysOS from a production-ready dashboard to a professional-grade, resilient production suite.

## 🚀 Categories of Improvements

### 1. Critical Stability (Crash Prevention)
*   **Broken Import Fix**: Resolved missing `Zap` import in `Dashboard.jsx`.
*   **Motion Fix**: Added missing `motion` import in `Stage.jsx` for timer overrun animations.
*   **Precision Under Pressure**: Timers now cap at -1800s rather than counting into infinity, preventing potential UI overflow.

### 2. High-Grade Security & Data Integrity
*   **JWT Authentication**: Transitioned from loose client-side roles to secure JWT-based auth via `/api/login`.
*   **Production Hardening**: Added `express-rate-limit` for file uploads (20/min) to prevent DoS.
*   **Secure File Storage**: Swapped `Date.now()` filenames for secure UUIDs (`uuidv4`).
*   **Backups & Export**: Increased rolling database backups from 5 to 20 copies. Added manual state export for secure configuration storage.
*   **Startup Validation**: Server now validates environment variables (PORT, JWT_SECRET) before binding.

### 3. Production Resiliency (Offline & Sync)
*   **Enhanced Offline Mode**: Global banner now provides granular feedback on queued changes.
*   **Collaborative Staging**: Implemented WebSocket-based conflict detection. Indicators show when another operator is staging changes.
*   **Precision Undo/Redo**: Extended stack to capture both Scene *and* Timer states synchronously.

### 4. UI/UX & Polish
*   **Mobile-First Sidebar**: Refactored sidebar into a professional slide-out drawer for better tablet/mobile tablet production.
*   **Discoverable Shortcuts**: Added a visible Keyboard Shortcuts button in the header with a comprehensive tooltip.
*   **Media Multi-Select**: Added a dedicated "Select Multiple" mode for bulk asset management.
*   **Visual Confidence**: Integrated Chroma Key indicators (green borders/badges) in the preview monitor.
*   **Speech Detection**: Toggle button now detects browser support for Chromium SpeechRecognition API.

### 5. Accessibility & Performance
*   **WCAG Standard**: Standardized high-contrast text by replacing `slate-500` with `slate-400`.
*   **Responsive Precision**: Grid layouts adjusted for better visibility on 1080p and 1440p displays.
*   **Dynamic Storage Quota**: Quota bar now grows, changes color (Green -> Yellow -> Red), and adds warnings when exceeding 80%.

---

## 📦 Updated Dependencies

### Server
- `jsonwebtoken`: Secure operator sessions.
- `uuid`: Secure filename generation.
- `express-rate-limit`: Protection against upload abuse.

### Client
- `use-undo`: Robust state management for complex undos.

---

## 🛠️ Deployment Checklist
1. [ ] **Update Environment**: Ensure `JWT_SECRET` and `ADMIN_PASSWORD` are set in the production `.env`.
2. [ ] **Migrate Database**: Run the server once to auto-apply schema version 2 migrations.
3. [ ] **Rebuild Frontend**: Run `npm run build` in `/client` to generate the new dist folder.
4. [ ] **Clean Media**: Optionally run a cleanup on older files as the new UUID naming scheme is now active.
5. [ ] **Validate Reconnection**: Ensure WebSocket backoff is functioning by toggling the server connectivity.

---

## 📖 Contributing Guide (Updated)
Please refer to `CONTRIBUTING.md` for the new section on **State Schema Migrations** and **Role-Based API Protection**.
