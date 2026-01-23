import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Settings, Monitor, Palette, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const OBSSetup = () => {
    const streamUrl = `${window.location.origin}/stream`;
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(streamUrl);
        setCopied(true);
        toast.success('Stream URL copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const cssSnippet = `body { background-color: transparent !important; }`;

    return (
        <div className="min-h-screen bg-background text-slate-200 p-8 lg:p-12 font-sans selection:bg-primary/30">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 font-bold uppercase tracking-widest text-xs">
                <ArrowLeft size={14} /> Back to Dashboard
            </Link>

            <header className="mb-12">
                <h1 className="text-4xl font-black tracking-tighter mb-4">OBS Integration</h1>
                <p className="text-lg text-slate-400 max-w-2xl">
                    Configure your broadcast software to receive the transparent overlay feed from EnvoysOS.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Main Configuration Card */}
                <div className="space-y-8">
                    <section className="glass-card p-8 rounded-[2rem] border border-white/5">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                                <Monitor size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Browser Source URL</h2>
                                <p className="text-slate-500 text-sm">Add this as a "Browser" source in OBS</p>
                            </div>
                        </div>

                        <div className="bg-black/40 p-4 rounded-xl border border-white/10 flex items-center justify-between gap-4 mb-6">
                            <code className="text-primary font-mono text-sm truncate">{streamUrl}</code>
                            <button
                                onClick={handleCopy}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Recommended Settings</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Width</p>
                                    <p className="font-bold font-mono">1920</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Height</p>
                                    <p className="font-bold font-mono">1080</p>
                                </div>
                                <div className="col-span-2 p-4 bg-white/5 rounded-xl border border-white/5 flex items-start gap-3">
                                    <div className="mt-0.5"><Settings size={14} className="text-primary" /></div>
                                    <div>
                                        <p className="font-bold text-sm mb-1">Control Audio via OBS</p>
                                        <p className="text-xs text-slate-500">Unordered. If you play video through EnvoysOS, enable this to route audio to the stream.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Advanced / CSS Section */}
                <div className="space-y-8">
                    <section className="glass-card p-8 rounded-[2rem] border border-white/5">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
                                <Palette size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Chroma Key & Styling</h2>
                                <p className="text-slate-500 text-sm">For green screen or alpha transparency</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold mb-2">Alpha Transparency</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    EnvoysOS stream view is transparent by default. You do not need a Color Key filter unless you manually enabled "Green Screen Mode" in the dashboard settings.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold mb-2">Custom CSS (Optional)</h3>
                                <div className="bg-black/40 p-4 rounded-xl border border-white/10 font-mono text-xs text-slate-300">
                                    {cssSnippet}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Usually not required, but clears background artifacts in some OBS versions.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="glass-card p-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Monitor size={16} />
                            Pro Tip: WebSocket Control
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            EnvoysOS can automatically switch scenes in OBS when you transition segments.
                            Configure the WebSocket connection in the <span className="text-white font-bold">Server Settings</span>.
                        </p>
                        <button className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all">
                            Configure WebSocket
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default OBSSetup;
