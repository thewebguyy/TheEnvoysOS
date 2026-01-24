import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="glass-card p-10 rounded-[2.5rem] border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-red-500 mb-2">Something went wrong</h2>
                        <p className="text-slate-400 text-sm max-w-sm mx-auto">The application encountered an unexpected error. Don't worry, your live outputs should remain unaffected.</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                    >
                        Refresh Dashboard
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
