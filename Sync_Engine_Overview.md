# Sync Engine Architecture & Implementation Overview

We have successfully built the **Sync Engine**, a robust, asynchronous system for distributing processed clips to external platforms. This implementation follows a modular, plugin-based architecture, starting with a simulated YouTube adapter.

## 1. Architectural Design

The system implements a **Worker-Job pattern**:
- **Sync Manager (`core/sync/index.js`)**: Orchestrates the sync lifecycle, handles platform adapter registration, and manages the background worker loop.
- **Platform Adapters (`core/sync/adapters/`)**: Plugin-style infrastructure. Each adapter is independent and follows a common interface (`name` and `upload(clip)`).
- **Background Worker**: An internal loop in the Sync Manager picks up any `PENDING` jobs, ensuring that distribution happens independently of the main API request lifecycle.

## 2. Updated Data Model

The Prisma schema in `core/prisma/schema.prisma` has been extended:
- **`Clip` model**: Added fields for `exportUrl`, `error`, `exportedAt`, and a relation to `SyncJob`.
- **`SyncJob` model**: Added to track the specific lifecycle of a synchronization attempt (`PENDING`, `PROCESSING`, `DONE`, `FAILED`).

## 3. Sync Status Flow

We've implemented a strict, non-reversible (mostly) status pipeline:
- `DRAFT`: Initial creation.
- `READY`: Operator has finalized the clip details and metadata.
- `PROCESSING`: Sync Job has started; the system is uploading/exporting to the external platform.
- `EXPORTED`: Success! A mock URL is returned.
- `FAILED`: Error occurred during sync (with error message stored for retry).

## 4. API Endpoints

Integrated into the core server:
- `POST /api/clips/:id/sync`: Triggers a sync job for a READY clip. Returns the created `SyncJob` immediately.
- `GET /api/clips/:id/status`: Polls for the current sync status and any external URLs or errors.

## 5. PulpitOS UI Integration

The interface has been upgraded to support the distribution workflow:
- **Export Button**: Only appears for `READY` or `FAILED` clips.
- **Processing States**: Real-time feedback with a spinning loader and "Syncing..." status.
- **Success State**: Links directly to the external export URL (simulated YouTube link).
- **Failure Handling**: Displays exact error messages with the ability to retry.

## 6. How to Run & Verify

1. **Database Update**:
   Run the following to update your local Prisma client and DB (ensure standard env variables are set):
   ```bash
   npx prisma generate
   npx prisma db push --schema=prisma/schema.prisma
   ```

2. **Start the Core Server**:
   ```bash
   npm run dev --workspace=@envoys/server
   ```
   You should see `[SyncEngine] Registered adapter: YOUTUBE` in the logs.

3. **Trigger an Export**:
   In PulpitOS, mark a clip as **READY**, then click the **Export** button. The clip will transition to **PROCESSING** for 2-5 seconds, then yield a mocked YouTube URL.
