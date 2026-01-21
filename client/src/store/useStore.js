import { create } from 'zustand';
import { io } from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';

// Dynamic host discovery
const isProd = import.meta.env.PROD;
const VITE_API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = VITE_API_URL || (isProd ? window.location.origin : `http://${window.location.hostname}:3001`);

console.log(`[Store] Initializing connection to: ${BASE_URL}`);

const socket = io(BASE_URL, {
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000,
    transports: ['websocket'],
    forceNew: true
});

socket.on('connect', () => {
    console.log('[Socket] Connected to Envoys Hub:', socket.id);
});

socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
});

socket.on('reconnect_attempt', (attempt) => {
    console.log(`[Socket] Reconnection attempt ${attempt}`);
});

const useStore = create((set, get) => ({
    timers: {
        segment: { duration: 1200, remaining: 1200, running: false, type: 'countdown' },
        target: { targetTime: '12:00', remaining: 0, running: false, type: 'target' },
        elapsed: { seconds: 0, running: false, type: 'elapsed' }
    },
    currentScene: {
        background: null,
        overlayText: '',
        timerVisible: true,
        theme: 'default',
        chromaKey: false,
        positions: { timer: 'center', overlay: 'top' }
    },
    media: [],
    storageStats: { usage: 0, quota: 0 },
    isConnected: false,
    isLoading: true,
    isSyncing: false,
    lastValidState: null,

    // Actions
    fetchMedia: async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/media`);
            set({ media: res.data.media, storageStats: { usage: res.data.usage, quota: res.data.quota } });
        } catch (err) {
            toast.error('Could not load media library');
        } finally {
            set({ isLoading: false });
        }
    },

    deleteMedia: async (id) => {
        try {
            await axios.delete(`${BASE_URL}/api/media/${id}`);
            toast.success('Media deleted');
        } catch (err) {
            toast.error('Failed to delete media');
        }
    },

    updateTimer: async (timerKey, data) => {
        const state = get();
        const previousTimers = { ...state.timers };
        const newTimers = { ...state.timers, [timerKey]: { ...state.timers[timerKey], ...data } };

        // Optimistic update
        set({ timers: newTimers, isSyncing: true });

        socket.emit('updateTimer', { [timerKey]: newTimers[timerKey] }, (response) => {
            set({ isSyncing: false });
            if (response?.status === 'error') {
                set({ timers: previousTimers });
                toast.error(`Sync failed: ${response.message}`);
            }
        });
    },

    updateScene: (data) => {
        const state = get();
        const previousScene = { ...state.currentScene };
        const newScene = { ...state.currentScene, ...data };

        set({ currentScene: newScene, isSyncing: true });

        socket.emit('updateScene', data, (response) => {
            set({ isSyncing: false });
            if (response?.status === 'error') {
                set({ currentScene: previousScene });
                toast.error('Scene sync failed');
            }
        });
    },

    resetAll: () => {
        socket.emit('resetAll', (response) => {
            if (response?.status === 'ok') {
                toast.success('System reset complete');
            }
        });
    },

    // Local Client-Side heartbeat
    tick: () => {
        const { timers } = get();
        let changed = false;
        const newTimers = { ...timers };

        if (newTimers.segment.running) {
            if (newTimers.segment.behavior === 'stop') {
                if (newTimers.segment.remaining > 0) {
                    newTimers.segment.remaining -= 1;
                    changed = true;
                } else {
                    newTimers.segment.running = false;
                    changed = true;
                }
            } else {
                newTimers.segment.remaining -= 1;
                changed = true;
            }
        }

        if (newTimers.elapsed.running) {
            newTimers.elapsed.seconds += 1;
            changed = true;
        }

        const now = new Date();
        const [tH, tM] = newTimers.target.targetTime.split(':').map(Number);
        let tD = new Date();
        tD.setHours(tH, tM, 0, 0);
        if (tD < now) tD.setDate(tD.getDate() + 1);
        const diff = Math.floor((tD - now) / 1000);
        if (newTimers.target.remaining !== diff) {
            newTimers.target.remaining = diff;
            changed = true;
        }

        if (changed) {
            set({ timers: newTimers });
        }
    }
}));

// Local precision interval
setInterval(() => {
    useStore.getState().tick();
}, 1000);

// Socket Listeners
socket.on('connect', () => {
    set({ isConnected: true });
    useStore.getState().fetchMedia();
    toast.success('Connected to Envoys Hub');
});

socket.on('disconnect', () => {
    set({ isConnected: false });
    toast.error('Lost connection to Hub.');
});

socket.on('stateUpdate', (state) => {
    if (!useStore.getState().isSyncing) {
        useStore.setState({ timers: state.timers, currentScene: state.currentScene });
    }
});

socket.on('mediaAdded', (newMedia) => {
    useStore.setState((state) => ({ media: [newMedia, ...state.media] }));
});

socket.on('mediaDeleted', (id) => {
    useStore.setState((state) => ({
        media: state.media.filter(m => m.id.toString() !== id.toString())
    }));
});

export { BASE_URL };
export default useStore;
