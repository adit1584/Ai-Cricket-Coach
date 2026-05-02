import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { videoAPI, analyticsAPI } from '../api';
import { useVideoSocket } from '../hooks/useSocket';
import { Video, BarChart3, User, LogOut, Upload, CheckCircle, AlertCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const SHOT_TYPES = ['cover_drive','pull_shot','straight_drive','cut_shot','bowling_action','footwork'];
const SHOT_LABELS = { cover_drive:'Cover Drive', pull_shot:'Pull Shot', straight_drive:'Straight Drive', cut_shot:'Cut Shot', bowling_action:'Bowling Action', footwork:'Footwork' };

function StatusBadge({ status }) {
  if (status === 'done') return <span className="badge badge-green"><CheckCircle size={11} /> Done</span>;
  if (status === 'failed') return <span className="badge badge-red"><AlertCircle size={11} /> Failed</span>;
  return <span className="badge badge-yellow"><Clock size={11} /> Processing</span>;
}

function MetricBar({ label, value, max, unit = '' }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 600 }}>{value != null ? `${value}${unit}` : '—'}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AnalysisResult({ analysis }) {
  if (!analysis) return null;
  const m = analysis.metrics || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
        <div className="metric-card">
          <p className="section-label">Metrics</p>
          <MetricBar label="Head Movement" value={m.head_movement} max={20} unit=" px" />
          <MetricBar label="Knee Angle" value={m.knee_angle} max={180} unit="°" />
          <MetricBar label="Balance Score" value={m.balance_score != null ? Math.round(m.balance_score * 100) : null} max={100} unit="%" />
          <MetricBar label="Elbow Angle" value={m.elbow_angle} max={180} unit="°" />
          <MetricBar label="Hip Rotation" value={m.hip_rotation} max={60} unit="°" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {analysis.issues?.length > 0 && (
            <div className="metric-card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
              <p className="section-label" style={{ color: '#f87171' }}>Issues</p>
              {analysis.issues.map((i, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
                  <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{i}</span>
                </div>
              ))}
            </div>
          )}
          {analysis.strengths?.length > 0 && (
            <div className="metric-card" style={{ borderColor: 'rgba(34,197,94,0.2)' }}>
              <p className="section-label" style={{ color: '#22c55e' }}>Strengths</p>
              {analysis.strengths.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
                  <CheckCircle size={14} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{s}</span>
                </div>
              ))}
            </div>
          )}
          {analysis.tips?.length > 0 && (
            <div className="metric-card" style={{ borderColor: 'rgba(59,130,246,0.2)' }}>
              <p className="section-label" style={{ color: '#60a5fa' }}>Coaching Tips</p>
              {analysis.tips.map((t, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: '#60a5fa', fontWeight: 700, flexShrink: 0 }}>{idx + 1}.</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{t}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadTab({ profile }) {
  const [file, setFile] = useState(null);
  const [shotType, setShotType] = useState('cover_drive');
  const [uploading, setUploading] = useState(false);
  const [uploadedVideoId, setUploadedVideoId] = useState(null);
  const [status, setStatus] = useState(null); // null | 'uploading' | 'processing' | 'done' | 'failed'
  const [analysis, setAnalysis] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef();

  useVideoSocket(
    uploadedVideoId,
    (data) => { setStatus('done'); setAnalysis(data.analysis); toast.success('Analysis complete!'); },
    () => { setStatus('failed'); toast.error('Analysis failed. Please try again.'); }
  );

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a video file');
    setUploading(true); setStatus('uploading');
    const fd = new FormData();
    fd.append('video', file);
    fd.append('shot_type', shotType);
    try {
      const { data } = await videoAPI.upload(fd);
      setUploadedVideoId(data.video_id);
      setStatus('processing');
      toast.success('Uploaded! AI is processing...');
    } catch (err) {
      setStatus('failed');
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setFile(null); setUploadedVideoId(null); setStatus(null); setAnalysis(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {!status && (
        <>
          <div
            className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
          >
            <Upload size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{file ? file.name : 'Click or drag your video here'}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>MP4, MOV, AVI, WebM · Max 200 MB</p>
            <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Shot Type</label>
            <select id="shot-type-select" className="input-field" style={{ maxWidth: 300 }} value={shotType} onChange={(e) => setShotType(e.target.value)}>
              {SHOT_TYPES.map((s) => <option key={s} value={s}>{SHOT_LABELS[s]}</option>)}
            </select>
          </div>
          <button id="upload-btn" className="btn-primary" onClick={handleUpload} disabled={!file} style={{ width: 'fit-content' }}>
            <Upload size={18} /> Upload & Analyze
          </button>
        </>
      )}

      {status === 'uploading' && (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <span className="loading-spinner" style={{ width: 36, height: 36, margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 600, fontSize: 16 }}>Uploading video...</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Please wait</p>
        </div>
      )}

      {status === 'processing' && (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, margin: '0 auto 16px', position: 'relative' }}>
            <Activity size={32} color="var(--accent-green)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(34,197,94,0.2)', borderTop: '3px solid var(--accent-green)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>AI is analyzing your technique...</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>MediaPipe is extracting pose landmarks and computing metrics</p>
          <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Pose Detection','Metric Computation','AI Feedback'].map((s) => (
              <span key={s} className="badge badge-yellow"><Clock size={11} /> {s}</span>
            ))}
          </div>
        </div>
      )}

      {status === 'done' && analysis && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span className="badge badge-green" style={{ fontSize: 14, padding: '6px 14px' }}><CheckCircle size={14} /> Analysis Complete</span>
            <button className="btn-secondary" onClick={reset} style={{ padding: '6px 16px', fontSize: 13 }}>Analyze Another</button>
          </div>
          <AnalysisResult analysis={analysis} />
        </div>
      )}

      {status === 'failed' && (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center', borderColor: 'rgba(239,68,68,0.3)' }}>
          <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Analysis failed</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>The AI service encountered an error. Please try again.</p>
          <button className="btn-primary" onClick={reset}>Try Again</button>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ profile }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedShot, setSelectedShot] = useState(null);

  useEffect(() => {
    if (!profile?._id) return;
    analyticsAPI.getPlayer(profile._id)
      .then(({ data }) => {
        setData(data);
        const firstShot = Object.keys(data.progress || {})[0];
        if (firstShot) setSelectedShot(firstShot);
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><span className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>;
  if (!data) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No analytics yet. Upload a video first.</p>;

  const progressData = selectedShot && data.progress?.[selectedShot]
    ? data.progress[selectedShot].map((r, i) => ({
        session: `S${i + 1}`,
        balance: r.metrics?.balance_score != null ? Math.round(r.metrics.balance_score * 100) : null,
        knee: r.metrics?.knee_angle,
        head: r.metrics?.head_movement,
      }))
    : [];

  const weaknessEntries = Object.entries(data.weaknesses || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const strengthEntries = Object.entries(data.strengths || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Shot type selector */}
      {Object.keys(data.progress || {}).length > 0 && (
        <div>
          <p className="section-label">Progress Over Time</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {Object.keys(data.progress).map((s) => (
              <button key={s} className={`tab-btn ${selectedShot === s ? 'active' : ''}`} style={{ flex: 'none', padding: '8px 16px' }} onClick={() => setSelectedShot(s)}>
                {SHOT_LABELS[s] || s}
              </button>
            ))}
          </div>
          {progressData.length > 1 ? (
            <div className="glass-card" style={{ padding: 24, height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="session" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Line type="monotone" dataKey="balance" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} name="Balance %" />
                  <Line type="monotone" dataKey="knee" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="Knee Angle" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Upload more videos to see progress trends.</p>
          )}
        </div>
      )}

      {/* Weaknesses & Strengths */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        <div className="metric-card">
          <p className="section-label" style={{ color: '#f87171' }}>Recurring Issues</p>
          {weaknessEntries.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No issues tracked yet.</p>
            : weaknessEntries.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{k}</span>
                <span className="badge badge-red">{v}x</span>
              </div>
            ))}
        </div>
        <div className="metric-card">
          <p className="section-label" style={{ color: '#22c55e' }}>Consistent Strengths</p>
          {strengthEntries.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No strengths tracked yet.</p>
            : strengthEntries.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{k}</span>
                <span className="badge badge-green">{v}x</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function VideoHistoryTab({ profile }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (!profile?._id) return;
    videoAPI.getByPlayer(profile._id)
      .then(({ data }) => setVideos(data.videos || []))
      .catch(() => toast.error('Failed to load videos'))
      .finally(() => setLoading(false));
  }, [profile]);

  const viewAnalysis = async (video) => {
    setSelected(video);
    try {
      const { data } = await videoAPI.getById(video._id);
      setAnalysis(data.analysis);
    } catch { toast.error('Could not load analysis'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><span className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>;
  if (videos.length === 0) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No videos yet. Upload one to get started!</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {selected ? (
        <div>
          <button className="btn-secondary" style={{ marginBottom: 16, padding: '8px 16px', fontSize: 13 }} onClick={() => { setSelected(null); setAnalysis(null); }}>← Back to History</button>
          <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className="badge badge-blue">{SHOT_LABELS[selected.shot_type] || selected.shot_type}</span>
              <StatusBadge status={selected.status} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(selected.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          {analysis ? <AnalysisResult analysis={analysis} /> : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            {selected.status === 'processing' ? 'Still processing...' : 'No analysis available'}
          </p>}
        </div>
      ) : videos.map((v) => (
        <div key={v._id} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}
          onClick={() => viewAnalysis(v)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video size={18} color="var(--accent-green)" />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{SHOT_LABELS[v.shot_type] || v.shot_type}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(v.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <StatusBadge status={v.status} />
        </div>
      ))}
    </div>
  );
}

export default function PlayerDashboard() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('upload');

  useEffect(() => { if (!user || user.role !== 'player') navigate('/login'); }, [user]);

  const handleLogout = () => { logout(); navigate('/'); };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Topbar */}
      <header style={{ background: 'rgba(10,14,26,0.95)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={20} color="var(--accent-green)" />
            <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18 }}>AI Cricket Coach</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{user.name}</span>
            <span className="badge badge-blue">Player</span>
            <button className="btn-danger" onClick={handleLogout} style={{ padding: '6px 14px', fontSize: 13 }}><LogOut size={14} /> Logout</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Profile Card */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#22c55e,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={28} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{user.name}</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-green">{profile?.preferred_role || 'Batter'}</span>
              <span className="badge badge-blue">{profile?.experience_level || 'Beginner'}</span>
              {profile?.age && <span className="badge badge-orange">Age {profile.age}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent-green)', fontFamily: 'Rajdhani' }}>—</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Videos Analyzed</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar" style={{ marginBottom: 28 }}>
          {[
            { id: 'upload', icon: <Upload size={16} />, label: 'Upload & Analyze' },
            { id: 'history', icon: <Video size={16} />, label: 'Video History' },
            { id: 'analytics', icon: <BarChart3 size={16} />, label: 'Analytics' },
          ].map((t) => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'upload' && <UploadTab profile={profile} />}
        {tab === 'history' && <VideoHistoryTab profile={profile} />}
        {tab === 'analytics' && <AnalyticsTab profile={profile} />}
      </div>
    </div>
  );
}
