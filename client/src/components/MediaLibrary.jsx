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
    Filter,
    CheckSquare,
    Square
} from 'lucide-react';
import { BASE_URL } from '../store/useStore';

const MediaLibrary = ({ media, storageStats, currentScene, updateScene, deleteMedia, handleUpload, uploading, role }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [mediaFilter, setMediaFilter] = useState("all");
    const [selectedItems, setSelectedItems] = useState([]);

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
                                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${mediaFilter === f ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {selectedItems.length > 0 && role === 'admin' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                            <button
                                onClick={() => {
                                    if (window.confirm(`Delete ${selectedItems.length} items?`)) {
                                        selectedItems.forEach(id => deleteMedia(id));
                                        setSelectedItems([]);
                                    }
                                }}
                                className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                            >
                                Bulk Delete ({selectedItems.length})
                            </button>
                            <button onClick={() => setSelectedItems([])} className="text-slate-500 hover:text-white text-[10px] font-black uppercase">Cancel</button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={1.5} />
                        <input
                            type="text"
                            placeholder="Search library..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-72 bg-surface/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-primary transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <label className="bg-primary/20 hover:bg-primary border border-primary/30 text-primary hover:text-white px-8 py-3.5 rounded-2xl text-[10px] font-black cursor-pointer transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-primary/10">
                        {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <Plus size={20} strokeWidth={1.5} />}
                        UPLOAD ASSET
                        <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*" disabled={uploading} />
                    </label>
                </div>
            </div>

            <div className="glass-card flex-1 rounded-[3rem] border border-white/5 relative overflow-hidden flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-8 px-2">
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-300">Global Assets Library</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border border-white/5">
                        <HardDrive size={14} strokeWidth={1.5} /> {(storageStats.usage / 1024 / 1024).toFixed(1)}MB / {(storageStats.quota / 1024 / 1024 / 1024).toFixed(1)}GB USED
                    </p>
                </div>

                <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${quotaUsedPercent}%` }}
                        className={`h-full ${quotaUsedPercent > 80 ? 'bg-red-500' : 'bg-primary'}`}
                    />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-8 overflow-y-auto pr-2 custom-scrollbar">
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
                                className={`group relative aspect-video rounded-3xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${currentScene.background === item.path ? 'border-primary ring-4 ring-primary/20' : selectedItems.includes(item.id) ? 'border-primary/60' : 'border-white/5 hover:border-primary/40'}`}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedItems(prev =>
                                            prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]
                                        );
                                    }}
                                    className={`absolute top-3 left-3 z-20 p-1.5 rounded-lg transition-all ${selectedItems.includes(item.id) ? 'bg-primary text-white' : 'bg-black/40 text-white/40 opacity-0 group-hover:opacity-100'}`}
                                >
                                    {selectedItems.includes(item.id) ? <CheckSquare size={16} strokeWidth={2} /> : <Square size={16} strokeWidth={2} />}
                                </button>

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
                                        className="text-red-500/60 hover:text-red-500 p-2 transition-colors bg-red-500/10 rounded-lg"
                                    >
                                        <Trash2 size={20} strokeWidth={1.5} />
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
