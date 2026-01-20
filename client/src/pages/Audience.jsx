import React from 'react';
import useStore from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

const Audience = () => {
    const { timers, currentScene } = useStore();

    const formatTime = (seconds) => {
        if (seconds === undefined || seconds === null) return "00:00";
        const mins = Math.floor(Math.abs(seconds) / 60);
        const secs = Math.floor(Math.abs(seconds) % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const time = timers.segment.remaining;
    const isUrgent = time < 60 && time > 0;

    return (
        <div className="h-screen w-full relative overflow-hidden bg-black flex flex-col items-center justify-center">
            {/* Background Media */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-black/40 z-10" />
                {currentScene.background ? (
                    currentScene.background.toLowerCase().endsWith('.mp4') || currentScene.background.toLowerCase().endsWith('.webm') ? (
                        <video
                            src={`http://localhost:3001${currentScene.background}`}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                        />
                    ) : (
                        <img
                            src={`http://localhost:3001${currentScene.background}`}
                            className="w-full h-full object-cover"
                            alt=""
                        />
                    )
                ) : (
                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-slate-900 to-black" />
                )}
            </div>

            {/* Main Content */}
            <div className="relative z-20 w-full max-w-6xl px-8 text-center space-y-12">
                <AnimatePresence mode="wait">
                    {currentScene.overlayText && (
                        <motion.div
                            key={currentScene.overlayText}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="text-4xl md:text-7xl font-bold text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] leading-tight uppercase tracking-tight"
                        >
                            {currentScene.overlayText}
                        </motion.div>
                    )}
                </AnimatePresence>

                {currentScene.timerVisible && (
                    <motion.div
                        animate={{
                            scale: isUrgent ? [1, 1.05, 1] : 1,
                            color: isUrgent ? '#f43f5e' : '#ffffff'
                        }}
                        transition={{ repeat: isUrgent ? Infinity : 0, duration: 1 }}
                        className="text-[15rem] md:text-[25rem] font-mono font-bold tracking-tighter tabular-nums drop-shadow-[0_10px_50px_rgba(0,0,0,0.8)] leading-[0.8]"
                    >
                        {formatTime(time)}
                    </motion.div>
                )}
            </div>

            {/* Branding / Footer */}
            <div className="absolute bottom-12 left-0 w-full text-center opacity-20 z-20">
                <h2 className="text-2xl font-bold tracking-[0.5em] uppercase text-white">TheEnvoysOS</h2>
            </div>
        </div>
    );
};

export default Audience;
