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
import useStore, { BASE_URL } from '../store/useStore';

const MediaLibrary = ({ media, storageStats, currentScene, updateScene, deleteMedia, handleUpload, uploading, role }) => {
    const isConnected = useStore(state => state.isConnected);
    const [searchQuery, setSearchQuery] = useState("");
    const [mediaFilter, setMediaFilter] = useState("all");
    const [selectedItems, setSelectedItems] = useState([]);
    const [isMultiSelect, setIsMultiSelect] = useState(false);

    const filteredMedia = useMemo(() => {
        return media.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = mediaFilter === "all" || item.type.includes(mediaFilter);
            return matchesSearch && matchesFilter;
        });
    }, [media, searchQuery, mediaFilter]);

    const quotaUsedPercent = (storageStats.usage / storageStats.quota) * 100 || 0;

    return (
        <div className="space-y-8 flex flex-col h-full">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                    <div className="flex bg-surface/50 p-1.5 rounded-2xl border border-white/5">
                        {['all', 'image', 'video'].map(f => (
                            <button
                                key={f}
                                onClick={() => setMediaFilter(f)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${mediaFilter === f ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setIsMultiSelect(!isMultiSelect)}
                        className={`px-6 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest border transition-all ${isMultiSelect ? 'bg-secondary text-white border-secondary' : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10'}`}
                    >
                        {isMultiSelect ? 'Discard Selection' : 'Select Multiple'}
                    </button>

                    {selectedItems.length > 0 && role === 'admin' && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
                            <button
                                onClick={() => {
                                    if (window.confirm(`Delete ${selectedItems.length} items?`)) {
                                        selectedItems.forEach(id => deleteMedia(id));
                                        setSelectedItems([]);
                                        setIsMultiSelect(false);
                                    }
                                }}
                                className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                            >
                                Delete Selected ({selectedItems.length})
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 w-full xl:w-auto">
                    {!isConnected && (
                        <div className="px-5 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            Offline Mode
                        </div>
                    )}

                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={1.5} />
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-80 bg-surface/40 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-primary transition-all placeholder:text-slate-600 font-medium"
                        />
                    </div>

                    <label className={`px-8 py-4 rounded-2xl text-[10px] font-black cursor-pointer transition-all flex items-center gap-3 shrink-0 shadow-lg ${!isConnected ? 'bg-white/5 text-slate-600 border border-white/5 opacity-50 cursor-not-allowed' : 'bg-primary/20 hover:bg-primary border border-primary/30 text-primary hover:text-white shadow-primary/10 active:scale-95'}`}>
                        {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <Plus size={20} strokeWidth={1.5} />}
                        UPLOAD ASSET
                        <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*" disabled={uploading || !isConnected} />
                    </label>
                </div>
            </div>

            <div className="glass-card flex-1 rounded-[3rem] border border-white/5 relative overflow-hidden flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-10 px-4 pt-4">
                    <div className="flex items-center gap-3">
                        <HardDrive size={18} strokeWidth={1.5} className="text-primary" />
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-300">Global Library</h2>
                    </div>

                    <div className="flex items-center gap-5">
                        {quotaUsedPercent > 80 && <Zap size={16} className="text-amber-500 fill-amber-500 animate-pulse" />}
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-black/20 px-5 py-2.5 rounded-full border border-white/5">
                            {(storageStats.usage / 1024 / 1024).toFixed(1)}MB / {(storageStats.quota / 1024 / 1024 / 1024).toFixed(1)}GB USED
                        </p>
                    </div>
                </div>

                <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${quotaUsedPercent}%` }}
                        className={`h-full transition-all duration-1000 ${quotaUsedPercent > 80 ? 'bg-red-500' : quotaUsedPercent > 50 ? 'bg-amber-500' : 'bg-primary'}`}
                    />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-10 overflow-y-auto pr-4 custom-scrollbar pb-10">
                    <AnimatePresence>
                        {filteredMedia.map(item => (
                            <motion.div
                                layout
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData('mediaPath', item.path)}
                                className={`group relative aspect-video rounded-[2rem] overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${currentScene.background === item.path ? 'border-primary ring-[6px] ring-primary/20' : selectedItems.includes(item.id) ? 'border-secondary' : 'border-white/5 hover:border-white/20'}`}
                            >
                                {(isMultiSelect || selectedItems.includes(item.id)) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedItems(prev =>
                                                prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]
                                            );
                                        }}
                                        className={`absolute top-4 left-4 z-20 p-2 rounded-xl transition-all shadow-xl ${selectedItems.includes(item.id) ? 'bg-secondary text-white' : 'bg-black/60 text-white/40 backdrop-blur-md'}`}
                                    >
                                        {selectedItems.includes(item.id) ? <CheckSquare size={18} strokeWidth={2.5} /> : <Square size={18} strokeWidth={1.5} />}
                                    </button>
                                )}

                                {item.type.includes('video') ? (
                                    <video src={`${BASE_URL}${item.path}`} className="w-full h-full object-cover" muted loop onMouseEnter={e => e.target.play()} onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }} />
                                ) : (
                                    <img src={`${BASE_URL}${item.path}`} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                )}

                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 backdrop-blur-[4px]">
                                    {!isMultiSelect && (
                                        <>
                                            <button
                                                onClick={() => updateScene({ background: item.path })}
                                                className="bg-white text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                                            >
                                                ACTIVATE
                                            </button>
                                            <button
                                                onClick={() => deleteMedia(item.id)}
                                                className="text-red-500/80 hover:text-red-500 p-3 transition-colors bg-red-500/10 rounded-xl border border-red-500/20"
                                            >
                                                <Trash2 size={20} strokeWidth={1.5} />
                                            </button>
                                        </>
                                    )}
                                </div>

                                {currentScene.background === item.path && (
                                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-primary px-4 py-2 rounded-full shadow-2xl border border-white/20">
                                        <Zap size={12} className="text-white fill-white" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE</span>
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest truncate">{item.name}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredMedia.length === 0 && (
                        <div className="col-span-full h-96 flex flex-col items-center justify-center text-slate-400 border-4 border-dashed border-white/5 rounded-[4rem] group hover:border-primary/20 transition-colors">
                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 group-hover:bg-primary/10 transition-colors">
                                <ImageIcon size={48} className="opacity-20 group-hover:text-primary group-hover:opacity-100 transition-all" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Your library is empty</h3>
                            <p className="text-[11px] font-black uppercase tracking-widest opacity-40 max-w-xs text-center leading-relaxed">
                                Click the <span className="text-primary italic">UPLOAD ASSET</span> button above to add images and videos to your hub.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default MediaLibrary;
