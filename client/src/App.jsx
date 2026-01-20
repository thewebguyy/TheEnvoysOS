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
