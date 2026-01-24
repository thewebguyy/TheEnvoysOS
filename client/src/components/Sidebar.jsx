import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Monitor,
    Image as ImageIcon,
    Settings,
    Shield,
    ExternalLink,
    Clock,
    Zap,
    Users,
    Menu,
    X
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Control Hub' },
        { id: 'media', icon: ImageIcon, label: 'Media Library' },
        { id: 'timers', icon: Clock, label: 'Timer System' },
        { id: 'outputs', icon: Monitor, label: 'Output Routing' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-white/5 flex items-center justify-between px-6 z-[60]">
                <div className="flex items-center gap-3">
                    <Zap size={20} className="text-primary fill-primary" />
                    <h1 className="text-lg font-black tracking-tight">ENVOYS<span className="text-primary italic">OS</span></h1>
                </div>
                <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-400">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`fixed left-0 top-0 h-full bg-surface border-r border-white/5 flex flex-col z-[58] transition-all duration-500 lg:translate-x-0 ${isOpen ? 'translate-x-0 w-72 shadow-[20px_0_50px_rgba(0,0,0,0.5)]' : '-translate-x-full lg:translate-x-0 w-20 lg:w-72'}`}>
                <div className="p-8 hidden lg:flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-faith-blue flex items-center justify-center shadow-xl shadow-primary/20 shrink-0">
                        <Zap size={24} strokeWidth={1.5} className="text-white" fill="white" />
                    </div>
                    <div className="hidden lg:block overflow-hidden whitespace-nowrap">
                        <h1 className="text-2xl font-black tracking-tight leading-none">ENVOYS<span className="text-primary italic">OS</span></h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Live Production</p>
                    </div>
                </div>

                <nav className="flex-1 px-6 py-10 space-y-3 mt-16 lg:mt-0">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-5 px-5 py-4 rounded-2xl transition-all group min-h-[56px] ${activeTab === item.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 border border-primary/20'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 1.5} className="shrink-0" />
                            <span className={`text-[11px] font-black uppercase tracking-widest transition-opacity duration-300 ${isOpen || 'lg:block hidden'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/5 bg-black/20 mt-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center shrink-0">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.5)]" />
                        </div>
                        {(isOpen || true) && (
                            <div className="hidden lg:block overflow-hidden">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest truncate">Lagos Hub Active</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Secure v2.0.0-PRO</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
