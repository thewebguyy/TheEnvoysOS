import React from 'react';
import useStore, { BASE_URL } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutputHardening } from '../hooks/useOutputHardening';

const Audience = () => {
    useOutputHardening(true);
    const { timers, currentScene } = useStore();

    const formatTime = (seconds) => {
        const absSec = Math.floor(Math.abs(seconds));
        const hrs = Math.floor(absSec / 3600);
        const mins = Math.floor((absSec % 3600) / 60);
        const secs = absSec % 60;

        const sign = seconds < 0 ? '-' : '';
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        return sign + (hrs > 0 ? `${hrs}:${timeStr}` : timeStr);
    };

    const time = timers.segment.remaining;
    const isUrgent = time < 60 && time > 0;
    const isOverrun = time < 0;

    return (
        <div className="h-screen w-full relative overflow-hidden bg-[#0a0a0b] flex flex-col items-center justify-center font-sans">
            {/* Background Media */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-black/50 z-10" />
                {currentScene.background ? (
                    currentScene.background.toLowerCase().match(/\.(mp4|webm)$/) ? (
                        <video
                            src={`${BASE_URL}${currentScene.background}`}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                        />
                    ) : (
                        <img
                            src={`${BASE_URL}${currentScene.background}`}
                            className="w-full h-full object-cover"
                            alt=""
                        />
                    )
                ) : (
                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-[#0a0a0b] to-black" />
                )}
            </div>

            {/* Main Content */}
            <div className="relative z-20 w-full max-w-[90vw] px-8 text-center flex flex-col items-center gap-12">
                <AnimatePresence mode="wait">
                    {currentScene.overlayText && (
                        <motion.div
                            key={currentScene.overlayText}
                            initial={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="glass px-12 py-8 rounded-[3rem] border border-white/10 max-w-5xl"
                        >
                            <h2 className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl leading-[1.1] uppercase tracking-tighter">
                                {currentScene.overlayText}
                            </h2>
                        </motion.div>
                    )}
                </AnimatePresence>

                {currentScene.timerVisible && (
                    <motion.div
                        animate={{
                            scale: isUrgent ? [1, 1.05, 1] : 1,
                            color: isOverrun ? '#F43F5E' : (isUrgent ? '#F59E0B' : '#FFFFFF'),
                            opacity: isOverrun ? [1, 0.6, 1] : 1
                        }}
                        transition={{
                            scale: { repeat: isUrgent ? Infinity : 0, duration: 1 },
                            opacity: { repeat: isOverrun ? Infinity : 0, duration: 0.5 },
                            color: { duration: 0.5 }
                        }}
                        className="text-[25vw] font-mono font-black tracking-tighter tabular-nums drop-shadow-[0_0_80px_rgba(0,0,0,0.5)] leading-none select-none"
                    >
                        {formatTime(time)}
                    </motion.div>
                )}
            </div>

            {/* Bottom Branding */}
            <div className="absolute bottom-12 left-0 w-full flex flex-col items-center gap-2 opacity-20 z-20 pointer-events-none">
                <div className="w-12 h-0.5 bg-white/50 rounded-full" />
                <h2 className="text-xl font-black tracking-[0.6em] uppercase text-white">ENVOYS OS</h2>
            </div>
        </div>
    );
};

export default Audience;
