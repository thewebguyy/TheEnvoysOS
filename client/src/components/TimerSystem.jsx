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

    const handleSet = () => {
        const parts = input.split(':').reverse();
        let totalSec = 0;
        if (parts[0]) totalSec += parseInt(parts[0]);
        if (parts[1]) totalSec += parseInt(parts[1]) * 60;
        if (parts[2]) totalSec += parseInt(parts[2]) * 3600;

        if (!isNaN(totalSec) && totalSec >= 0) {
            onSet(totalSec);
            setIsEditing(false);
            setInput("");
        } else {
            toast.error("Format: MM:SS or HH:MM:SS");
        }
    };

    // Color logic: green -> yellow -> red
    const getStrokeColor = () => {
        if (percentage > 50) return "#10B981"; // Success/Green
        if (percentage > 20) return "#F59E0B"; // Warning/Yellow
        return "#EF4444"; // Danger/Red
    };

    return (
        <div className="glass-card p-6 rounded-[2.5rem] flex flex-col items-center gap-6 relative group border border-white/5 hover:border-white/10 transition-all">
            <div className="w-full flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</h3>
                </div>
                <button onClick={() => setIsEditing(!isEditing)} className="text-slate-600 hover:text-white transition-colors">
                    <Settings size={14} />
                </button>
            </div>

            <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform">
                    <circle
                        cx="96"
                        cy="96"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-white/5"
                    />
                    <motion.circle
                        cx="96"
                        cy="96"
                        r={radius}
                        stroke={getStrokeColor()}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "linear" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className={`text-4xl font-black tabular-nums tracking-tighter ${value < 60 && value > 0 && running ? 'text-red-500' : 'text-white'}`}>
                        {formatTime(value)}
                    </span>
                    {running && <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Live Now</span>}
                </div>
            </div>

            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full flex gap-2"
                    >
                        <input
                            autoFocus
                            type="text"
                            placeholder="MM:SS"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSet()}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary"
                        />
                        <button onClick={handleSet} className="bg-primary px-4 py-2 rounded-xl text-[10px] font-bold">SET</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex gap-4 w-full">
                <button
                    onClick={onToggle}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 font-black text-xs tracking-widest transition-all ${running ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}
                >
                    {running ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    {running ? 'PAUSE' : 'START'}
                </button>
                <button
                    onClick={onReset}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 text-slate-500 hover:text-white transition-all"
                >
                    <RotateCcw size={16} />
                </button>
            </div>
        </div>
    );
};

const TimerSystem = ({ timers, updateTimer }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CircularTimer
                title="Sermon Segment"
                value={timers.segment.remaining}
                max={timers.segment.duration}
                running={timers.segment.running}
                onToggle={() => updateTimer('segment', { running: !timers.segment.running })}
                onReset={() => updateTimer('segment', { remaining: timers.segment.duration, running: false })}
                onSet={(sec) => updateTimer('segment', { duration: sec, remaining: sec })}
            />
            {/* Target Timer and Elapsed Timer would go here too, maybe with different visuals */}
            <div className="glass-card p-6 rounded-[2.5rem] flex flex-col justify-between border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                    <Target size={16} className="text-secondary" />
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Service Target</h3>
                </div>
                <div className="text-6xl font-black text-white tabular-nums tracking-tighter mb-4">
                    {timers.target.targetTime}
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>REMAINING:</span>
                    <span className="text-secondary">{Math.floor(timers.target.remaining / 60)}m {timers.target.remaining % 60}s</span>
                </div>
                <div className="mt-6 flex gap-2">
                    <input
                        type="time"
                        defaultValue={timers.target.targetTime}
                        onChange={(e) => updateTimer('target', { targetTime: e.target.value })}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary"
                    />
                </div>
            </div>

            <div className="glass-card p-6 rounded-[2.5rem] flex flex-col justify-between border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                    <TimerIcon size={16} className="text-slate-400" />
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Session Elapsed</h3>
                </div>
                <div className="text-6xl font-black text-slate-300 tabular-nums tracking-tighter mb-4">
                    {Math.floor(timers.elapsed.seconds / 60).toString().padStart(2, '0')}:{(timers.elapsed.seconds % 60).toString().padStart(2, '0')}
                </div>
                <button
                    onClick={() => updateTimer('elapsed', { running: !timers.elapsed.running })}
                    className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-black text-xs tracking-widest transition-all ${timers.elapsed.running ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}
                >
                    {timers.elapsed.running ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    {timers.elapsed.running ? 'PAUSE' : 'START SESSION'}
                </button>
            </div>
        </div>
    );
};

export default TimerSystem;
