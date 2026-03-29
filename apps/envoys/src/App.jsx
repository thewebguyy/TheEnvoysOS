import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Audience = lazy(() => import('./pages/Audience'));
const Stage = lazy(() => import('./pages/Stage'));
const Stream = lazy(() => import('./pages/Stream'));
const OBSSetup = lazy(() => import('./pages/OBSSetup'));

function App() {
  const { isConnected } = useStore();

  return (
    <Router>
      <div className="min-h-screen bg-background text-slate-100 font-sans selection:bg-primary/30">
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1E1E1E',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '1.5rem',
              fontSize: '0.75rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              backdropFilter: 'blur(10px)'
            }
          }}
        />

        <Suspense fallback={
          <div className="flex h-screen w-full items-center justify-center bg-background text-primary">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Loading...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/audience" element={<Audience />} />
            <Route path="/stage" element={<Stage />} />
            <Route path="/stream" element={<Stream />} />
            <Route path="/obs-setup" element={<OBSSetup />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
