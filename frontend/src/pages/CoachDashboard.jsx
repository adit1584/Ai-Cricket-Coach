import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { videoAPI, analyticsAPI, academyAPI } from '../api';
import { useVideoSocket } from '../hooks/useSocket';
import { Activity, Users, Upload, BarChart3, LogOut, Plus, Trash2, User, CheckCircle, AlertCircle, Clock, Edit3, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const SHOT_TYPES = ['cover_drive','pull_shot','straight_drive','cut_shot','bowling_action','footwork'];
const SHOT_LABELS = { cover_drive:'Cover Drive', pull_shot:'Pull Shot', straight_drive:'Straight Drive', cut_shot:'Cut Shot', bowling_action:'Bowling Action', footwork:'Footwork' };

function StatusBadge({ status }) {
  if (status === 'done') return <span className="badge badge-green"><CheckCircle size={11} /> Done</span>;
  if (status === 'failed') return <span className="badge badge-red"><AlertCircle size={11} /> Failed</span>;
  return <span className="badge badge-yellow"><Clock size={11} /> Processing</span>;
}

// ─── Academy Tab ──────────────────────────────────────────────
function AcademyTab({ coach }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [batchName, setBatchName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editBatch, setEditBatch] = useState(null); // { playerId, value }

  const fetchPlayers = () => {
    academyAPI.getPlayers()
      .then(({ data }) => setPlayers(data.players || []))
      .finally(() => setLoading(false));
  };
  useEffect(fetchPlayers, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Player email required');
    setAdding(true);
    try {
      await academyAPI.addPlayer({ player_email: email, batch_name: batchName || 'General' });
      toast.success('Player added!');
      setEmail(''); setBatchName('');
      fetchPlayers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add player');
    } finally { setAdding(false); }
  };

  const handleRemove = async (playerId) => {
    if (!confirm('Remove this player from your academy?')) return;
    try {
      await academyAPI.removePlayer(playerId);
      toast.success('Player removed');
      setPlayers(players.filter(p => p.player_id !== playerId));
    } catch { toast.error('Failed to remove'); }
  };

  const handleBatchUpdate = async (playerId) => {
    try {
      await academyAPI.updateBatch(playerId, editBatch.value);
      toast.success('Batch updated');
      setPlayers(players.map(p => p.player_id === playerId ? { ...p, batch_name: editBatch.value } : p));
      setEditBatch(null);
    } catch { toast.error('Failed to update batch'); }
  };

  // Group by batch
  const batches = players.reduce((acc, p) => {
    const b = p.batch_name || 'General';
    if (!acc[b]) acc[b] = [];
    acc[b].push(p);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Add player form */}
      <div className="glass-card" style={{ padding: 24 }}>
        <p className="section-label">Add Player to Academy</p>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input id="add-player-email" className="input-field" placeholder="Player's email address" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: '1 1 200px' }} />
          <input id="add-player-batch" className="input-field" placeholder="Batch name (e.g. U-19)" value={batchName} onChange={e => setBatchName(e.target.value)} style={{ flex: '1 1 160px' }} />
          <button id="add-player-btn" type="submit" className="btn-primary" disabled={adding} style={{ whiteSpace: 'nowrap' }}>
            {adding ? <span className="loading-spinner" /> : <Plus size={16} />} Add Player
          </button>
        </form>
      </div>

      {/* Player list */}
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><span className="loading-spinner" style={{ width: 28, height: 28, margin: '0 auto' }} /></div>
        : players.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No players yet. Add players by their email address.</p>
        : Object.entries(batches).map(([batch, bPlayers]) => (
          <div key={batch}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span className="badge badge-blue">{batch}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{bPlayers.length} player{bPlayers.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bPlayers.map(p => (
                <div key={p.player_id} className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={18} color="var(--accent-green)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.email} · {p.experience_level}</p>
                  </div>
                  {editBatch?.playerId === p.player_id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input className="input-field" style={{ width: 140, padding: '6px 10px', fontSize: 13 }} value={editBatch.value} onChange={e => setEditBatch({ ...editBatch, value: e.target.value })} />
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => handleBatchUpdate(p.player_id)}>Save</button>
                      <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setEditBatch(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setEditBatch({ playerId: p.player_id, value: p.batch_name })}>
                      <Edit3 size={13} /> Batch
                    </button>
                  )}
                  <button className="btn-danger" style={{ padding: '6px 12px' }} onClick={() => handleRemove(p.player_id)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── Coach Upload Tab ──────────────────────────────────────────
function CoachUploadTab({ coachProfile }) {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [shotType, setShotType] = useState('cover_drive');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [uploadedVideoId, setUploadedVideoId] = useState(null);
  const inputRef = useRef();

  useEffect(() => {
    academyAPI.getPlayers().then(({ data }) => {
      setPlayers(data.players || []);
      if (data.players?.length > 0) setSelectedPlayer(data.players[0].player_id);
    });
  }, []);

  useVideoSocket(
    uploadedVideoId,
    (data) => { setStatus('done'); setAnalysis(data.analysis); toast.success('Analysis complete!'); },
    () => { setStatus('failed'); toast.error('Analysis failed.'); }
  );

  const handleUpload = async () => {
    if (!file) return toast.error('Select a video');
    if (!selectedPlayer) return toast.error('Select a player');
    setStatus('uploading');
    const fd = new FormData();
    fd.append('video', file);
    fd.append('shot_type', shotType);
    fd.append('player_id', selectedPlayer);
    try {
      const { data } = await videoAPI.upload(fd);
      setUploadedVideoId(data.video_id);
      setStatus('processing');
      toast.success('Uploaded! Processing...');
    } catch (err) {
      setStatus('failed');
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  const reset = () => { setFile(null); setStatus(null); setAnalysis(null); setUploadedVideoId(null); };

  if (players.length === 0) return (
    <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
      <Users size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
      <p style={{ fontWeight: 600, marginBottom: 8 }}>No players in your academy</p>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Add players in the Academy tab first.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!status && (
        <>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Select Player</label>
            <select id="coach-player-select" className="input-field" style={{ maxWidth: 320 }} value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}>
              {players.map(p => <option key={p.player_id} value={p.player_id}>{p.name} ({p.batch_name})</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Shot Type</label>
            <select id="coach-shot-select" className="input-field" style={{ maxWidth: 320 }} value={shotType} onChange={e => setShotType(e.target.value)}>
              {SHOT_TYPES.map(s => <option key={s} value={s}>{SHOT_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="upload-zone" style={{ maxWidth: 480 }} onClick={() => inputRef.current?.click()}>
            <Upload size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600 }}>{file ? file.name : 'Click to select video'}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>MP4, MOV, AVI · Max 200MB</p>
            <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
          </div>
          <button id="coach-upload-btn" className="btn-primary" onClick={handleUpload} disabled={!file} style={{ width: 'fit-content' }}>
            <Upload size={16} /> Upload for Player
          </button>
        </>
      )}
      {status === 'uploading' && <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}><span className="loading-spinner" style={{ width: 36, height: 36, margin: '0 auto 16px' }} /><p style={{ fontWeight: 600 }}>Uploading...</p></div>}
      {status === 'processing' && (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <Activity size={40} color="var(--accent-green)" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 700, fontSize: 18 }}>AI Analyzing technique...</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Waiting for MediaPipe + Gemma feedback</p>
        </div>
      )}
      {status === 'done' && analysis && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <span className="badge badge-green" style={{ fontSize: 14 }}><CheckCircle size={13} /> Done</span>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={reset}>Upload Another</button>
          </div>
          {/* Inline results */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            <div className="metric-card">
              <p className="section-label">Issues</p>
              {(analysis.issues || []).map((i, idx) => <div key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', gap: 6 }}><AlertCircle size={13} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />{i}</div>)}
            </div>
            <div className="metric-card">
              <p className="section-label">Tips</p>
              {(analysis.tips || []).map((t, idx) => <div key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', gap: 6 }}><span style={{ color: '#60a5fa', fontWeight: 700 }}>{idx+1}.</span>{t}</div>)}
            </div>
          </div>
        </div>
      )}
      {status === 'failed' && <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}><AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 12px' }} /><p style={{ fontWeight: 600, marginBottom: 12 }}>Failed</p><button className="btn-primary" onClick={reset}>Try Again</button></div>}
    </div>
  );
}

// ─── Coach Analytics Tab ──────────────────────────────────────
function CoachAnalyticsTab({ coachProfile }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterPlayer, setFilterPlayer] = useState('all');

  useEffect(() => {
    if (!coachProfile?._id) return;
    analyticsAPI.getCoach(coachProfile._id)
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [coachProfile]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><span className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>;
  if (!data) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No analytics yet.</p>;

  const displayedPlayers = filterPlayer === 'all' ? data.players : data.players.filter(p => p.player_id === filterPlayer);
  const chartData = displayedPlayers.map(p => ({
    name: p.name.split(' ')[0],
    balance: p.avg_metrics?.balance_score != null ? Math.round(p.avg_metrics.balance_score * 100) : 0,
    videos: p.video_count,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
        {[
          { label: 'Total Players', value: data.total_players || 0, color: '#22c55e' },
          { label: 'Total Videos', value: data.total_videos || 0, color: '#3b82f6' },
          { label: 'Batches', value: data.batches?.length || 0, color: '#f97316' },
        ].map(s => (
          <div key={s.label} className="metric-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: s.color, fontFamily: 'Rajdhani' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Filter by Player</label>
        <select id="analytics-filter" className="input-field" style={{ maxWidth: 280 }} value={filterPlayer} onChange={e => setFilterPlayer(e.target.value)}>
          <option value="all">All Players</option>
          {data.players.map(p => <option key={p.player_id} value={p.player_id}>{p.name}</option>)}
        </select>
      </div>

      {/* Comparison chart */}
      {chartData.length > 0 && (
        <div className="glass-card" style={{ padding: 24 }}>
          <p className="section-label">Balance Score Comparison (avg %)</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Bar dataKey="balance" fill="#22c55e" radius={[6, 6, 0, 0]} name="Balance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Player table */}
      <div className="glass-card" style={{ padding: 20 }}>
        <p className="section-label">Player Summary</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Player', 'Batch', 'Videos', 'Avg Balance', 'Avg Knee Angle'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12, letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedPlayers.map(p => (
                <tr key={p.player_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '12px' }}><span className="badge badge-blue">{p.batch_name}</span></td>
                  <td style={{ padding: '12px', color: 'var(--accent-green)', fontWeight: 700 }}>{p.video_count}</td>
                  <td style={{ padding: '12px' }}>{p.avg_metrics?.balance_score != null ? `${Math.round(p.avg_metrics.balance_score*100)}%` : '—'}</td>
                  <td style={{ padding: '12px' }}>{p.avg_metrics?.knee_angle != null ? `${p.avg_metrics.knee_angle}°` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Coach Dashboard ─────────────────────────────────────
export default function CoachDashboard() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('academy');

  useEffect(() => { if (!user || user.role !== 'coach') navigate('/login'); }, [user]);
  const handleLogout = () => { logout(); navigate('/'); };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <header style={{ background: 'rgba(10,14,26,0.95)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={20} color="var(--accent-green)" />
            <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18 }}>AI Cricket Coach</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{user.name}</span>
            <span className="badge badge-orange">Coach</span>
            <button className="btn-danger" onClick={handleLogout} style={{ padding: '6px 14px', fontSize: 13 }}><LogOut size={14} /> Logout</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Coach profile card */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#f97316,#eab308)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={28} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{user.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{profile?.academy_name} {profile?.certification ? `· ${profile.certification}` : ''}</p>
          </div>
          <span className="badge badge-orange" style={{ fontSize: 13, padding: '8px 16px' }}>Coach Dashboard</span>
        </div>

        {/* Tabs */}
        <div className="tab-bar" style={{ marginBottom: 28 }}>
          {[
            { id: 'academy', icon: <Users size={16} />, label: 'Manage Academy' },
            { id: 'upload', icon: <Upload size={16} />, label: 'Upload for Player' },
            { id: 'analytics', icon: <BarChart3 size={16} />, label: 'Batch Analytics' },
          ].map(t => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 'academy' && <AcademyTab coach={profile} />}
        {tab === 'upload' && <CoachUploadTab coachProfile={profile} />}
        {tab === 'analytics' && <CoachAnalyticsTab coachProfile={profile} />}
      </div>
    </div>
  );
}
