import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { io } from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';

// Dynamic host discovery
const isProd = import.meta.env.PROD;
const VITE_API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = VITE_API_URL || (isProd ? '' : `http://${window.location.hostname}:3001`);

console.log(`[Store] Initializing connection${BASE_URL ? ' to: ' + BASE_URL : ' (Same Domain)'}`);

const socket = io(BASE_URL, {
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000,
    autoConnect: true
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

const useStore = create(persist((set, get) => ({
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
    stagedScene: null, // Scene being prepared in Preview Mode
    previewMode: false,
    media: [],
    storageStats: { usage: 0, quota: 0 },
    isConnected: false,
    isLoading: true,
    isSyncing: false,
    actionQueue: [], // Queue for offline sync
    undoStack: [],
    redoStack: [],
    presets: [],

    // Actions
    savePreset: (name) => {
        const { currentScene, presets } = get();
        const newPreset = { id: Date.now(), name, scene: { ...currentScene } };
        set({ presets: [...presets, newPreset] });
        toast.success(`Preset "${name}" saved`);
    },

    loadPreset: (id) => {
        const { presets } = get();
        const preset = presets.find(p => p.id === id);
        if (preset) {
            get().updateScene(preset.scene);
            toast.success(`Loaded "${preset.name}"`);
        }
    },

    deletePreset: (id) => {
        set((state) => ({ presets: state.presets.filter(p => p.id !== id) }));
        toast.success('Preset removed');
    },

    setPreviewMode: (enabled) => {
        const { currentScene } = get();
        set({
            previewMode: enabled,
            stagedScene: enabled ? { ...currentScene } : null
        });
    },

    goLive: () => {
        const { stagedScene, previewMode } = get();
        if (previewMode && stagedScene) {
            get().updateScene(stagedScene, true); // Force update to live
            toast.success('Scene is now LIVE');
        }
    },

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

    processQueue: () => {
        const { actionQueue, isConnected } = get();
        if (!isConnected || actionQueue.length === 0) return;

        console.log(`[Sync] Processing ${actionQueue.length} queued actions...`);
        const queue = [...actionQueue];
        set({ actionQueue: [] });

        queue.forEach(action => {
            if (action.type === 'scene') get().updateScene(action.data, true);
            if (action.type === 'timer') get().updateTimer(action.key, action.data, true);
        });
    },

    updateTimer: async (timerKey, data, forceLive = false) => {
        const state = get();
        if (!state.isConnected && !forceLive) {
            set({ actionQueue: [...state.actionQueue, { type: 'timer', key: timerKey, data }] });
            toast('Offline: Queuing timer change', { icon: '⏳' });
        }

        const previousTimers = { ...state.timers };
        const newTimers = { ...state.timers, [timerKey]: { ...state.timers[timerKey], ...data } };

        set({ timers: newTimers, isSyncing: true });

        socket.emit('updateTimer', { [timerKey]: newTimers[timerKey] }, (response) => {
            set({ isSyncing: false });
            if (response?.status === 'error') {
                set({ timers: previousTimers });
                toast.error(`Sync failed: ${response.message}`);
            }
        });
    },

    updateScene: (data, forceLive = false) => {
        const state = get();

        // Handling Preview Mode
        if (state.previewMode && !forceLive) {
            set({ stagedScene: { ...state.stagedScene, ...data } });
            return;
        }

        // Connection Resilience
        if (!state.isConnected && !forceLive) {
            set({ actionQueue: [...state.actionQueue, { type: 'scene', data }] });
            toast('Offline: Queuing scene change', { icon: '⏳' });
        }

        const previousScene = { ...state.currentScene };
        const newScene = { ...state.currentScene, ...data };

        // Undo Logic
        if (!forceLive) {
            set({
                undoStack: [...state.undoStack, previousScene].slice(-50),
                redoStack: []
            });
        }

        set({ currentScene: newScene, isSyncing: true });

        socket.emit('updateScene', data, (response) => {
            set({ isSyncing: false });
            if (response?.status === 'error') {
                set({ currentScene: previousScene });
                toast.error('Scene sync failed');
            }
        });
    },

    undo: () => {
        const { undoStack, currentScene } = get();
        if (undoStack.length === 0) return;
        const prevState = undoStack[undoStack.length - 1];
        const newUndoStack = undoStack.slice(0, -1);
        set({
            undoStack: newUndoStack,
            redoStack: [...get().redoStack, currentScene]
        });
        get().updateScene(prevState, true);
    },

    redo: () => {
        const { redoStack, currentScene } = get();
        if (redoStack.length === 0) return;
        const nextState = redoStack[redoStack.length - 1];
        const newRedoStack = redoStack.slice(0, -1);
        set({
            redoStack: newRedoStack,
            undoStack: [...get().undoStack, currentScene]
        });
        get().updateScene(nextState, true);
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
            newTimers.segment.remaining -= 1;
            changed = true;
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
}), {
    name: 'envoys-storage',
    partialize: (state) => ({ timers: state.timers, currentScene: state.currentScene })
}));


// Local precision interval
setInterval(() => {
    useStore.getState().tick();
}, 1000);

// Socket Listeners
socket.on('connect', () => {
    useStore.setState({ isConnected: true });
    useStore.getState().fetchMedia();
    useStore.getState().processQueue();
    toast.success('Connected to Envoys Hub');
});

socket.on('disconnect', () => {
    useStore.setState({ isConnected: false });
    toast.error('Lost connection to Hub.');
});

socket.on('stateUpdate', (partialState) => {
    if (!useStore.getState().isSyncing) {
        useStore.setState((state) => ({
            timers: partialState.timers || state.timers,
            currentScene: partialState.currentScene || state.currentScene
        }));
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
