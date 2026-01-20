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

    // Chroma Key logic: if enabled, we use a solid green background for external hardware mixers
    const bgColor = currentScene.chromaKey ? 'bg-[#00b140]' : 'bg-transparent';

    return (
        <div className={`h-screen w-full ${bgColor} flex flex-col justify-end p-12 overflow-hidden transition-colors duration-1000`}>
            <AnimatePresence>
                {(currentScene.timerVisible || currentScene.overlayText) && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="flex flex-col items-start gap-6 max-w-4xl"
                    >
                        {/* Lower Third Banner */}
                        {currentScene.overlayText && (
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-black/90 backdrop-blur-3xl px-12 py-5 rounded-[2rem] border-l-[12px] border-secondary shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                            >
                                <p className="text-white text-5xl font-black uppercase tracking-tight leading-loose">
                                    {currentScene.overlayText}
                                </p>
                            </motion.div>
                        )}

                        {/* Timer Module */}
                        {currentScene.timerVisible && (
                            <motion.div
                                layout
                                className={`bg-black/90 backdrop-blur-3xl px-12 py-8 rounded-[2.5rem] border-l-[16px] shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex items-center gap-12 transition-all duration-700 ${isOverrun ? 'border-red-500' : (isUrgent ? 'border-amber-500' : 'border-primary')}`}
                            >
                                <div className="flex flex-col">
                                    <span className={`text-[12px] font-black uppercase tracking-[0.4em] mb-2 ${isOverrun ? 'text-red-400' : 'text-slate-400'}`}>
                                        {isOverrun ? 'OVERRUN' : 'LIVE COUNTDOWN'}
                                    </span>
                                    <span className={`text-9xl font-mono font-black tabular-nums tracking-tighter leading-none ${isOverrun ? 'text-red-500' : 'text-white'}`}>
                                        {formatTime(time)}
                                    </span>
                                </div>

                                <div className="relative flex items-center justify-center">
                                    <div className={`w-6 h-6 rounded-full ${isOverrun ? 'bg-red-500' : 'bg-primary'}`} />
                                    <div className={`absolute w-12 h-12 rounded-full animate-ping opacity-30 ${isOverrun ? 'bg-red-500' : 'bg-primary'}`} />
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Stream;
