import React, { useState, useEffect, useCallback } from 'react';
import useStore, { BASE_URL } from '../store/useStore';
import { Play, Pause, RotateCcw, Monitor, Settings, Image as ImageIcon, Type, ExternalLink, Trash2, Shield, Clock, Plus, Zap } from 'lucide-react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';

const Dashboard = () => {
    const { timers, currentScene, media, updateTimer, updateScene, fetchMedia, deleteMedia, resetAll, isConnected } = useStore();
    const [uploading, setUploading] = useState(false);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.code === 'Space') {
                e.preventDefault();
                updateTimer('segment', { running: !timers.segment.running });
                toast(timers.segment.running ? 'Paused' : 'Started', { duration: 1000 });
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [timers.segment.running, updateTimer]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            toast.error('File exceeds 50MB limit');
            return;
        }

        const formData = new FormData();
        formData.append('media', file);
        setUploading(true);
        const tid = toast.loading('Uploading media...');

        try {
            await axios.post(`${BASE_URL}/api/upload`, formData);
            toast.success('Upload complete', { id: tid });
        } catch (err) {
            toast.error('Upload failed', { id: tid });
        } finally {
            setUploading(false);
        }
    };

    const formatTime = (seconds) => {
        const absSec = Math.floor(Math.abs(seconds));
        const hrs = Math.floor(absSec / 3600);
        const mins = Math.floor((absSec % 3600) / 60);
        const secs = absSec % 60;

        const sign = seconds < 0 ? '-' : '';
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        return sign + (hrs > 0 ? `${hrs}:${timeStr}` : timeStr);
    };

    const TimerCard = ({ title, timerKey, timerData, accent = "primary" }) => {
        const [showSettings, setShowSettings] = useState(false);
        const [timeInput, setTimeInput] = useState("");

        const handleSetTime = () => {
            const parts = timeInput.split(':').reverse();
            let totalSec = 0;
            if (parts[0]) totalSec += parseInt(parts[0]);
            if (parts[1]) totalSec += parseInt(parts[1]) * 60;
            if (parts[2]) totalSec += parseInt(parts[2]) * 3600;

            if (!isNaN(totalSec)) {
                updateTimer(timerKey, { duration: totalSec, remaining: totalSec });
                toast.success(`${title} set to ${timeInput}`);
                setShowSettings(false);
            }
        };

        return (
            <div className={`glass p-6 rounded-2xl flex flex-col gap-4 border border-white/5 hover:border-${accent}/30 transition-all group relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-24 h-24 bg-${accent}/5 rounded-full -mr-12 -mt-12 transition-all group-hover:bg-${accent}/10`} />

                <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className={`text-${accent}`} />
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
                    </div>
                    <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 transition-colors">
                        <Settings size={14} />
                    </button>
                </div>

                <div className={`text-6xl font-mono font-bold tracking-tighter tabular-nums relative z-10 ${timerData.remaining < 60 && timerData.remaining > 0 ? 'text-accent animate-pulse-slow' : 'text-white'}`}>
                    {timerKey === 'elapsed' ? formatTime(timerData.seconds) : formatTime(timerData.remaining)}
                </div>

                {showSettings ? (
                    <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300 relative z-10">
                        <input
                            type="text"
                            placeholder="MM:SS"
                            value={timeInput}
                            onChange={(e) => setTimeInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSetTime()}
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                        <button onClick={handleSetTime} className="bg-primary px-3 py-2 rounded-lg text-xs font-bold">SET</button>
                    </div>
                ) : (
                    <div className="flex gap-2 relative z-10">
                        <button
                            onClick={() => updateTimer(timerKey, { running: !timerData.running })}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-bold transition-all ${timerData.running ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : `bg-${accent}/20 text-${accent} hover:bg-${accent}/30`}`}
                        >
                            {timerData.running ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                            {timerData.running ? 'PAUSE' : 'START'}
                        </button>
                        <button
                            onClick={() => updateTimer(timerKey, { remaining: timerData.duration || 0, seconds: 0, running: false })}
                            className="p-3 rounded-xl bg-surface hover:bg-surface-hover border border-white/5 transition-colors text-slate-400"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#08080a] text-slate-100 p-4 md:p-8">
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#161618', color: '#fff', border: '1px solid #333' } }} />

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Compact Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface/50 p-4 rounded-3xl border border-white/5 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Zap size={24} className="text-white" fill="white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                ENVOYS<span className="text-primary">OS</span>
                                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            </h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Worship Orchestration Tool</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                            <a href="/audience" target="_blank" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold">
                                <Monitor size={14} /> AUDIENCE
                            </a>
                            <a href="/stage" target="_blank" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold">
                                <Shield size={14} /> STAGE
                            </a>
                            <a href="/stream" target="_blank" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold">
                                <ExternalLink size={14} /> STREAM
                            </a>
                        </div>
                        <button onClick={resetAll} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-black transition-all">
                            RESET SYSTEM
                        </button>
                    </div>
                </header>

                {/* Primary Timers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <TimerCard title="Sermon Segment" timerKey="segment" timerData={timers.segment} accent="primary" />
                    <TimerCard title="Target Service End" timerKey="target" timerData={timers.target} accent="secondary" />
                    <TimerCard title="Total Elapsed" timerKey="elapsed" timerData={timers.elapsed} accent="accent" />
                </div>

                {/* Media & Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Media Management */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <ImageIcon size={16} /> Content Library
                            </h2>
                            <label className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-2 rounded-xl text-[10px] font-black cursor-pointer transition-all flex items-center gap-2 uppercase">
                                <Plus size={14} /> Upload Content
                                <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*" />
                            </label>
                        </div>

                        <div className="glass p-6 rounded-3xl border border-white/5 min-h-[300px]">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {media.length === 0 && !uploading && (
                                    <div className="col-span-full h-48 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/5 rounded-2xl">
                                        <ImageIcon size={32} className="mb-2 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Library Empty</p>
                                    </div>
                                )}
                                {uploading && (
                                    <div className="aspect-video bg-white/5 rounded-xl animate-pulse flex items-center justify-center border border-white/10">
                                        <Zap size={16} className="text-primary animate-bounce" />
                                    </div>
                                )}
                                {media.map(item => (
                                    <div key={item.id} className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all shadow-xl">
                                        {item.type.includes('video') ? (
                                            <video src={`${BASE_URL}${item.path}`} className="w-full h-full object-cover" muted onMouseEnter={e => e.target.play()} onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }} />
                                        ) : (
                                            <img src={`${BASE_URL}${item.path}`} alt="" className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            <button onClick={() => updateScene({ background: item.path })} className="bg-white text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:scale-105 transition-transform">GO LIVE</button>
                                            <button onClick={() => deleteMedia(item.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={14} /></button>
                                        </div>
                                        {currentScene.background === item.path && (
                                            <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Scene / Overlay Control */}
                    <div className="lg:col-span-4 space-y-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Type size={16} /> Broadcast Control
                        </h2>
                        <div className="glass p-6 rounded-3xl border border-white/5 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Overlay</label>
                                <textarea
                                    value={currentScene.overlayText}
                                    onChange={(e) => updateScene({ overlayText: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary transition-all min-h-[120px] resize-none font-medium leading-relaxed"
                                    placeholder="Type Bible verse or announcement..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => updateScene({ timerVisible: !currentScene.timerVisible })}
                                    className={`py-4 rounded-2xl border text-[10px] font-black transition-all tracking-widest uppercase ${currentScene.timerVisible ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-surface border-white/5 text-slate-600'}`}
                                >
                                    {currentScene.timerVisible ? 'Timer Enabled' : 'Timer Disabled'}
                                </button>
                                <button onClick={() => updateScene({ background: null })} className="bg-surface border border-white/5 py-4 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-white/5 transition-all tracking-widest uppercase">
                                    Clear Visuals
                                </button>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden group aspect-video flex flex-col items-center justify-center text-center">
                                    <div className="absolute inset-0 opacity-40">
                                        {currentScene.background && (
                                            currentScene.background.toLowerCase().match(/\.(mp4|webm)$/) ?
                                                <video src={`${BASE_URL}${currentScene.background}`} muted autoPlay loop className="w-full h-full object-cover" /> :
                                                <img src={`${BASE_URL}${currentScene.background}`} className="w-full h-full object-cover" alt="" />
                                        )}
                                    </div>
                                    <div className="relative z-10 space-y-1">
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Live Monitor</p>
                                        <p className="text-xs font-bold text-white line-clamp-2 px-4 shadow-black drop-shadow-md">{currentScene.overlayText}</p>
                                        {currentScene.timerVisible && <p className="text-2xl font-black text-white">{formatTime(timers.segment.remaining)}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
