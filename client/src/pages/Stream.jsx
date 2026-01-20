import React from 'react';
import useStore from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

const Stream = () => {
    const { timers, currentScene } = useStore();

    const formatTime = (seconds) => {
        const absSec = Math.floor(Math.abs(seconds));
        const mins = Math.floor(absSec / 60);
        const secs = absSec % 60;
        const sign = seconds < 0 ? '-' : '';
        return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const time = timers.segment.remaining;
    const isUrgent = time < 60 && time > 0;
    const isOverrun = time < 0;

    return (
        <div className="h-screen w-full bg-transparent flex flex-col justify-end p-12 overflow-hidden">
            <AnimatePresence>
                {currentScene.timerVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="flex flex-col items-start gap-4"
                    >
                        {currentScene.overlayText && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-black/90 backdrop-blur-xl px-8 py-3 rounded-2xl border-l-8 border-secondary shadow-2xl"
                            >
                                <p className="text-white text-3xl font-black uppercase tracking-tight leading-none">
                                    {currentScene.overlayText}
                                </p>
                            </motion.div>
                        )}

                        <div className={`bg-black/90 backdrop-blur-xl px-10 py-6 rounded-[2rem] border-l-[12px] shadow-2xl flex items-center gap-10 transition-colors duration-500 ${isOverrun ? 'border-red-500' : (isUrgent ? 'border-amber-500' : 'border-primary')}`}>
                            <div className="flex flex-col">
                                <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${isOverrun ? 'text-red-400' : 'text-slate-400'}`}>
                                    {isOverrun ? 'TIME OVERRUN' : 'LIVE COUNTDOWN'}
                                </span>
                                <span className={`text-8xl font-mono font-black tabular-nums tracking-tighter leading-none ${isOverrun ? 'text-red-500' : 'text-white'}`}>
                                    {formatTime(time)}
                                </span>
                            </div>

                            {/* Animated Pulse circle for "Live" effect */}
                            <div className="relative flex items-center justify-center">
                                <div className={`w-4 h-4 rounded-full ${isOverrun ? 'bg-red-500' : 'bg-primary'}`} />
                                <div className={`absolute w-full h-full rounded-full animate-ping opacity-40 ${isOverrun ? 'bg-red-500' : 'bg-primary'}`} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Stream;
