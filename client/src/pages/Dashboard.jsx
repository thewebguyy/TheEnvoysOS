import React, { useState, useEffect, useMemo } from 'react';
import useStore, { BASE_URL } from '../store/useStore';
import {
    Play, Pause, RotateCcw, Monitor, Settings, Image as ImageIcon,
    Type, ExternalLink, Trash2, Shield, Clock, Plus, Zap,
    Search, Filter, HardDrive, AlertTriangle, Save, List, Loader2
} from 'lucide-react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
    const {
        timers, currentScene, media, storageStats,
        updateTimer, updateScene, fetchMedia, deleteMedia, resetAll,
        isConnected, isSyncing
    } = useStore();

    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [mediaFilter, setMediaFilter] = useState("all"); // all, image, video

    // Filtered Media
    const filteredMedia = useMemo(() => {
        return media.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = mediaFilter === "all" || item.type.includes(mediaFilter);
            return matchesSearch && matchesFilter;
        });
    }, [media, searchQuery, mediaFilter]);

    // Keyboard Shortcuts (Hardened)
    useEffect(() => {
        const handleKeyPress = (e) => {
            const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
            if (isInput) return;

            if (e.code === 'Space') {
                e.preventDefault();
                updateTimer('segment', { running: !timers.segment.running });
            }
            if (e.ctrlKey && e.code === 'KeyR') {
                // Prevent accidental system reset
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [timers.segment.running, updateTimer]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('media', file);
        setUploading(true);
        const tid = toast.loading('Uploading media...');

        try {
            await axios.post(`${BASE_URL}/api/upload`, formData);
            toast.success('Upload successful', { id: tid });
            fetchMedia(); // Refresh stats
        } catch (err) {
            toast.error(err.response?.data?.error || 'Upload failed', { id: tid });
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
        return `${sign}${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

            if (!isNaN(totalSec) && totalSec >= 0) {
                updateTimer(timerKey, { duration: totalSec, remaining: totalSec });
                setShowSettings(false);
            } else {
                toast.error("Invalid time format (MM:SS or HH:MM:SS)");
            }
        };

        return (
            <div className={`glass p-6 rounded-[2rem] flex flex-col gap-4 border border-white/5 hover:border-${accent}/40 transition-all relative overflow-hidden group`}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${accent}/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-${accent}/10 transition-colors`} />

                <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-${accent} shadow-[0_0_8px_var(--tw-shadow-color)] shadow-${accent}`} />
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</h3>
                    </div>
                    <button onClick={() => setShowSettings(!showSettings)} className="text-slate-600 hover:text-white transition-colors">
                        <Settings size={14} />
                    </button>
                </div>

                <div className={`text-6xl font-mono font-black tabular-nums tracking-tighter relative z-10 ${timerData.remaining < 60 && timerData.remaining > 0 ? 'text-accent animate-pulse-slow' : 'text-white'}`}>
                    {timerKey === 'elapsed' ? formatTime(timerData.seconds) : formatTime(timerData.remaining)}
                </div>

                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="flex gap-2 relative z-10 overflow-hidden"
                        >
                            <input
                                autoFocus
                                type="text"
                                placeholder="MM:SS"
                                value={timeInput}
                                onChange={(e) => setTimeInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSetTime()}
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
                            />
                            <button onClick={handleSetTime} className="bg-primary px-4 py-2 rounded-xl text-xs font-black uppercase">SET</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex gap-2 relative z-10">
                    <button
                        onClick={() => updateTimer(timerKey, { running: !timerData.running })}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 font-black text-xs tracking-widest transition-all ${timerData.running ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : `bg-${accent}/10 text-${accent} border border-${accent}/20`}`}
                    >
                        {timerData.running ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                        {timerData.running ? 'PAUSE' : 'START'}
                    </button>
                    <button
                        onClick={() => updateTimer(timerKey, { remaining: timerData.duration || 0, seconds: 0, running: false })}
                        className="p-4 rounded-2xl bg-surface hover:bg-surface-hover border border-white/5 text-slate-500 hover:text-white transition-all shadow-lg"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>
        );
    };

    const quotaUsedPercent = (storageStats.usage / storageStats.quota) * 100 || 0;

    return (
        <div className="min-h-screen bg-[#060608] text-slate-200 selection:bg-primary/30">
            {/* Global Loader Layer */}
            <AnimatePresence>
                {!isConnected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-8 text-center"
                    >
                        <div className="w-24 h-24 rounded-full border-t-2 border-primary animate-spin mb-8" />
                        <h2 className="text-3xl font-black mb-2">CONNECTION LOST</h2>
                        <p className="text-slate-400 max-w-sm">The Envoys Hub is unreachable. We're trying to reconnect while maintaining local timers.</p>
                        <div className="mt-8 flex gap-4">
                            <div className="px-4 py-2 bg-white/5 rounded-full text-xs font-bold text-slate-500 uppercase">Searching...</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
                {/* Modern Navigation Header */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-surface/40 p-6 rounded-[2.5rem] border border-white/5 gap-6 backdrop-blur-xl">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center shadow-2xl shadow-primary/40 relative group overflow-hidden">
                            <Zap size={32} className="text-white relative z-10" fill="white" />
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black tracking-tighter">ENVOYS<span className="text-primary italic">OS</span></h1>
                                {isSyncing ? <Loader2 size={16} className="text-primary animate-spin" /> : <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 py-0.5 bg-black/40 rounded-md border border-white/5">v1.2 PRODUCTION</span>
                                <div className="h-1 w-1 rounded-full bg-slate-700" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">LAGOS LOCAL HUB ACTIVE</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                            <a href="/audience" target="_blank" className="px-4 py-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black tracking-widest">
                                <Monitor size={14} /> AUDIENCE
                            </a>
                            <a href="/stage" target="_blank" className="px-4 py-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black tracking-widest">
                                <Shield size={14} /> STAGE
                            </a>
                            <a href="/stream" target="_blank" className="px-4 py-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black tracking-widest">
                                <ExternalLink size={14} /> STREAM
                            </a>
                        </div>
                        <button
                            onClick={() => {
                                if (window.confirm("CRITICAL: Reset all active timers?")) resetAll();
                            }}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-6 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest"
                        >
                            Emergency Reset
                        </button>
                    </div>
                </header>

                {/* Main Control Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <TimerCard title="Sermon Segment" timerKey="segment" timerData={timers.segment} accent="primary" />
                    <TimerCard title="Service Target" timerKey="target" timerData={timers.target} accent="secondary" />
                    <TimerCard title="Active Session" timerKey="elapsed" timerData={timers.elapsed} accent="slate-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Media Library Layer */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-6">
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                                    <ImageIcon size={18} /> Library
                                </h2>
                                <div className="flex bg-surface/50 p-1 rounded-xl border border-white/5">
                                    {['all', 'image', 'video'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setMediaFilter(f)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${mediaFilter === f ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative flex-1 md:flex-none">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search media..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full md:w-48 bg-surface/40 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <label className="bg-primary/10 hover:bg-primary border border-primary/20 text-primary hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black cursor-pointer transition-all flex items-center gap-2 shrink-0">
                                    <Plus size={14} /> UPLOAD
                                    <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*" />
                                </label>
                            </div>
                        </div>

                        <div className="glass p-8 rounded-[2.5rem] border border-white/5 min-h-[440px] relative overflow-hidden">
                            {/* Storage Indicator */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${quotaUsedPercent}%` }}
                                    className={`h-full ${quotaUsedPercent > 80 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-primary'}`}
                                />
                            </div>
                            <div className="flex justify-end mb-4">
                                <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                    <HardDrive size={10} /> {(storageStats.usage / 1024 / 1024).toFixed(1)}MB / {(storageStats.quota / 1024 / 1024 / 1024).toFixed(1)}GB USED
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredMedia.length === 0 && (
                                    <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-600 border-4 border-dashed border-white/5 rounded-[2rem]">
                                        <AlertTriangle size={48} className="mb-4 opacity-10" />
                                        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">No Matches Found</p>
                                    </div>
                                )}
                                {filteredMedia.map(item => (
                                    <motion.div
                                        layout
                                        key={item.id}
                                        className={`group relative aspect-video rounded-[1.5rem] overflow-hidden border-2 transition-all shadow-2xl ${currentScene.background === item.path ? 'border-primary ring-4 ring-primary/20' : 'border-white/5 hover:border-primary/40'}`}
                                    >
                                        {item.type.includes('video') ? (
                                            <video src={`${BASE_URL}${item.path}`} className="w-full h-full object-cover" muted loop onMouseEnter={e => e.target.play()} onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }} />
                                        ) : (
                                            <img src={`${BASE_URL}${item.path}`} alt="" className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                                            <button onClick={() => updateScene({ background: item.path })} className="bg-white text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-110 transition-transform">ACTIVATE</button>
                                            <button onClick={() => deleteMedia(item.id)} className="text-red-500/60 hover:text-red-500 p-2 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                        {currentScene.background === item.path && (
                                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-primary px-2 py-1 rounded-lg">
                                                <Zap size={10} className="text-white" fill="white" />
                                                <span className="text-[8px] font-black text-white uppercase tracking-tighter">LIVE</span>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Broadcast Center */}
                    <div className="lg:col-span-4 space-y-6">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                            <Filter size={18} /> Broadcast Control
                        </h2>
                        <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-8 backdrop-blur-3xl shadow-2xl">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                                    Dynamic Overlay Text
                                    <span className="text-primary">{currentScene.overlayText.length} / 255</span>
                                </label>
                                <textarea
                                    maxLength={255}
                                    value={currentScene.overlayText}
                                    onChange={(e) => updateScene({ overlayText: e.target.value })}
                                    className="w-full bg-black/60 border border-white/5 rounded-2xl p-5 text-sm focus:outline-none focus:border-primary transition-all min-h-[140px] resize-none font-medium leading-relaxed shadow-inner"
                                    placeholder="Enter Scripture, Announcements, or Sermon titles..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Visibility</label>
                                    <button
                                        onClick={() => updateScene({ timerVisible: !currentScene.timerVisible })}
                                        className={`w-full py-4 rounded-2xl border text-[9px] font-black transition-all tracking-widest uppercase ${currentScene.timerVisible ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-surface border-white/10 text-slate-600'}`}
                                    >
                                        Timer {currentScene.timerVisible ? 'LIVE' : 'OFF'}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Visuals</label>
                                    <button onClick={() => updateScene({ background: null })} className="w-full bg-surface border border-white/10 py-4 rounded-2xl text-[9px] font-black text-slate-500 hover:bg-white/5 transition-all tracking-widest uppercase">
                                        Clear Scene
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <div className="flex justify-between items-center">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Confidence Preview</p>
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-8 h-4 bg-black/40 border border-white/10 rounded-full">
                                            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-green-500" />
                                        </div>
                                    </div>
                                </div>
                                <div className="glass rounded-[1.5rem] overflow-hidden aspect-video relative border border-white/10 bg-black group shadow-2xl">
                                    <div className="absolute inset-0 z-0">
                                        {currentScene.background && (
                                            currentScene.background.toLowerCase().match(/\.(mp4|webm)$/) ?
                                                <video src={`${BASE_URL}${currentScene.background}`} muted autoPlay loop className="w-full h-full object-cover opacity-60" /> :
                                                <img src={`${BASE_URL}${currentScene.background}`} className="w-full h-full object-cover opacity-60" alt="" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
                                    </div>
                                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                        <motion.p
                                            layout
                                            className="text-[10px] font-black text-white/90 uppercase tracking-tight mb-2 drop-shadow-lg"
                                        >
                                            {currentScene.overlayText || "IDLE READY"}
                                        </motion.p>
                                        {currentScene.timerVisible && (
                                            <motion.p layout className="text-4xl font-black text-white tabular-nums tracking-tighter drop-shadow-2xl">
                                                {formatTime(timers.segment.remaining)}
                                            </motion.p>
                                        )}
                                    </div>
                                    <div className="absolute top-4 left-4 flex gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Toaster position="bottom-right" />
        </div>
    );
};

export default Dashboard;
