import React, { useState, useEffect, useCallback } from 'react';
import useStore, { BASE_URL } from '../store/useStore';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Monitor, Cast, Sliders, ExternalLink } from 'lucide-react';
import { useDisplayCount } from '../hooks/useDisplayCount';
import { displayManager } from '../utils/DisplayManager';

// Components
import Sidebar from '../components/Sidebar';
import TimerSystem from '../components/TimerSystem';
import MediaLibrary from '../components/MediaLibrary';
import BroadcastControl from '../components/BroadcastControl';
import ErrorBoundary from '../components/ErrorBoundary';

const Dashboard = () => {
    const {
        timers, currentScene, media, storageStats, stagedScene, previewMode,
        updateTimer, updateScene, fetchMedia, deleteMedia, resetAll,
        isConnected, isSyncing, setPreviewMode, goLive, undo, redo, actionQueue
    } = useStore();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [uploading, setUploading] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [role, setRole] = useState('admin'); // 'admin' or 'volunteer'

    // Display Management
    const { displayCount, isSupported, detectDisplays, screens } = useDisplayCount();

    const handleLaunchAll = async () => {
        if (isSupported && displayCount === 0) {
            await detectDisplays();
        }
        await displayManager.launchAll();
        toast.success('Launching all outputs...');
    };


    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Timer Presets 1-9
            if (e.key >= '1' && e.key <= '9') {
                const mins = parseInt(e.key) * 5; // e.g., 1=5min, 2=10min
                updateTimer('segment', { duration: mins * 60, remaining: mins * 60 });
                toast.success(`Preset: ${mins} minutes`);
            }

            // SPACE: Toggle Timer
            if (e.code === 'Space') {
                e.preventDefault();
                updateTimer('segment', { running: !timers.segment.running });
            }

            // ESC: Clear Scene
            if (e.key === 'Escape') {
                updateScene({ background: null, overlayText: '' });
                toast('Scene Cleared', { icon: '🧹' });
            }

            // Z / Y: UDP / REDO
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                undo();
            }
            if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                redo();
            }

            // P: Preview Mode
            if (e.key.toLowerCase() === 'p') {
                setPreviewMode(!previewMode);
                toast(`Preview Mode: ${!previewMode ? 'ON' : 'OFF'}`);
            }

            // ?: Shortcuts Overlay
            if (e.key === '?') {
                toast((t) => (
                    <div className="p-4 flex flex-col gap-2">
                        <p className="font-black text-xs uppercase mb-2 border-b border-white/10 pb-2">Keyboard Shortcuts</p>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px] font-bold text-slate-400">
                            <span>Space</span> <span className="text-white">Toggle Timer</span>
                            <span>1-9</span> <span className="text-white">Timer Presets</span>
                            <span>Esc</span> <span className="text-white">Clear Scene</span>
                            <span>Ctrl+Z</span> <span className="text-white">Undo</span>
                            <span>P</span> <span className="text-white">Preview Mode</span>
                        </div>
                    </div>
                ), { duration: 5000 });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [timers, previewMode, updateTimer, updateScene, undo, redo, setPreviewMode]);

    // Voice recognition logic
    useEffect(() => {
        let recognition = null;
        if (isVoiceActive && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
                console.log('Voice Command:', command);

                if (command.includes('start timer') || command.includes('play timer')) {
                    updateTimer('segment', { running: true });
                    toast.success('Voice: Timer Started');
                } else if (command.includes('stop timer') || command.includes('pause timer')) {
                    updateTimer('segment', { running: false });
                    toast.success('Voice: Timer Paused');
                } else if (command.includes('clear scene')) {
                    updateScene({ background: null });
                    toast.success('Voice: Scene Cleared');
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsVoiceActive(false);
            };

            recognition.start();
        }

        return () => {
            if (recognition) recognition.stop();
        };
    }, [isVoiceActive, updateTimer, updateScene]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('media', file);
        setUploading(true);
        const tid = toast.loading('Processing high-quality media...');

        try {
            await axios.post(`${BASE_URL}/api/upload`, formData);
            toast.success('Asset synced successfully', { id: tid });
            fetchMedia();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Upload failed', { id: tid });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-slate-200 selection:bg-primary/30 flex overflow-hidden">
            {/* Persistent Global Status Bar */}
            <div className={`fixed top-0 left-0 right-0 z-[60] h-1.5 transition-all duration-500 overflow-hidden ${!isConnected ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' : actionQueue.length > 0 ? 'bg-amber-500' : 'bg-primary'}`}>
                {actionQueue.length > 0 && (
                    <motion.div
                        className="h-full bg-white/40"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                )}
            </div>

            <AnimatePresence>
                {!isConnected && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-4 rounded-2xl z-[100] flex items-center gap-4 shadow-2xl border border-red-400/30"
                    >
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                        <div className="text-left">
                            <h3 className="text-xs font-black uppercase tracking-widest">Connection Lost</h3>
                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Offline — Queuing Changes ({actionQueue.length})</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 ml-20 lg:ml-72 p-6 lg:p-10 h-screen overflow-y-auto custom-scrollbar">
                <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-black tracking-tight uppercase leading-none">
                            {activeTab === 'dashboard' ? 'Control Hub' :
                                activeTab === 'media' ? 'Media Library' :
                                    activeTab === 'timers' ? 'Timer System' :
                                        activeTab === 'outputs' ? 'Output Routing' : 'Settings'}
                        </h2>
                        <p className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">
                            {isConnected ? 'System Synchronized' : 'Offline Mode'} • v1.5.0 STABLE
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 lg:gap-6 w-full xl:w-auto">
                        {/* Miniature Output Previews */}
                        <div className="hidden xl:flex items-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/5">
                            {['audience', 'stage', 'stream'].map(id => (
                                <div key={id} className="relative w-24 aspect-video rounded-lg overflow-hidden border border-white/10 group">
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <Monitor size={12} className="text-slate-500" />
                                    </div>
                                    <div className="absolute top-1 left-2 text-[6px] font-black uppercase text-white/40 tracking-widest">{id}</div>
                                    {/* Mock live feedback */}
                                    <div className="absolute bottom-1 right-2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                                </div>
                            ))}
                        </div>

                        <div className="flex bg-surface/50 p-1.5 rounded-2xl border border-white/5">
                            <button
                                onClick={() => setPreviewMode(false)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${!previewMode ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Live
                            </button>
                            <button
                                onClick={() => setPreviewMode(true)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${previewMode ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Preview
                            </button>
                        </div>

                        {previewMode && (
                            <button
                                onClick={goLive}
                                className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-500/20 active:scale-95"
                            >
                                <Zap size={16} strokeWidth={1.5} fill="white" />
                                GO LIVE
                            </button>
                        )}

                        {role === 'admin' && (
                            <button
                                onClick={() => {
                                    if (window.confirm("CRITICAL: Reset all active timers? This cannot be undone.")) resetAll();
                                }}
                                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-6 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest"
                                aria-label="Emergency System Reset"
                            >
                                Emergency Reset
                            </button>
                        )}
                    </div>
                </header>

                <div className="h-[calc(100vh-140px)]">
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-full">
                            <div className="lg:col-span-8 flex flex-col gap-10 min-h-0">
                                <ErrorBoundary>
                                    <TimerSystem timers={timers} updateTimer={updateTimer} />
                                </ErrorBoundary>
                                <div className="flex-1 min-h-0">
                                    <ErrorBoundary>
                                        <MediaLibrary
                                            media={media}
                                            storageStats={storageStats}
                                            currentScene={previewMode ? stagedScene : currentScene}
                                            updateScene={updateScene}
                                            deleteMedia={role === 'admin' ? deleteMedia : null}
                                            handleUpload={handleUpload}
                                            uploading={uploading}
                                        />
                                    </ErrorBoundary>
                                </div>
                            </div>
                            <div className="lg:col-span-4 h-full">
                                <ErrorBoundary>
                                    <BroadcastControl
                                        currentScene={previewMode ? stagedScene : currentScene}
                                        updateScene={updateScene}
                                        timers={timers}
                                        isVoiceActive={isVoiceActive}
                                        setIsVoiceActive={setIsVoiceActive}
                                        previewMode={previewMode}
                                    />
                                </ErrorBoundary>
                            </div>
                        </div>
                    )}

                    {activeTab === 'media' && (
                        <MediaLibrary
                            media={media}
                            storageStats={storageStats}
                            currentScene={currentScene}
                            updateScene={updateScene}
                            deleteMedia={role === 'admin' ? deleteMedia : null}
                            handleUpload={handleUpload}
                            uploading={uploading}
                        />
                    )}

                    {activeTab === 'timers' && (
                        <div className="max-w-5xl mx-auto">
                            <TimerSystem timers={timers} updateTimer={updateTimer} />
                        </div>
                    )}

                    {activeTab === 'outputs' && (
                        <div className="space-y-8">
                            <div className="glass-card p-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-black flex items-center gap-3">
                                            <Monitor className="text-primary" />
                                            Active Displays: {displayCount > 0 ? displayCount : 'Unknown'}
                                        </h3>
                                        <p className="text-slate-500 text-sm mt-1">
                                            {isSupported
                                                ? "Browser supports Multi-Screen Window Placement API"
                                                : "Browser does NOT support Window Placement API. Outputs will open as popup windows."}
                                        </p>
                                    </div>
                                    {isSupported && (
                                        <button
                                            onClick={detectDisplays}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                        >
                                            Detect Displays
                                        </button>
                                    )}
                                </div>
                                {screens.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {screens.map((screen, idx) => (
                                            <div key={idx} className="p-4 bg-black/20 rounded-xl border border-white/5">
                                                <p className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-1">Display {idx + 1}</p>
                                                <p className="font-medium text-sm">{screen.label || `Unknown Display`}</p>
                                                <p className="text-xs text-slate-500 mt-2">{screen.width}x{screen.height} • {screen.isPrimary ? 'Primary' : 'Extended'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { id: 'audience', name: 'Audience View', path: '/audience', desc: 'Main projector output' },
                                    { id: 'stage', name: 'Stage View', path: '/stage', desc: 'Confidence monitor for speakers' },
                                    { id: 'stream', name: 'Stream View', path: '/stream', desc: 'OBS/vMix alpha transparency feed' }
                                ].map((output, idx) => (
                                    <div
                                        key={output.path}
                                        className="glass-card p-8 rounded-[3rem] hover:border-primary/40 transition-all group flex flex-col items-center text-center relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                            <Monitor size={40} className="text-slate-600 group-hover:text-primary transition-colors" />
                                        </div>
                                        <h3 className="text-xl font-black mb-2">{output.name}</h3>
                                        <p className="text-sm text-slate-500 font-medium mb-8">{output.desc}</p>

                                        <div className="flex gap-2 w-full">
                                            <button
                                                onClick={() => displayManager.launchOutput(output.id, output.path)}
                                                className="flex-1 px-4 py-3 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center gap-2"
                                            >
                                                <ExternalLink size={12} />
                                                Launch
                                            </button>
                                            {/* Future: Add selector to assign specific screen */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="glass-card p-10 rounded-[3rem] max-w-2xl border border-white/5">
                            <h3 className="text-xl font-black mb-8 italic">System Configuration</h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center p-6 bg-white/5 rounded-3xl">
                                    <div>
                                        <p className="font-bold text-sm">Chroma Key Mode</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">For Green Screen Overlays</p>
                                    </div>
                                    <button
                                        onClick={() => updateScene({ chromaKey: !currentScene.chromaKey })}
                                        className={`w-14 h-8 rounded-full transition-colors relative ${currentScene.chromaKey ? 'bg-primary' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${currentScene.chromaKey ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                                <div className="flex justify-between items-center p-6 bg-white/5 rounded-3xl">
                                    <div>
                                        <p className="font-bold text-sm">Active User Role</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Permission Level</p>
                                    </div>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none"
                                    >
                                        <option value="admin">Administrator (Full)</option>
                                        <option value="volunteer">Volunteer (Limited)</option>
                                    </select>
                                </div>
                                <div className="flex justify-between items-center p-6 bg-white/5 rounded-3xl">
                                    <div>
                                        <p className="font-bold text-sm">Global Language</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Currently: English (US)</p>
                                    </div>
                                    <select className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none">
                                        <option>English</option>
                                        <option>Yoruba</option>
                                        <option>Igbo</option>
                                        <option>Hausa</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Toaster position="bottom-right" />
        </div>
    );
};

export default Dashboard;
