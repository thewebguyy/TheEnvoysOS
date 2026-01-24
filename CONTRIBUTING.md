# Contributing to EnvoysOS

Thank you for helping build the future of church production software.

## 🛠 Development Workflow

### 1. State Schema Migrations
EnvoysOS uses a schema versioning system. If you modify the `appState` structure or the SQLite database:
- Increment `CURRENT_SCHEMA_VERSION` in `server/index.js`.
- Add a migration handler in the `runMigrations()` function.
- Update the client-side `schemaVersion` and `migrate` logic in `useStore.js`.

### 2. Role-Based Protection
API security is enforced via JWT. 
- Always use the `authenticate` middleware on the server for sensitive routes (`/api/upload`, `/api/media/:id`, etc).
- Check the `role` in the `useStore` before rendering administrative buttons.

### 3. State Consistency
- Use the `undoStack` sparingly; avoid putting large binary artifacts into the history.
- Ensure all `timers` updates are performed via `updateTimer` to maintain synchronization across the Lagos Hub.

### 4. Accessibility (WCAG 2.1)
- Avoid using `text-slate-500` or lower contrast colors for essential labels.
- Standardize all action buttons to `rounded-2xl`.

## 🚀 Deployment Pitfalls
- **WS Backoff**: If the socket fails to connect, it will retry using exponential backoff (up to 30s). Do not hard-refresh during sync operations.
- **Port Binding**: Ensure the `PORT` env var is numeric. The server will crash deliberately if it encounters an invalid port to prevent silent failures.
