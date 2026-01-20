import React from 'react';
import { motion } from 'framer-motion';
import {
    Mic,
    MicOff,
    Type,
    Eye,
    EyeOff,
    Layers,
    Trash2,
    Zap,
    Monitor
} from 'lucide-react';
import { BASE_URL } from '../store/useStore';

const BroadcastControl = ({ currentScene, updateScene, timers, isVoiceActive, setIsVoiceActive }) => {
    const formatTime = (seconds) => {
        const absSec = Math.floor(Math.abs(seconds));
        const mins = Math.floor(absSec / 60);
        const secs = absSec % 60;
        const sign = seconds < 0 ? '-' : '';
        return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="glass-card p-6 rounded-[2.5rem] border border-white/5 space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Layers size={14} className="text-primary" /> Multi-Layer Control
                    </h3>
                    <button
                        onClick={() => setIsVoiceActive(!isVoiceActive)}
                        className={`p-2 rounded-xl transition-all ${isVoiceActive ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-slate-500'}`}
                        title="Voice Control (Beta)"
                    >
                        {isVoiceActive ? <Mic size={16} /> : <MicOff size={16} />}
                    </button>
                </div>

                <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex justify-between px-1">
                        Active Overlay Text
                        <div className="flex items-center gap-2">
                            {currentScene.overlayText.match(/^[12]?\s?[A-Za-z]+\s\d+:\d+/) && (
                                <span className="text-[8px] bg-primary/20 text-primary px-2 py-0.5 rounded-md animate-pulse">AI Suggested: Scripture Format</span>
                            )}
                            <span className="text-primary/60">{currentScene.overlayText.length} / 255</span>
                        </div>
                    </label>
                    <textarea
                        maxLength={255}
                        value={currentScene.overlayText}
                        onChange={(e) => updateScene({ overlayText: e.target.value })}
                        className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] p-5 text-sm focus:outline-none focus:border-primary transition-all min-h-[120px] resize-none font-medium leading-relaxed custom-scrollbar"
                        placeholder="Type Scripture, Announcements..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => updateScene({ timerVisible: !currentScene.timerVisible })}
                        className={`group relative overflow-hidden py-5 rounded-2xl border text-[9px] font-black transition-all tracking-[0.2em] uppercase ${currentScene.timerVisible
                            ? 'bg-primary/20 border-primary/50 text-white shadow-lg'
                            : 'bg-white/5 border-white/5 text-slate-600'
                            }`}
                    >
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            {currentScene.timerVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                            Timer Layer
                        </div>
                        {currentScene.timerVisible && (
                            <motion.div
                                className="absolute inset-0 bg-primary/20"
                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        )}
                    </button>

                    <button
                        onClick={() => updateScene({ background: null })}
                        className="bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 py-5 rounded-2xl text-[9px] font-black text-slate-500 hover:text-red-500 transition-all tracking-[0.2em] uppercase flex flex-col items-center gap-2"
                    >
                        <Trash2 size={18} />
                        Clear All
                    </button>
                </div>
            </div>

            <div className="glass-card flex-1 p-6 rounded-[2.5rem] border border-white/5 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Monitor size={14} className="text-secondary" /> Confidence Preview
                    </h3>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/20" />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
                    </div>
                </div>

                <div
                    className="relative flex-1 rounded-[2rem] overflow-hidden bg-black border border-white/5 shadow-2xl group"
                    onDrop={(e) => {
                        e.preventDefault();
                        const path = e.dataTransfer.getData('mediaPath');
                        if (path) updateScene({ background: path });
                    }}
                    onDragOver={(e) => e.preventDefault()}
                >
                    {/* Scene Content */}
                    <div className="absolute inset-0">
                        {currentScene.background ? (
                            currentScene.background.toLowerCase().match(/\.(mp4|webm)$/) ? (
                                <video
                                    src={`${BASE_URL}${currentScene.background}`}
                                    muted
                                    autoPlay
                                    loop
                                    className="w-full h-full object-cover opacity-60"
                                />
                            ) : (
                                <img
                                    src={`${BASE_URL}${currentScene.background}`}
                                    className="w-full h-full object-cover opacity-60"
                                    alt=""
                                />
                            )
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-800">
                                <Monitor size={64} className="mb-2 opacity-50" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Drop Media Here</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
                    </div>

                    {/* Overlays */}
                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 text-center bg-black/20 backdrop-blur-[1px]">
                        <motion.p
                            layout
                            className="text-xs font-black text-white/90 uppercase tracking-[0.2em] mb-4 drop-shadow-xl"
                        >
                            {currentScene.overlayText || "SIGNAL READY"}
                        </motion.p>
                        {currentScene.timerVisible && (
                            <motion.p
                                layout
                                className="text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                            >
                                {formatTime(timers.segment.remaining)}
                            </motion.p>
                        )}
                    </div>

                    {/* Badge */}
                    <div className="absolute bottom-4 right-4 bg-primary px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl border border-white/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">LIVE CONTROL</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BroadcastControl;
