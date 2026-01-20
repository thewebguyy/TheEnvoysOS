import { create } from 'zustand';
import { io } from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';

// Dynamic host discovery
const PROTOCOL = window.location.protocol;
const HOSTNAME = window.location.hostname;
const PORT = '3001';
const BASE_URL = `${PROTOCOL}//${HOSTNAME}:${PORT}`;

const socket = io(BASE_URL);

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
        theme: 'default'
    },
    media: [],
    isConnected: false,
    isLoading: true,

    // Actions
    fetchMedia: async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/media`);
            set({ media: res.data });
        } catch (err) {
            console.error('Failed to fetch media', err);
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

    updateTimer: (timerKey, data) => {
        const newTimers = { ...get().timers, [timerKey]: { ...get().timers[timerKey], ...data } };
        // Optimistic update
        set({ timers: newTimers });
        socket.emit('updateTimer', { [timerKey]: newTimers[timerKey] });
    },

    updateScene: (data) => {
        const newScene = { ...get().currentScene, ...data };
        set({ currentScene: newScene });
        socket.emit('updateScene', data);
    },

    pushToLive: () => {
        // Implementation for staged scenes can go here
        toast.success('Changes pushed to live');
    },

    resetAll: () => {
        socket.emit('resetAll');
        toast('System reset', { icon: '🔄' });
    }
}));

// Socket Listeners
socket.on('connect', () => {
    set({ isConnected: true });
    useStore.getState().fetchMedia();
});

socket.on('disconnect', () => {
    set({ isConnected: false });
});

socket.on('stateUpdate', (state) => {
    useStore.setState({ timers: state.timers, currentScene: state.currentScene });
});

socket.on('mediaAdded', (newMedia) => {
    useStore.setState((state) => ({ media: [newMedia, ...state.media] }));
    toast.success('New media uploaded');
});

socket.on('mediaDeleted', (id) => {
    useStore.setState((state) => ({
        media: state.media.filter(m => m.id.toString() !== id.toString())
    }));
});

export { BASE_URL };
export default useStore;
