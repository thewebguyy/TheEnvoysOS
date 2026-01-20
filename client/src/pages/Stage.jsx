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
        const mins = Math.floor(Math.abs(seconds) / 60);
        const secs = Math.floor(Math.abs(seconds) % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-screen w-full bg-[#050505] text-white p-12 flex flex-col gap-12 overflow-hidden">
            {/* Top Header: System Clock */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl text-slate-500 font-bold uppercase tracking-widest mb-2">Confidence Monitor</h2>
                    <div className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg inline-block font-bold">
                        LIVE SESSION
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-6xl font-mono font-bold tracking-tighter">
                        {systemTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="text-slate-500 font-medium">System Time</div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-2 gap-12 flex-1">
                {/* Primary Timer */}
                <div className="bg-slate-900/40 rounded-3xl p-12 border border-white/5 flex flex-col justify-center items-center text-center">
                    <div className="text-4xl text-slate-500 font-bold uppercase tracking-[0.2em] mb-8">Segment</div>
                    <div className={`text-[15rem] font-mono font-bold leading-none ${timers.segment.remaining < 60 ? 'text-accent' : 'text-white'}`}>
                        {formatTime(timers.segment.remaining)}
                    </div>
                </div>

                {/* Notes / Overlay Text */}
                <div className="bg-slate-900/40 rounded-3xl p-12 border border-white/5 flex flex-col">
                    <div className="text-4xl text-slate-500 font-bold uppercase tracking-[0.2em] mb-8">Notes / Reference</div>
                    <div className="text-5xl font-medium text-slate-200 leading-tight">
                        {currentScene.overlayText || "No notes for current segment."}
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Secondary Timers */}
            <div className="grid grid-cols-3 gap-8">
                <div className="bg-white/5 rounded-2xl p-6 flex flex-col items-center">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-2">Elapsed</div>
                    <div className="text-4xl font-mono font-bold text-slate-300">{formatTime(timers.elapsed.seconds)}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-6 flex flex-col items-center border-l-4 border-secondary">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-2">Next Event</div>
                    <div className="text-4xl font-mono font-bold text-slate-300">12:00 PM</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-6 flex flex-col items-center">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-2">Target Remaining</div>
                    <div className="text-4xl font-mono font-bold text-slate-300">{formatTime(timers.target.remaining)}</div>
                </div>
            </div>
        </div>
    );
};

export default Stage;
