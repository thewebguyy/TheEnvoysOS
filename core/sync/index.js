/**
 * Sync Engine Manager
 */
const { prisma } = require('../db');
const path = require('path');
const fs = require('fs');

const adapters = {};

// Register adapters automatically from the directory
function registerAdapters() {
    const adaptersPath = path.join(__dirname, 'adapters');
    if (!fs.existsSync(adaptersPath)) return;
    
    const files = fs.readdirSync(adaptersPath);
    
    files.forEach(file => {
        if (file.endsWith('.js')) {
            const adapterPath = path.join(adaptersPath, file);
            const adapter = require(adapterPath);
            adapters[adapter.name.toUpperCase()] = adapter;
            console.log(`[SyncEngine] Registered adapter: ${adapter.name.toUpperCase()}`);
        }
    });
}

/**
 * Trigger clip sync
 * @param {string} clipId - DB ID of the clip
 */
async function triggerSync(clipId) {
    try {
        const clip = await prisma.clip.findUnique({
            where: { id: clipId }
        });
        
        if (!clip) throw new Error("Clip not found");
        
        // Allow re-syncing if failed or ready
        if (clip.status !== 'READY' && clip.status !== 'FAILED') {
             throw new Error(`Clip status is ${clip.status}. Must be READY or FAILED to sync.`);
        }
        
        // Create job record
        const job = await prisma.syncJob.create({
            data: {
                clipId,
                status: 'PENDING'
            }
        });
        
        // Kick off sync in background (non-blocking)
        // We don't await this so the API returns immediately
        processSyncJob(job.id).catch(err => {
            console.error(`[SyncEngine] Error in background process for job ${job.id}:`, err);
        });
        
        return job;
    } catch (e) {
        throw new Error(`Sync trigger failed: ${e.message}`);
    }
}

/**
 * Background worker logic for a single job
 * @param {string} jobId 
 */
async function processSyncJob(jobId) {
    const job = await prisma.syncJob.findUnique({
        where: { id: jobId },
        include: { clip: true }
    });
    
    if (!job) return;
    
    try {
        console.log(`[SyncEngine] Processing job: ${jobId} for clip: ${job.clip.title}`);
        
        // Mark clip and job as processing
        await prisma.$transaction([
            prisma.syncJob.update({ where: { id: jobId }, data: { status: 'PROCESSING' } }),
            prisma.clip.update({ where: { id: job.clipId }, data: { status: 'PROCESSING', error: null } })
        ]);
        
        const platform = job.clip.platform ? job.clip.platform.toUpperCase() : 'YOUTUBE';
        const adapter = adapters[platform];
        
        if (!adapter) {
            throw new Error(`Platform adapter not found: ${platform}`);
        }
        
        const result = await adapter.upload(job.clip);
        
        // Finalize sync as DONE
        await prisma.$transaction([
            prisma.syncJob.update({ where: { id: jobId }, data: { status: 'DONE' } }),
            prisma.clip.update({
                where: { id: job.clipId },
                data: {
                    status: 'EXPORTED',
                    exportUrl: result.url,
                    exportedAt: new Date(),
                    error: null
                }
            })
        ]);
        
        console.log(`[SyncEngine] Job ${jobId} finished successfully.`);
    } catch (e) {
        console.error(`[SyncEngine] Job ${jobId} failed:`, e.name, e.message);
        
        // Handle failure
        await prisma.$transaction([
            prisma.syncJob.update({ 
                where: { id: jobId }, 
                data: { 
                    status: 'FAILED',
                    error: e.message
                } 
            }),
            prisma.clip.update({
                where: { id: job.clipId },
                data: {
                    status: 'FAILED',
                    error: e.message
                }
            })
        ]);
    }
}

// Worker Polling (Optional independent loop)
function startWorker() {
    console.log(`[SyncEngine] Worker initialized. Monitoring for PENDING sync jobs...`);
    setInterval(async () => {
        try {
            const pendingJobs = await prisma.syncJob.findMany({
                where: { status: 'PENDING' },
                take: 5
            });
            
            for (const job of pendingJobs) {
                 // processSyncJob handles re-marking to avoid duplicates
                 processSyncJob(job.id).catch(err => {
                     console.error(`[SyncEngine] Background worker error for job ${job.id}:`, err.message);
                 });
            }
        } catch (e) {
            // Silently handle if Prisma not connected yet during boot
        }
    }, 10000); // Check every 10s
}

// Initial Registration
registerAdapters();
startWorker();

module.exports = {
    triggerSync,
    getAdapters: () => Object.keys(adapters)
};

