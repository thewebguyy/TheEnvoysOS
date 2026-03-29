import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Share2, Archive, BarChart, Clock, User, Calendar, Plus, Scissors, Trash2, ChevronLeft, Flag, CheckCircle, ExternalLink, Layout, Save, UploadCloud, AlertCircle, Loader2 } from 'lucide-react';

const BASE_URL = 'http://localhost:3001';

const PulpitOS = () => {
  const [activeView, setActiveView] = useState('library'); // library, clips
  const [sermons, setSermons] = useState([]);
  const [selectedSermon, setSelectedSermon] = useState(null);
  const [segments, setSegments] = useState([]);
  const [globalClips, setGlobalClips] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [segmentModal, setSegmentModal] = useState(false);
  const [clipModal, setClipModal] = useState(null); // stores individual segment for clipping

  useEffect(() => {
    if (activeView === 'library') fetchSermons();
    if (activeView === 'clips') fetchGlobalClips();
  }, [activeView]);

  const fetchSermons = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/sermons`);
      setSermons(res.data);
    } catch (err) {
      console.error('Failed to fetch sermons');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalClips = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/clips`);
      setGlobalClips(res.data);
    } catch (err) {
      console.error('Failed to fetch clips');
    } finally {
      setLoading(false);
    }
  };

  const fetchSermonDetail = async (id) => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/sermons/${id}`);
      setSelectedSermon(res.data);
      setSegments(res.data.segments);
    } catch (err) {
      console.error('Failed to load sermon detail');
    } finally {
      setLoading(false);
    }
  };

  const createClip = async (segmentId, clipData) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/segments/${segmentId}/clip`, clipData, {
        headers: { Authorization: `Bearer admin-token` }
      });
      // Refresh detail view
      fetchSermonDetail(selectedSermon.id);
      setClipModal(null);
    } catch (err) {
      console.error('Failed to create clip');
    }
  };

  const updateClip = async (clipId, updates) => {
    try {
      await axios.patch(`${BASE_URL}/api/clips/${clipId}`, updates, {
        headers: { Authorization: `Bearer admin-token` }
      });
      if (selectedSermon) fetchSermonDetail(selectedSermon.id);
      if (activeView === 'clips') fetchGlobalClips();
    } catch (err) {
      console.error('Failed to update clip');
    }
  };

  const exportClip = async (clipId) => {
    try {
      await axios.post(`${BASE_URL}/api/clips/${clipId}/sync`, {}, {
        headers: { Authorization: `Bearer admin-token` }
      });
      // Start refreshing to show processing
      if (selectedSermon) fetchSermonDetail(selectedSermon.id);
      if (activeView === 'clips') fetchGlobalClips();
    } catch (err) {
      alert(err.response?.data?.error || 'Export failed');
    }
  };


  // --- RENDERS ---

  if (selectedSermon) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <button onClick={() => setSelectedSermon(null)} style={backBtn}>
                <ChevronLeft size={16} /> Back to Library
            </button>
            <div style={statusTag(selectedSermon.status)}>{selectedSermon.status}</div>
        </div>
        
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>{selectedSermon.title}</h1>
            <div style={metaFlex}>
               <span><User size={14} /> {selectedSermon.speaker}</span>
               <span><Calendar size={14} /> {new Date(selectedSermon.date).toLocaleDateString()}</span>
               <span><Flag size={14} /> {segments.length} Segments</span>
            </div>
          </div>
          <button onClick={() => setSegmentModal(true)} style={addBtn}>
            <Plus size={16} /> Add Segment
          </button>
        </header>

        <div style={contentGrid}>
          <div style={mainColumn}>
            <div style={playerPlaceholder}>
                <Play size={64} color="#fff" />
                <p style={{ color: '#fff', fontSize: '0.75rem', marginTop: '1rem', fontWeight: 'bold' }}>SOURCE: RAW S3 FEED</p>
            </div>

            <div style={{ marginTop: '3rem' }}>
                <h3 style={sectionTitle}>Distribution Assets (Clips)</h3>
                <div style={clipGrid}>
                    {segments.flatMap(s => s.clips).length === 0 ? (
                        <p style={{ color: '#9ca3af' }}>No clips prepared yet. Click "Create Clip" on a segment to begin distribution.</p>
                    ) : (
                        segments.flatMap(s => s.clips).map(clip => (
                            <div key={clip.id} style={clipCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={clipTitle}>{clip.title}</p>
                                        <p style={clipMeta}>{clip.platform} • <span style={statusStyle(clip.status)}>{clip.status}</span></p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => updateClip(clip.id, { status: clip.status === 'READY' ? 'DRAFT' : 'READY' })} style={clip.status === 'READY' ? statusBtnReady : statusBtnDraft} disabled={clip.status === 'PROCESSING'}>
                                            {clip.status === 'READY' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                            {clip.status === 'READY' ? 'READY' : 'DRAFT'}
                                        </button>
                                        
                                        {(clip.status === 'READY' || clip.status === 'FAILED') && (
                                            <button onClick={() => exportClip(clip.id)} style={btnExport}>
                                                <UploadCloud size={14} /> Export
                                            </button>
                                        )}
                                        
                                        {clip.status === 'PROCESSING' && (
                                            <div style={processingBadge}>
                                                <Loader2 size={14} style={{ animation: 'spin 2s linear infinite' }} /> Syncing...
                                            </div>
                                        )}
                                        
                                        {clip.status === 'EXPORTED' && (
                                            <a href={clip.exportUrl} target="_blank" rel="noreferrer" style={btnLink}>
                                                <ExternalLink size={14} /> View
                                            </a>
                                        )}
                                    </div>
                                </div>
                                {clip.error && <p style={errorText}><AlertCircle size={12} /> {clip.error}</p>}
                                <p style={clipCaption}>{clip.caption || 'No caption provided.'}</p>
                            </div>
                        ))
                    )}
                </div>

            </div>
          </div>
          
          <div style={segmentListStyle}>
            <h3 style={sectionTitle}>Segments</h3>
            {segments.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No segments marked yet.</p>
            ) : (
              segments.map(s => (
                <div key={s.id} style={segmentCard}>
                  <div style={{ flex: 1 }}>
                    <p style={segmentTitleText}>{s.title}</p>
                    <p style={segmentTime}><Clock size={12} /> {s.startTime}s - {s.endTime}s</p>
                    {s.clips?.length > 0 && <p style={clipCountTag}>{s.clips.length} Clips Linked</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setClipModal(s)} style={iconBtn} title="Prepare Distribution Clip"><Share2 size={14} /></button>
                    <button style={iconBtnDestructive} title="Delete Segment"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {clipModal && (
          <Modal title="Prepare Distribution Asset" onClose={() => setClipModal(null)}>
            <div style={formGroup}>
              <label style={labelStyle}>SOCIAL MEDIA TITLE</label>
              <input 
                style={inputStyle} 
                defaultValue={clipModal.title} 
                id="clip-title" 
                placeholder="Hooky social title..."
              />
            </div>
            <div style={formGroup}>
              <label style={labelStyle}>CAPTION / DESCRIPTION</label>
              <textarea 
                style={textareaStyle} 
                id="clip-caption" 
                placeholder="Add hashtags, CTA, etc..."
              />
            </div>
            <div style={formGroup}>
              <label style={labelStyle}>TARGET PLATFORM</label>
              <select style={inputStyle} id="clip-platform">
                <option value="YOUTUBE_SHORTS">YouTube Shorts</option>
                <option value="INSTAGRAM_REEL">Instagram Reel</option>
                <option value="TIKTOK">TikTok</option>
                <option value="FACEBOOK">Facebook</option>
              </select>
            </div>
            <button 
                style={btnSave} 
                onClick={() => createClip(clipModal.id, {
                    title: document.getElementById('clip-title').value,
                    caption: document.getElementById('clip-caption').value,
                    platform: document.getElementById('clip-platform').value
                })}
            >
                Confirm Asset
            </button>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
            <h1 style={titleStyle}>PulpitOS Console</h1>
            <nav style={navStyle}>
                <button onClick={() => setActiveView('library')} style={activeView === 'library' ? navItemActive : navItem}>Sermon Library</button>
                <button onClick={() => setActiveView('clips')} style={activeView === 'clips' ? navItemActive : navItem}>Distribution Pipeline</button>
            </nav>
        </div>
      </header>

      {activeView === 'library' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
            {loading ? <p>Loading library...</p> : sermons.length === 0 ? (
                <EmptyState title="Library Empty" sub="Start a service in Envoys AI to begin." />
            ) : (
                sermons.map(s => (
                    <SermonCard key={s.id} sermon={s} onClick={() => fetchSermonDetail(s.id)} />
                ))
            )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {loading ? <p>Loading pipeline...</p> : globalClips.length === 0 ? (
                <EmptyState title="Distribution Pipeline Empty" sub="Prepare clips inside the sermon detail views." />
            ) : (
                globalClips.map(clip => (
                    <div key={clip.id} style={pipelineRow}>
                        <div style={{ width: '40px', height: '40px', backgroundColor: '#000', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Scissors size={18} color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: '900', fontSize: '1rem', margin: 0 }}>{clip.title}</p>
                            <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '700' }}>{clip.sermon?.title} • {clip.platform}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={statusBadgeStyle(clip.status)}>{clip.status}</div>
                            
                            {(clip.status === 'READY' || clip.status === 'FAILED') && (
                                <button onClick={() => exportClip(clip.id)} style={btnExportSmall}>
                                    <UploadCloud size={14} /> EXPORT
                                </button>
                            )}

                            {clip.status === 'PROCESSING' && (
                                <Loader2 size={16} style={{ animation: 'spin 2s linear infinite', color: '#3b82f6' }} />
                            )}

                            {clip.status === 'EXPORTED' && clip.exportUrl && (
                                <a href={clip.exportUrl} target="_blank" rel="noreferrer" style={iconBtn} title="View External">
                                    <ExternalLink size={16} />
                                </a>
                            )}

                            <button onClick={() => updateClip(clip.id, { status: clip.status === 'READY' ? 'DRAFT' : 'READY' })} style={iconBtn} title="Toggle Sync Ready" disabled={clip.status === 'PROCESSING'}>
                                {clip.status === 'READY' ? <CheckCircle size={16} /> : <Save size={16} />}
                            </button>
                        </div>
                    </div>
                ))

            )}
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const Modal = ({ title, onClose, children }) => (
    <div style={modalOverlay}>
      <div style={modalContent}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, fontWeight: '900' }}>{title}</h2>
            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
        </div>
        {children}
      </div>
    </div>
);

const SermonCard = ({ sermon, onClick }) => (
    <div style={cardStyle} onClick={onClick}>
        <div style={mediaPlaceholder}><Play size={48} color="#fff" /></div>
        <div style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '900' }}>{sermon.title}</h3>
            <div style={metaFlex}>
                <span><User size={14} /> {sermon.speaker}</span>
                <span><Scissors size={14} /> {sermon._count?.segments || 0} Assets</span>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem' }}>
                <button style={btnPrimary}>Open Console</button>
            </div>
        </div>
    </div>
);

const EmptyState = ({ title, sub }) => (
    <div style={emptyStateStyle}>
        <h3>{title}</h3>
        <p>{sub}</p>
    </div>
);

// --- STYLES ---

const containerStyle = { fontFamily: 'Inter, sans-serif', padding: '4rem', backgroundColor: '#fafafa', minHeight: '100vh' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' };
const titleStyle = { fontSize: '3rem', fontWeight: '900', color: '#111', margin: 0, letterSpacing: '-0.02em' };
const metaFlex = { display: 'flex', gap: '1.5rem', color: '#6b7280', fontSize: '0.875rem', fontWeight: '700', marginTop: '1rem' };
const addBtn = { backgroundColor: '#000', color: '#fff', padding: '1rem 2rem', borderRadius: '1rem', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' };
const backBtn = { backgroundColor: 'transparent', border: 'none', color: '#6b7280', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px' };
const contentGrid = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '4rem' };
const mainColumn = { minWidth: 0 };
const playerPlaceholder = { height: '500px', backgroundColor: '#000', borderRadius: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundImage: 'radial-gradient(circle at center, #222 0%, #000 100%)' };
const segmentListStyle = { backgroundColor: '#fff', borderRadius: '2.5rem', padding: '2.5rem', border: '1px solid #eee', height: 'fit-content', position: 'sticky', top: '2rem' };
const sectionTitle = { fontSize: '1.5rem', fontWeight: '900', marginBottom: '1.5rem', italic: 'italic' };
const segmentCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0', borderBottom: '1px solid #f3f4f6' };
const segmentTitleText = { fontWeight: '800', fontSize: '1rem', margin: '0 0 0.25rem 0' };
const segmentTime = { fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '700', textTransform: 'uppercase' };
const iconBtn = { backgroundColor: '#f3f4f6', border: 'none', padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer', color: '#111' };
const iconBtnDestructive = { backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer' };
const cardStyle = { backgroundColor: '#fff', borderRadius: '2.5rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eee' };
const mediaPlaceholder = { height: '200px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const btnPrimary = { width: '100%', padding: '1rem', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '1rem', fontWeight: '900', cursor: 'pointer' };
const emptyStateStyle = { gridColumn: '1 / -1', textAlign: 'center', padding: '10rem', backgroundColor: '#fff', borderRadius: '3rem', border: '3px dashed #eee' };
const modalOverlay = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 };
const modalContent = { backgroundColor: '#fff', padding: '4rem', borderRadius: '3rem', maxWidth: '600px', width: '100%' };
const formGroup = { marginBottom: '2rem' };
const labelStyle = { fontSize: '0.625rem', fontWeight: '900', color: '#9ca3af', marginBottom: '0.75rem', display: 'block', letterSpacing: '0.2em' };
const inputStyle = { width: '100%', padding: '1.25rem', borderRadius: '1.25rem', border: '2px solid #f3f4f6', fontSize: '1rem', fontWeight: '700', boxSizing: 'border-box' };
const textareaStyle = { ...inputStyle, height: '120px', resize: 'none' };
const btnSave = { width: '100%', padding: '1.5rem', backgroundColor: '#000', color: '#fff', borderRadius: '1.5rem', fontWeight: '900', border: 'none', cursor: 'pointer', fontSize: '1rem' };
const navStyle = { display: 'flex', gap: '2rem', marginTop: '2rem' };
const navItem = { background: 'none', border: 'none', padding: '1rem 0', color: '#9ca3af', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', borderBottom: '2px solid transparent' };
const navItemActive = { ...navItem, color: '#000', borderBottom: '2px solid #000' };

const clipGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' };
const clipCard = { backgroundColor: '#fff', borderRadius: '2rem', padding: '2rem', border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' };
const clipTitle = { fontWeight: '900', fontSize: '1.125rem', margin: '0 0 0.5rem 0' };
const clipMeta = { fontSize: '0.625rem', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' };
const clipCaption = { fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.6', marginTop: '1.5rem', fontWeight: '500' };
const clipCountTag = { display: 'inline-block', backgroundColor: '#000', color: '#fff', fontSize: '0.625rem', fontWeight: '900', padding: '0.25rem 0.625rem', borderRadius: '100px', marginTop: '0.5rem', textTransform: 'uppercase' };

const statusBtnDraft = { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f3f4f6', border: 'none', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.625rem', fontWeight: '900', cursor: 'pointer' };
const statusBtnReady = { ...statusBtnDraft, backgroundColor: '#dcfce7', color: '#15803d' };

const pipelineRow = { backgroundColor: '#fff', borderRadius: '2rem', padding: '1.5rem 2.5rem', display: 'flex', alignItems: 'center', gap: '2rem', border: '1px solid #eee' };
const statusTag = (s) => ({ fontSize: '0.625rem', fontWeight: '900', backgroundColor: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '100px' });
const statusTagReady = { fontSize: '0.625rem', fontWeight: '900', backgroundColor: '#dcfce7', color: '#15803d', padding: '0.5rem 1rem', borderRadius: '100px' };
const statusTagDraft = { fontSize: '0.625rem', fontWeight: '900', backgroundColor: '#f3f4f6', color: '#6b7280', padding: '0.5rem 1rem', borderRadius: '100px' };
const statusTagProcessing = { fontSize: '0.625rem', fontWeight: '900', backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '0.5rem 1rem', borderRadius: '100px' };
const statusTagExported = { fontSize: '0.625rem', fontWeight: '900', backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '0.5rem 1rem', borderRadius: '100px' };
const statusTagFailed = { fontSize: '0.625rem', fontWeight: '900', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.5rem 1rem', borderRadius: '100px' };

const statusStyle = (s) => {
    if (s === 'READY') return { color: '#15803d' };
    if (s === 'EXPORTED') return { color: '#7e22ce' };
    if (s === 'PROCESSING') return { color: '#1d4ed8' };
    if (s === 'FAILED') return { color: '#b91c1c' };
    return { color: '#6b7280' };
};

const statusBadgeStyle = (s) => {
    if (s === 'READY') return statusTagReady;
    if (s === 'EXPORTED') return statusTagExported;
    if (s === 'PROCESSING') return statusTagProcessing;
    if (s === 'FAILED') return statusTagFailed;
    return statusTagDraft;
};

const btnExport = { backgroundColor: '#000', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.625rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' };
const btnExportSmall = { ...btnExport, padding: '0.4rem 0.8rem' };
const btnLink = { backgroundColor: '#f3e8ff', color: '#7e22ce', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.625rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.375rem' };
const processingBadge = { display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#1d4ed8', fontSize: '0.625rem', fontWeight: '900', padding: '0.5rem 1rem', backgroundColor: '#dbeafe', borderRadius: '100px' };
const errorText = { fontSize: '0.75rem', color: '#b91c1c', fontWeight: '600', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' };

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default PulpitOS;
