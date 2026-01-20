import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { Play, Pause, RotateCcw, Monitor, Settings, Image as ImageIcon, Type, ExternalLink } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
    const { timers, currentScene, media, updateTimer, updateScene, fetchMedia } = useStore();

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('media', file);
        try {
            await axios.post('http://localhost:3001/api/upload', formData);
        } catch (err) {
            console.error('Upload failed', err);
        }
    };

    const formatTime = (seconds) => {
        if (seconds === undefined || seconds === null) return "00:00";
        const mins = Math.floor(Math.abs(seconds) / 60);
        const secs = Math.floor(Math.abs(seconds) % 60);
        return `${seconds < 0 ? '-' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const TimerCard = ({ title, timerKey, timerData }) => {
        const [inputVal, setInputVal] = useState((timerData.duration / 60).toString() || '');

        const toggleTimer = () => {
            updateTimer(timerKey, { running: !timerData.running });
        };

        const resetTimer = () => {
            updateTimer(timerKey, {
                remaining: timerData.duration || 0,
                running: false,
                seconds: 0
            });
        };

        const handleDurationChange = (e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val)) {
                updateTimer(timerKey, { duration: val * 60, remaining: val * 60 });
            }
            setInputVal(e.target.value);
        };

        return (
            <div className="glass p-6 rounded-2xl flex flex-col gap-4 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold ${timerData.running ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {timerData.running ? 'ACTIVE' : 'IDLE'}
                    </div>
                </div>

                <div className="text-5xl font-mono font-bold tracking-tighter text-white">
                    {timerKey === 'elapsed' ? formatTime(timerData.seconds) : formatTime(timerData.remaining)}
                </div>

                <div className="flex gap-2">
                    {timerKey === 'segment' && (
                        <input
                            type="number"
                            value={inputVal}
                            onChange={handleDurationChange}
                            placeholder="Mins"
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 w-20 text-sm focus:outline-none focus:border-primary"
                        />
                    )}
                    <button onClick={toggleTimer} className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 font-medium transition-all ${timerData.running ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-primary/20 text-primary hover:bg-primary/30'}`}>
                        {timerData.running ? <Pause size={18} /> : <Play size={18} />}
                        {timerData.running ? 'Pause' : 'Start'}
                    </button>
                    <button onClick={resetTimer} className="p-2 rounded-lg bg-surface hover:bg-surface-hover border border-white/5 transition-colors">
                        <RotateCcw size={18} className="text-slate-400" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">TheEnvoysOS</h1>
                    <p className="text-slate-500 font-medium">Mission Control Dashboard</p>
                </div>
                <div className="flex gap-4">
                    <a href="/audience" target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2 text-sm">
                        <Monitor size={16} /> Audience
                    </a>
                    <a href="/stage" target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2 text-sm">
                        <Settings size={16} /> Stage
                    </a>
                    <a href="/stream" target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2 text-sm">
                        <ExternalLink size={16} /> Stream
                    </a>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TimerCard title="Segment" timerKey="segment" timerData={timers.segment} />
                <TimerCard title="Target" timerKey="target" timerData={timers.target} />
                <TimerCard title="Elapsed" timerKey="elapsed" timerData={timers.elapsed} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ImageIcon size={20} className="text-primary" /> Media & Scene
                    </h2>
                    <div className="glass p-6 rounded-2xl space-y-6">
                        <div>
                            <label className="text-sm font-medium text-slate-400 mb-2 block">Overlay Text</label>
                            <textarea
                                value={currentScene.overlayText}
                                onChange={(e) => updateScene({ overlayText: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-primary transition-colors min-h-[100px]"
                                placeholder="Enter Bible verse or announcement..."
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-400 block">Background Gallery</label>
                            <div className="grid grid-cols-4 gap-2">
                                <label className="aspect-video bg-black/40 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group">
                                    <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*" />
                                    <ImageIcon size={20} className="text-slate-500 group-hover:text-primary mb-1" />
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Upload</span>
                                </label>
                                {media.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => updateScene({ background: item.path })}
                                        className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${currentScene.background === item.path ? 'border-primary' : 'border-transparent'}`}
                                    >
                                        {item.type.includes('video') ? (
                                            <video src={`http://localhost:3001${item.path}`} className="w-full h-full object-cover" muted />
                                        ) : (
                                            <img src={`http://localhost:3001${item.path}`} alt="" className="w-full h-full object-cover" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => updateScene({ timerVisible: !currentScene.timerVisible })}
                                className={`flex-1 py-3 rounded-xl border transition-all font-medium ${currentScene.timerVisible ? 'bg-primary/20 border-primary/50 text-white' : 'bg-surface border-white/5 text-slate-500'}`}
                            >
                                {currentScene.timerVisible ? 'Timer Visible' : 'Timer Hidden'}
                            </button>
                            <button
                                onClick={() => updateScene({ background: null })}
                                className="px-4 py-3 rounded-xl bg-surface border border-white/5 hover:bg-surface-hover text-slate-400 text-sm"
                            >
                                Clear BG
                            </button>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Type size={20} className="text-secondary" /> Preview
                    </h2>
                    <div className="glass rounded-2xl overflow-hidden aspect-video relative border border-white/5 bg-black">
                        {/* Mini Preview of Audience View */}
                        <div className="absolute inset-0 z-0">
                            {currentScene.background && (
                                currentScene.background.toLowerCase().endsWith('.mp4') || currentScene.background.toLowerCase().endsWith('.webm') ? (
                                    <video src={`http://localhost:3001${currentScene.background}`} className="w-full h-full object-cover" autoPlay loop muted />
                                ) : (
                                    <img src={`http://localhost:3001${currentScene.background}`} className="w-full h-full object-cover" alt="" />
                                )
                            )}
                            <div className="absolute inset-0 bg-black/40" />
                        </div>
                        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 text-center">
                            <div className="text-xs text-white/80 font-bold mb-2 line-clamp-2">{currentScene.overlayText}</div>
                            {currentScene.timerVisible && (
                                <div className="text-4xl font-mono font-bold text-white tracking-tighter">
                                    {formatTime(timers.segment.remaining)}
                                </div>
                            )}
                        </div>
                        <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase">Live Preview</div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
