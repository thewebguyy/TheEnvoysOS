import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { useOutputHardening } from '../hooks/useOutputHardening';

const Stage = () => {
    useOutputHardening(true);
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
        <div className="h-screen w-full bg-[#000000] text-white p-8 lg:p-12 flex flex-col gap-8 lg:gap-12 overflow-hidden font-sans">
            {/* Top Bar - High Contrast */}
            <div className="flex justify-between items-center border-b-4 border-white/10 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-primary tracking-tight uppercase">Confidence Monitor</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="px-3 py-1 bg-primary text-black text-xs font-black rounded-lg">ENVOYS OS v2.0</div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lagos Local Active</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-8xl lg:text-9xl font-black tracking-tighter tabular-nums leading-none">
                        {systemTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </div>
                </div>
            </div>

            {/* Main Center Grid */}
            <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
                {/* Large Segment Timer - Critical Visibility */}
                <div className={`col-span-12 lg:col-span-8 rounded-[4rem] p-16 flex flex-col justify-center relative overflow-hidden border-4 transition-all duration-300 ${timers.segment.remaining < 0 ? 'bg-red-950/20 border-red-500' :
                    (timers.segment.remaining < 60 ? 'bg-amber-950/20 border-amber-500' : 'bg-white/5 border-white/10')
                    }`}>
                    <h3 className="text-3xl text-slate-500 font-black uppercase tracking-[0.4em] mb-12">Segment Timer</h3>
                    <div className={`text-[25vw] lg:text-[20vw] font-black leading-none tabular-nums tracking-tighter ${timers.segment.remaining < 0 ? 'text-red-500' :
                        (timers.segment.remaining < 60 ? 'text-amber-500' : 'text-white')
                        }`}>
                        {formatTime(timers.segment.remaining)}
                    </div>
                    {timers.segment.remaining < 0 && (
                        <motion.div
                            className="absolute inset-0 bg-red-500/10 pointer-events-none"
                            animate={{ opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        />
                    )}
                </div>

                {/* Notes & Prompts */}
                <div className="col-span-12 lg:col-span-4 bg-white/5 rounded-[4rem] p-12 lg:p-16 border-4 border-white/10 flex flex-col">
                    <h3 className="text-3xl text-slate-500 font-black uppercase tracking-[0.4em] mb-12">Scripture / Notes</h3>
                    <div className="text-4xl lg:text-5xl font-bold text-slate-200 leading-tight flex-1 flex flex-col justify-center whitespace-pre-wrap italic opacity-90">
                        {currentScene.overlayText || "SIGNAL READY"}
                    </div>
                </div>
            </div>

            {/* Bottom Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 h-40">
                <div className="bg-white/5 rounded-[2.5rem] p-8 border-4 border-white/10 flex flex-col items-center justify-center">
                    <p className="text-sm text-slate-500 font-black uppercase tracking-widest mb-2">Target Ending</p>
                    <p className="text-5xl lg:text-6xl font-black text-secondary">{timers.target.targetTime}</p>
                </div>
                <div className="bg-white/5 rounded-[2.5rem] p-8 border-4 border-white/10 flex flex-col items-center justify-center">
                    <p className="text-sm text-slate-500 font-black uppercase tracking-widest mb-2">Remaining</p>
                    <p className="text-5xl lg:text-6xl font-black text-secondary tabular-nums">{formatTime(timers.target.remaining)}</p>
                </div>
                <div className="bg-white/5 rounded-[2.5rem] p-8 border-4 border-white/10 flex flex-col items-center justify-center">
                    <p className="text-sm text-slate-500 font-black uppercase tracking-widest mb-2">Total Service</p>
                    <p className="text-5xl lg:text-6xl font-black text-slate-300 tabular-nums">{formatTime(timers.elapsed.seconds)}</p>
                </div>
                <div className="bg-primary/20 rounded-[2.5rem] p-8 border-4 border-primary/40 flex flex-col items-center justify-center">
                    <p className="text-sm text-primary font-black uppercase tracking-widest mb-2">Hub Status</p>
                    <p className="text-5xl lg:text-6xl font-black text-primary uppercase">SYNCED</p>
                </div>
            </div>
        </div>
    );
};

export default Stage;
