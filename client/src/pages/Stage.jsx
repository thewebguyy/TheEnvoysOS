import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';

const Stage = () => {
    const { timers, currentScene } = useStore();
    const [systemTime, setSystemTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setSystemTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const absSec = Math.floor(Math.abs(seconds));
        const hrs = Math.floor(absSec / 3600);
        const mins = Math.floor((absSec % 3600) / 60);
        const secs = absSec % 60;

        const sign = seconds < 0 ? '-' : '';
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        return sign + (hrs > 0 ? `${hrs}:${timeStr}` : timeStr);
    };

    return (
        <div className="h-screen w-full bg-[#030303] text-white p-8 md:p-12 flex flex-col gap-8 md:gap-12 overflow-hidden font-mono">
            {/* Top Bar */}
            <div className="flex justify-between items-end border-b border-white/10 pb-8">
                <div className="space-y-2">
                    <p className="text-xl md:text-2xl text-primary font-black uppercase tracking-[0.3em]">Confidence Hub</p>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">TheEnvoysOS v1.1</p>
                </div>
                <div className="text-right">
                    <div className="text-7xl md:text-9xl font-black tracking-tighter tabular-nums leading-none">
                        {systemTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </div>
                </div>
            </div>

            {/* Main Center Grid */}
            <div className="grid grid-cols-12 gap-8 flex-1">
                {/* Large Segment Timer */}
                <div className="col-span-12 lg:col-span-7 bg-white/5 rounded-[3rem] p-12 border border-white/10 flex flex-col justify-center relative overflow-hidden">
                    <div className="text-2xl text-slate-500 font-black uppercase tracking-[0.4em] mb-6 relative z-10">Current Segment</div>
                    <div className={`text-[12rem] md:text-[20rem] font-black leading-none tabular-nums relative z-10 transition-colors duration-500 ${timers.segment.remaining < 0 ? 'text-red-500' : (timers.segment.remaining < 60 ? 'text-amber-500' : 'text-white')}`}>
                        {formatTime(timers.segment.remaining)}
                    </div>
                    {/* Visual Pulse for overrun */}
                    {timers.segment.remaining < 0 && (
                        <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
                    )}
                </div>

                {/* Notes & Prompts */}
                <div className="col-span-12 lg:col-span-5 bg-white/5 rounded-[3rem] p-12 border border-white/10 flex flex-col">
                    <div className="text-2xl text-slate-500 font-black uppercase tracking-[0.4em] mb-6">Notes / Scripture</div>
                    <div className="text-4xl md:text-5xl font-bold text-slate-200 leading-tight flex-1 flex flex-col justify-center whitespace-pre-wrap italic">
                        {currentScene.overlayText || "NO ACTIVE NOTES"}
                    </div>
                </div>
            </div>

            {/* Bottom Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-32 md:h-40">
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center">
                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-2">Target End</p>
                    <p className="text-4xl md:text-5xl font-black text-secondary">{timers.target.targetTime}</p>
                </div>
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center">
                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-2">Time Remaining</p>
                    <p className="text-4xl md:text-5xl font-black text-secondary tabular-nums">{formatTime(timers.target.remaining)}</p>
                </div>
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center">
                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-2">Total Elapsed</p>
                    <p className="text-4xl md:text-5xl font-black text-slate-300 tabular-nums">{formatTime(timers.elapsed.seconds)}</p>
                </div>
                <div className="bg-primary/10 rounded-3xl p-6 border border-primary/20 flex flex-col items-center justify-center">
                    <p className="text-xs text-primary font-black uppercase tracking-widest mb-2">Stream Status</p>
                    <p className="text-4xl md:text-5xl font-black text-primary uppercase">Active</p>
                </div>
            </div>
        </div>
    );
};

export default Stage;
