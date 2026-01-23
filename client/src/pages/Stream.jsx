import React from 'react';
import useStore from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutputHardening } from '../hooks/useOutputHardening';

const Stream = () => {
    useOutputHardening(true);
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
    const bgColor = currentScene.chromaKey ? 'bg-[#00FF00]' : 'bg-transparent';

    return (
        <div className={`h-screen w-full ${bgColor} flex flex-col justify-end p-16 lg:p-24 overflow-hidden transition-colors duration-500`}>
            <AnimatePresence>
                {(currentScene.timerVisible || currentScene.overlayText) && (
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        className="flex flex-col items-start gap-8 max-w-5xl"
                    >
                        {/* Improved Lower Third Banner */}
                        {currentScene.overlayText && (
                            <motion.div
                                initial={{ opacity: 0, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, filter: 'blur(0px)' }}
                                className="relative group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-20 blur-2xl group-hover:opacity-40 transition-opacity" />
                                <div className="relative bg-black/80 backdrop-blur-3xl px-14 py-7 rounded-[2rem] border-l-[12px] border-secondary shadow-2xl overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                                    <p className="text-white text-5xl font-black uppercase tracking-tight leading-tight relative z-10">
                                        {currentScene.overlayText}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Enhanced Timer Module */}
                        {currentScene.timerVisible && (
                            <motion.div
                                layout
                                className={`relative bg-black/85 backdrop-blur-3xl px-14 py-10 rounded-[2.5rem] border-l-[16px] shadow-2xl flex items-center gap-14 transition-all duration-500 ${isOverrun ? 'border-red-500 shadow-red-500/10' : (isUrgent ? 'border-amber-500 shadow-amber-500/10' : 'border-primary shadow-primary/10')}`}
                            >
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${isOverrun ? 'bg-red-500 animate-pulse' : 'bg-primary'}`} />
                                        <span className={`text-[12px] font-black uppercase tracking-[0.5em] ${isOverrun ? 'text-red-400' : 'text-slate-400'}`}>
                                            {isOverrun ? 'OVERRUN' : 'LIVE COUNTDOWN'}
                                        </span>
                                    </div>
                                    <span className={`text-[9rem] font-mono font-black tabular-nums tracking-tighter leading-none ${isOverrun ? 'text-red-500' : 'text-white'}`}>
                                        {formatTime(time)}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className={`w-5 h-5 rounded-lg rotate-45 ${isOverrun ? 'bg-red-500' : 'bg-primary'} opacity-20`} />
                                    <div className={`w-5 h-5 rounded-lg rotate-45 ${isOverrun ? 'bg-red-500' : 'bg-primary'} opacity-40`} />
                                    <div className={`w-5 h-5 rounded-lg rotate-45 ${isOverrun ? 'bg-red-500' : 'bg-primary'}`} />
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
