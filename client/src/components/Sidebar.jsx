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
        <aside className="fixed left-0 top-0 h-full w-20 lg:w-72 bg-surface border-r border-white/5 flex flex-col z-50 transition-all duration-300">
            <div className="p-8 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-faith-blue flex items-center justify-center shadow-xl shadow-primary/20 shrink-0">
                    <Zap size={24} strokeWidth={1.5} className="text-white" fill="white" />
                </div>
                <div className="hidden lg:block overflow-hidden whitespace-nowrap">
                    <h1 className="text-2xl font-black tracking-tighter leading-none">ENVOYS<span className="text-primary italic">OS</span></h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Live Production</p>
                </div>
            </div>

            <nav className="flex-1 px-6 py-10 space-y-3">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-5 px-5 py-4 rounded-2xl transition-all group min-h-[56px] ${activeTab === item.id
                            ? 'bg-primary text-white shadow-lg shadow-primary/30 border border-primary/20'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <item.icon size={24} strokeWidth={1.5} className={activeTab === item.id ? '' : 'group-hover:scale-110 transition-transform'} />
                        <span className="hidden lg:block font-black text-[11px] uppercase tracking-widest leading-none">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-6 mt-auto">
                <div className="bg-black/40 rounded-[2rem] p-6 border border-white/5 hidden lg:block">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Lagos Hub Active</span>
                    </div>
                    <div className="flex gap-3">
                        <a href="/audience" target="_blank" className="p-3 bg-surface rounded-xl hover:bg-primary/20 hover:text-primary transition-all text-slate-400 border border-white/5" title="Audience View">
                            <Users size={20} strokeWidth={1.5} />
                        </a>
                        <a href="/stage" target="_blank" className="p-3 bg-surface rounded-xl hover:bg-primary/20 hover:text-primary transition-all text-slate-400 border border-white/5" title="Stage View">
                            <Shield size={20} strokeWidth={1.5} />
                        </a>
                        <a href="/stream" target="_blank" className="p-3 bg-surface rounded-xl hover:bg-primary/20 hover:text-primary transition-all text-slate-400 border border-white/5" title="Stream View">
                            <ExternalLink size={20} strokeWidth={1.5} />
                        </a>
                    </div>
                </div>
                <div className="lg:hidden flex flex-col gap-2 items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                </div>
            </div>
        </aside>
    );
};


export default Sidebar;
