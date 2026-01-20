import React from 'react';
import useStore from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

const Stream = () => {
    const { timers, currentScene } = useStore();

    const formatTime = (seconds) => {
        const mins = Math.floor(Math.abs(seconds) / 60);
        const secs = Math.floor(Math.abs(seconds) % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!currentScene.timerVisible) return null;

    return (
        <div className="h-screen w-full bg-transparent flex items-end justify-end p-12">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-6 bg-black/80 backdrop-blur-md px-10 py-6 rounded-2xl border-l-8 border-primary shadow-2xl"
            >
                <div className="flex flex-col">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Live Segment</span>
                    <span className="text-6xl font-mono font-bold text-white tabular-nums tracking-tighter">
                        {formatTime(timers.segment.remaining)}
                    </span>
                </div>

                {/* Progress Bar (Radial) */}
                <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="white"
                            strokeWidth="4"
                            fill="transparent"
                            className="opacity-10"
                        />
                        <motion.circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray="175.9"
                            animate={{ strokeDashoffset: 175.9 * (1 - (timers.segment.remaining / (timers.segment.duration || 1200))) }}
                            className="text-primary transition-all duration-1000 ease-linear"
                        />
                    </svg>
                </div>
            </motion.div>
        </div>
    );
};

export default Stream;
