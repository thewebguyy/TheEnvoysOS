/**
 * YouTube Sync Adapter (Simulated)
 */
const youtubeAdapter = {
    name: 'YOUTUBE',
    
    /**
     * Upload a clip to YouTube
     * @param {Object} clip - The clip record from DB
     * @returns {Promise<{ url: string, externalId: string }>}
     */
    async upload(clip) {
        console.log(`[SyncEngine] YouTube: Starting upload for clip "${clip.title}"`);
        
        // Simulate network latency (2-5 seconds)
        const delay = Math.floor(Math.random() * 3000) + 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Random failure chance (5%) for testing
        if (Math.random() < 0.05) {
            throw new Error("Simulated YouTube API Error: Rate Limit Exceeded");
        }
        
        // Mock success
        const mockId = Math.random().toString(36).substring(7);
        const mockUrl = `https://youtube.com/watch?v=${mockId}`;
        
        console.log(`[SyncEngine] YouTube: Upload complete for "${clip.title}" -> ${mockUrl}`);
        
        return {
            url: mockUrl,
            externalId: mockId
        };
    }
};

module.exports = youtubeAdapter;
