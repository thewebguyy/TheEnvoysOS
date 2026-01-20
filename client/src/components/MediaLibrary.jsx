import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Plus,
    Trash2,
    Zap,
    Image as ImageIcon,
    Video as VideoIcon,
    HardDrive,
    Filter
} from 'lucide-react';
import { BASE_URL } from '../store/useStore';

const MediaLibrary = ({ media, storageStats, currentScene, updateScene, deleteMedia, handleUpload, uploading }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [mediaFilter, setMediaFilter] = useState("all");

    const filteredMedia = useMemo(() => {
        return media.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = mediaFilter === "all" || item.type.includes(mediaFilter);
            return matchesSearch && matchesFilter;
        });
    }, [media, searchQuery, mediaFilter]);

    const quotaUsedPercent = (storageStats.usage / storageStats.quota) * 100 || 0;

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-6">
                    <div className="flex bg-surface/50 p-1 rounded-xl border border-white/5">
                        {['all', 'image', 'video'].map(f => (
                            <button
                                key={f}
                                onClick={() => setMediaFilter(f)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mediaFilter === f ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
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
                            placeholder="Search library..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-64 bg-surface/40 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-primary transition-all"
                        />
                    </div>
                    <label className="bg-primary/20 hover:bg-primary border border-primary/30 text-primary hover:text-white px-6 py-3 rounded-xl text-[10px] font-black cursor-pointer transition-all flex items-center gap-2 shrink-0">
                        {uploading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <Plus size={16} />}
                        UPLOAD
                        <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*" disabled={uploading} />
                    </label>
                </div>
            </div>

            <div className="glass-card flex-1 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Global Assets</h2>
                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                        <HardDrive size={10} /> {(storageStats.usage / 1024 / 1024).toFixed(1)}MB / {(storageStats.quota / 1024 / 1024 / 1024).toFixed(1)}GB USED
                    </p>
                </div>

                <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${quotaUsedPercent}%` }}
                        className={`h-full ${quotaUsedPercent > 80 ? 'bg-red-500' : 'bg-primary'}`}
                    />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence>
                        {filteredMedia.map(item => (
                            <motion.div
                                layout
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData('mediaPath', item.path)}
                                className={`group relative aspect-video rounded-3xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${currentScene.background === item.path ? 'border-primary ring-4 ring-primary/20' : 'border-white/5 hover:border-primary/40'}`}
                            >
                                {item.type.includes('video') ? (
                                    <video src={`${BASE_URL}${item.path}`} className="w-full h-full object-cover" muted loop onMouseEnter={e => e.target.play()} onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }} />
                                ) : (
                                    <img src={`${BASE_URL}${item.path}`} alt="" className="w-full h-full object-cover" />
                                )}

                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                                    <button
                                        onClick={() => updateScene({ background: item.path })}
                                        className="bg-white text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-110 transition-transform"
                                    >
                                        ACTIVATE
                                    </button>
                                    <button
                                        onClick={() => deleteMedia(item.id)}
                                        className="text-red-500/60 hover:text-red-500 p-2 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {currentScene.background === item.path && (
                                    <div className="absolute top-3 right-3 flex items-center gap-2 bg-primary px-3 py-1.5 rounded-full shadow-lg">
                                        <Zap size={10} className="text-white fill-white" />
                                        <span className="text-[8px] font-black text-white uppercase tracking-widest">LIVE</span>
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                                    <p className="text-[10px] font-bold text-white truncate">{item.name}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredMedia.length === 0 && (
                        <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/10 rounded-[2.5rem]">
                            <ImageIcon size={48} className="mb-4 opacity-5" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Library Empty</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaLibrary;
