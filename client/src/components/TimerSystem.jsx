import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings, Clock, Target, Timer as TimerIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CircularTimer = ({ value, max, title, running, onToggle, onReset, onSet, color = "#3B82F6" }) => {
    const percentage = Math.max(0, Math.min(100, (value / max) * 100)) || 0;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const [isEditing, setIsEditing] = useState(false);
    const [input, setInput] = useState("");

    const formatTime = (seconds) => {
        const absSec = Math.floor(Math.abs(seconds));
        const hrs = Math.floor(absSec / 3600);
        const mins = Math.floor((absSec % 3600) / 60);
        const secs = absSec % 60;
        const sign = seconds < 0 ? '-' : '';
        return `${sign}${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSet = (val = input) => {
        let totalSec = 0;
        if (typeof val === 'number') {
            totalSec = val;
        } else {
            const parts = val.split(':').reverse();
            if (parts[0]) totalSec += parseInt(parts[0]);
            if (parts[1]) totalSec += parseInt(parts[1]) * 60;
            if (parts[2]) totalSec += parseInt(parts[2]) * 3600;
        }

        if (!isNaN(totalSec) && totalSec >= 0) {
            onSet(totalSec);
            setIsEditing(false);
            setInput("");
        } else if (typeof val === 'string') {
            toast.error("Format: MM:SS or HH:MM:SS");
        }
    };

    const getStrokeColor = () => {
        if (percentage > 50) return "#10B981";
        if (percentage > 20) return "#F59E0B";
        return "#EF4444";
    };

    return (
        <div className="glass-card flex flex-col items-center gap-8 relative group border border-white/5 hover:border-primary/20 transition-all rounded-[3rem]">
            <div className="w-full flex justify-between items-center px-4">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${running ? 'bg-primary shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'bg-slate-600'}`} />
                    <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">{title}</h3>
                </div>
                <button onClick={() => setIsEditing(!isEditing)} className="text-slate-400 hover:text-white transition-colors p-2 bg-white/5 rounded-lg">
                    <Settings size={18} strokeWidth={1.5} />
                </button>
            </div>

            <div className="relative w-56 h-56 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform">
                    <circle cx="112" cy="112" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                    <motion.circle
                        cx="112" cy="112" r={radius} stroke={getStrokeColor()} strokeWidth="10" fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "linear" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className={`text-5xl font-black tabular-nums tracking-tighter ${value < 60 && value > 0 && running ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {formatTime(value)}
                    </span>
                    {running && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Active Production</span>}
                </div>
            </div>

            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="w-full space-y-4"
                    >
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                type="text"
                                placeholder="MM:SS"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSet()}
                                className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-primary"
                            />
                            <button onClick={() => handleSet()} className="bg-primary px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">SET</button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[300, 600, 900, 1800].map(s => (
                                <button key={s} onClick={() => handleSet(s)} className="bg-white/5 hover:bg-white/10 py-2 rounded-xl text-[10px] font-bold text-slate-400">{s / 60}m</button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex gap-4 w-full">
                <button
                    onClick={onToggle}
                    className={`flex-1 flex items-center justify-center gap-3 rounded-[1.5rem] py-5 font-black text-[11px] tracking-[0.2em] transition-all ${running ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-primary/10 text-primary border border-primary/20 active:scale-95'}`}
                >
                    {running ? <Pause size={20} strokeWidth={1.5} fill="currentColor" /> : <Play size={20} strokeWidth={1.5} fill="currentColor" />}
                    {running ? 'PAUSE' : 'DEPLOY'}
                </button>
                <button
                    onClick={onReset}
                    className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <RotateCcw size={20} strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
};

const TimerSystem = ({ timers, updateTimer }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <CircularTimer
                title="Main Event"
                value={timers.segment.remaining}
                max={timers.segment.duration}
                running={timers.segment.running}
                onToggle={() => updateTimer('segment', { running: !timers.segment.running })}
                onReset={() => updateTimer('segment', { remaining: timers.segment.duration, running: false })}
                onSet={(sec) => updateTimer('segment', { duration: sec, remaining: sec })}
            />

            <div className="glass-card rounded-[3rem] flex flex-col justify-between border border-white/5 hover:border-secondary/20 transition-all">
                <div className="flex items-center gap-3 mb-6">
                    <Target size={20} strokeWidth={1.5} className="text-secondary" />
                    <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Service Target</h3>
                </div>
                <div className="text-7xl font-black text-white tabular-nums tracking-tighter mb-6 leading-none">
                    {timers.target.targetTime}
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-black/20 p-4 rounded-2xl">
                    <span>EST. REMAINING:</span>
                    <span className="text-secondary font-black">{Math.floor(timers.target.remaining / 60)}M {timers.target.remaining % 60}S</span>
                </div>
                <div className="mt-8">
                    <input
                        type="time"
                        defaultValue={timers.target.targetTime}
                        onChange={(e) => updateTimer('target', { targetTime: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-secondary"
                    />
                </div>
            </div>

            <div className="glass-card rounded-[3rem] flex flex-col justify-between border border-white/5 hover:border-slate-400/20 transition-all">
                <div className="flex items-center gap-3 mb-6">
                    <TimerIcon size={20} strokeWidth={1.5} className="text-slate-400" />
                    <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Session Elapsed</h3>
                </div>
                <div className="text-7xl font-black text-slate-300 tabular-nums tracking-tighter mb-6 leading-none">
                    {Math.floor(timers.elapsed.seconds / 60).toString().padStart(2, '0')}:{(timers.elapsed.seconds % 60).toString().padStart(2, '0')}
                </div>
                <button
                    onClick={() => updateTimer('elapsed', { running: !timers.elapsed.running })}
                    className={`w-full flex items-center justify-center gap-3 rounded-[1.5rem] py-5 font-black text-[11px] tracking-[0.2em] transition-all min-h-[64px] ${timers.elapsed.running ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white/5 text-slate-400 border border-white/10 active:scale-95'}`}
                >
                    {timers.elapsed.running ? <Pause size={20} strokeWidth={1.5} fill="currentColor" /> : <Play size={20} strokeWidth={1.5} fill="currentColor" />}
                    {timers.elapsed.running ? 'PAUSE SESSION' : 'START SESSION'}
                </button>
            </div>
        </div>
    );
};


export default TimerSystem;
