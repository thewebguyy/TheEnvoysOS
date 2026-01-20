import { create } from 'zustand';
import { io } from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3001');

const useStore = create((set, get) => ({
    timers: {
        segment: { duration: 1200, remaining: 1200, running: false, type: 'countdown' },
        target: { targetTime: '12:00', remaining: 0, running: false, type: 'target' },
        elapsed: { seconds: 0, running: false, type: 'elapsed' }
    },
    currentScene: {
        background: null,
        overlayText: '',
        timerVisible: true
    },
    media: [],
    isConnected: false,

    setTimers: (timers) => set({ timers }),
    setScene: (scene) => set({ currentScene: scene }),
    setMedia: (media) => set({ media }),

    fetchMedia: async () => {
        try {
            const res = await axios.get('http://localhost:3001/api/media');
            set({ media: res.data });
        } catch (err) {
            console.error('Failed to fetch media', err);
        }
    },

    updateTimer: (timerKey, data) => {
        const newTimers = { ...get().timers, [timerKey]: { ...get().timers[timerKey], ...data } };
        set({ timers: newTimers }); // Update local state immediately for responsiveness
        socket.emit('updateTimer', { [timerKey]: newTimers[timerKey] });
    },

    updateScene: (data) => {
        const newScene = { ...get().currentScene, ...data };
        set({ currentScene: newScene });
        socket.emit('updateScene', data);
    }
}));

socket.on('connect', () => {
    useStore.setState({ isConnected: true });
    useStore.getState().fetchMedia();
});

socket.on('disconnect', () => {
    useStore.setState({ isConnected: false });
});

socket.on('stateUpdate', (state) => {
    useStore.setState({ timers: state.timers, currentScene: state.currentScene });
});

socket.on('mediaAdded', (newMedia) => {
    useStore.setState((state) => ({ media: [...state.media, newMedia] }));
});

export default useStore;
