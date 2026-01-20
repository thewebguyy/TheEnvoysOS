import React from 'react';
import useStore, { BASE_URL } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

const Audience = () => {
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
        <div className="h-screen w-full relative overflow-hidden bg-black flex flex-col items-center justify-center font-sans">
            {/* Background Media */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-black/40 z-10" />
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
                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/30 via-slate-900 to-black" />
                )}
            </div>

            {/* Main Content */}
            <div className="relative z-20 w-full max-w-7xl px-8 text-center space-y-16">
                <AnimatePresence mode="wait">
                    {currentScene.overlayText && (
                        <motion.div
                            key={currentScene.overlayText}
                            initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -50, filter: 'blur(10px)' }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-5xl md:text-8xl font-black text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] leading-tight uppercase tracking-tighter"
                        >
                            {currentScene.overlayText}
                        </motion.div>
                    )}
                </AnimatePresence>

                {currentScene.timerVisible && (
                    <motion.div
                        animate={{
                            scale: isUrgent ? [1, 1.02, 1] : 1,
                            color: isOverrun ? '#f43f5e' : (isUrgent ? '#fbbf24' : '#ffffff')
                        }}
                        transition={{
                            scale: { repeat: isUrgent ? Infinity : 0, duration: 1 },
                            color: { duration: 0.5 }
                        }}
                        className="text-[18rem] md:text-[28rem] font-mono font-black tracking-tighter tabular-nums drop-shadow-[0_20px_60px_rgba(0,0,0,1)] leading-[0.7]"
                    >
                        {formatTime(time)}
                    </motion.div>
                )}
            </div>

            {/* Branding / Footer */}
            <div className="absolute bottom-16 left-0 w-full text-center opacity-30 z-20">
                <h2 className="text-3xl font-black tracking-[0.8em] uppercase text-white drop-shadow-lg">TheEnvoysOS</h2>
            </div>
        </div>
    );
};

export default Audience;
