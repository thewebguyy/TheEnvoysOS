import React from 'react';
import {
    LayoutDashboard,
    Monitor,
    Image as ImageIcon,
    Settings,
    Shield,
    ExternalLink,
    Clock,
    Zap,
    Users
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Control Hub' },
        { id: 'media', icon: ImageIcon, label: 'Media Library' },
        { id: 'timers', icon: Clock, label: 'Timer System' },
        { id: 'outputs', icon: Monitor, label: 'Output Routing' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-20 lg:w-64 bg-surface border-r border-white/5 flex flex-col z-50 transition-all duration-300">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-faith-blue flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                    <Zap size={20} className="text-white" fill="white" />
                </div>
                <div className="hidden lg:block overflow-hidden whitespace-nowrap">
                    <h1 className="text-xl font-black tracking-tighter">ENVOYS<span className="text-primary italic">OS</span></h1>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Live Production</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${activeTab === item.id
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <item.icon size={20} className={activeTab === item.id ? 'animate-pulse-slow' : 'group-hover:scale-110 transition-transform'} />
                        <span className="hidden lg:block font-bold text-sm tracking-wide">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 hidden lg:block">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lagos Hub Active</span>
                    </div>
                    <div className="flex gap-2">
                        <a href="/audience" target="_blank" className="p-2 bg-surface rounded-lg hover:bg-primary/20 hover:text-primary transition-all text-slate-500" title="Audience View">
                            <Users size={16} />
                        </a>
                        <a href="/stage" target="_blank" className="p-2 bg-surface rounded-lg hover:bg-primary/20 hover:text-primary transition-all text-slate-500" title="Stage View">
                            <Shield size={16} />
                        </a>
                        <a href="/stream" target="_blank" className="p-2 bg-surface rounded-lg hover:bg-primary/20 hover:text-primary transition-all text-slate-500" title="Stream View">
                            <ExternalLink size={16} />
                        </a>
                    </div>
                </div>
                <div className="lg:hidden flex flex-col gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
