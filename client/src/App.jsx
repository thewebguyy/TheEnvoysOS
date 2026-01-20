import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Audience from './pages/Audience';
import Stage from './pages/Stage';
import Stream from './pages/Stream';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';

function App() {
  const { isConnected } = useStore();

  return (
    <Router>
      <div className="min-h-screen bg-[#08080a] text-slate-100 font-sans selection:bg-primary/30">
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#161618',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '1rem',
              fontSize: '0.875rem',
              fontWeight: '600'
            }
          }}
        />

        {!isConnected && (
          <div className="fixed top-0 left-0 w-full bg-red-500 text-white py-1 px-4 text-[10px] font-black text-center z-[100] tracking-[0.2em] uppercase transition-all">
            OFFLINE - Reconnecting to Envoys Hub...
          </div>
        )}

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/audience" element={<Audience />} />
          <Route path="/stage" element={<Stage />} />
          <Route path="/stream" element={<Stream />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
