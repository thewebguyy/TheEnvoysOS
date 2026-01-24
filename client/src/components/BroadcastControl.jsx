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
    Monitor,
    Save,
    Bookmark
} from 'lucide-react';
import useStore, { BASE_URL } from '../store/useStore';

const BroadcastControl = ({ currentScene, updateScene, timers, isVoiceActive, setIsVoiceActive, previewMode }) => {
    const { presets, savePreset, loadPreset, deletePreset } = useStore();
    const [presetName, setPresetName] = React.useState("");
    const formatTime = (seconds) => {
        const absSec = Math.floor(Math.abs(seconds));
        const mins = Math.floor(absSec / 60);
        const secs = absSec % 60;
        const sign = seconds < 0 ? '-' : '';
        return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-8 flex flex-col h-full">
            <div className={`glass-card rounded-[3rem] border transition-all duration-500 ${previewMode ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'}`}>
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] flex items-center gap-3">
                        <Layers size={20} strokeWidth={1.5} className={previewMode ? 'text-amber-500' : 'text-primary'} />
                        {previewMode ? 'Stage Preparation' : 'Live Control'}
                    </h3>
                    <button
                        onClick={() => setIsVoiceActive(!isVoiceActive)}
                        className={`p-3 rounded-xl transition-all ${isVoiceActive ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-slate-400'}`}
                        title="Voice Control (Beta)"
                    >
                        {isVoiceActive ? <Mic size={20} strokeWidth={1.5} /> : <MicOff size={20} strokeWidth={1.5} />}
                    </button>
                </div>

                <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex justify-between px-2">
                        Scene Presets
                        <Bookmark size={14} className="opacity-40" />
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Preset Name"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-bold focus:outline-none"
                        />
                        <button
                            onClick={() => { if (presetName) { savePreset(presetName); setPresetName(""); } }}
                            className="bg-white/5 hover:bg-white/10 p-2 rounded-xl text-slate-400"
                        >
                            <Save size={16} />
                        </button>
                    </div>
                    {presets.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {presets.map(p => (
                                <div key={p.id} className="group relative">
                                    <button
                                        onClick={() => loadPreset(p.id)}
                                        className="bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                                    >
                                        {p.name}
                                    </button>
                                    <button
                                        onClick={() => deletePreset(p.id)}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex justify-between px-2">
                        Overlay Content
                        <div className="flex items-center gap-2">
                            {currentScene.overlayText.match(/^[12]?\s?[A-Za-z]+\s\d+:\d+/) && (
                                <span className={`text-[8px] px-2 py-0.5 rounded-md ${previewMode ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/20 text-primary'}`}>Scripture Detected</span>
                            )}
                            <span className="opacity-40">{currentScene.overlayText.length} / 255</span>
                        </div>
                    </label>
                    <textarea
                        maxLength={255}
                        value={currentScene.overlayText}
                        onChange={(e) => updateScene({ overlayText: e.target.value })}
                        className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-6 text-sm focus:outline-none focus:border-primary transition-all min-h-[140px] resize-none font-medium leading-relaxed custom-scrollbar placeholder:text-slate-700"
                        placeholder="Type Scripture, Announcements or Lyrics..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                    <button
                        onClick={() => updateScene({ timerVisible: !currentScene.timerVisible })}
                        className={`group relative overflow-hidden py-6 rounded-[1.5rem] border text-[10px] font-black transition-all tracking-[0.2em] uppercase ${currentScene.timerVisible
                            ? 'bg-primary/10 border-primary/30 text-primary shadow-lg'
                            : 'bg-white/5 border-white/5 text-slate-500'
                            }`}
                    >
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            {currentScene.timerVisible ? <Eye size={20} strokeWidth={1.5} /> : <EyeOff size={20} strokeWidth={1.5} />}
                            Timer Layer
                        </div>
                    </button>

                    <button
                        onClick={() => updateScene({ background: null, overlayText: '' })}
                        className="bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 py-6 rounded-[1.5rem] text-[10px] font-black text-slate-500 hover:text-red-500 transition-all tracking-[0.2em] uppercase flex flex-col items-center gap-3"
                    >
                        <Trash2 size={20} strokeWidth={1.5} />
                        Reset Scene
                    </button>
                </div>
            </div>

            <div className={`glass-card flex-1 rounded-[3rem] border transition-all duration-500 flex flex-col min-h-0 ${previewMode ? 'border-amber-500/30' : 'border-white/5'}`}>
                <div className="flex justify-between items-center mb-6 px-2">
                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] flex items-center gap-3">
                        <Monitor size={20} strokeWidth={1.5} className="text-secondary" />
                        {previewMode ? 'Staged Preview' : 'Confidence Monitor'}
                    </h3>
                    <div className="flex gap-2">
                        <div className={`w-2 h-2 rounded-full ${previewMode ? 'bg-amber-500' : 'bg-red-500 animate-pulse-critical'}`} />
                        <div className="w-2 h-2 rounded-full bg-green-500/20" />
                    </div>
                </div>

                <div
                    className={`relative flex-1 rounded-[2.5rem] overflow-hidden bg-black border shadow-2xl group transition-all duration-500 ${previewMode ? 'border-amber-500/40 scale-[0.98]' : 'border-white/5'}`}
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
                                    muted autoPlay loop
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
                                <Monitor size={80} strokeWidth={1} className="mb-4 opacity-20" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20">Drop Asset Here</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
                    </div>

                    {/* Overlays */}
                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-10 text-center bg-black/20 backdrop-blur-[1px]">
                        <motion.p
                            layout
                            className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 drop-shadow-2xl"
                        >
                            {currentScene.overlayText || (previewMode ? "PREPARING..." : "SIGNAL ACTIVE")}
                        </motion.p>
                        {currentScene.timerVisible && (
                            <motion.p
                                layout
                                className="text-6xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)]"
                            >
                                {formatTime(timers.segment.remaining)}
                            </motion.p>
                        )}
                    </div>

                    {/* Badge */}
                    <div className={`absolute bottom-6 right-6 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl border transition-all duration-500 ${previewMode ? 'bg-amber-500 border-amber-400/50' : 'bg-primary border-white/20'}`}>
                        <div className={`w-2 h-2 rounded-full bg-white ${previewMode ? '' : 'animate-pulse'}`} />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">{previewMode ? 'STAGING' : 'LIVE'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default BroadcastControl;
