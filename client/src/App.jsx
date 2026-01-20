import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Audience from './pages/Audience';
import Stage from './pages/Stage';
import Stream from './pages/Stream';
import { useEffect } from 'react';
import useStore from './store/useStore';

function App() {
  const { isConnected } = useStore();

  return (
    <Router>
      <div className="min-h-screen bg-background text-slate-100 font-sans selection:bg-primary/30">
        {!isConnected && (
          <div className="fixed top-0 left-0 w-full bg-accent text-white py-1 px-4 text-xs text-center z-50">
            Connecting to server...
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
