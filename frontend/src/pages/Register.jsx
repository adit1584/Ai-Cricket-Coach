import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, Eye, EyeOff, ChevronRight, User, Users } from 'lucide-react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'professional'];
const PREFERRED_ROLES = ['batter', 'bowler', 'all-rounder', 'wicket-keeper'];

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [role, setRole] = useState(searchParams.get('role') || 'player');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    age: '', experience_level: 'beginner', preferred_role: 'batter',
    academy_name: '', certification: '',
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (role === 'coach' && !form.academy_name) {
      toast.error('Academy name is required for coaches');
      return;
    }

    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role };
      if (role === 'player') {
        payload.age = form.age ? parseInt(form.age) : undefined;
        payload.experience_level = form.experience_level;
        payload.preferred_role = form.preferred_role;
      } else {
        payload.academy_name = form.academy_name;
        payload.certification = form.certification;
      }

      const { data } = await authAPI.register(payload);
      login(data.token, data.user, data.profile);
      toast.success('Account created! Welcome aboard.');
      navigate(role === 'player' ? '/player' : '/coach');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-bg min-h-screen flex items-center justify-center" style={{ padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={24} color="#fff" />
            </div>
            <span style={{ fontFamily: 'Rajdhani', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
              AI Cricket Coach
            </span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 24, marginBottom: 6 }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Already have one? <Link to="/login" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>

        <div className="glass-card" style={{ padding: 36 }}>
          {/* Role Toggle */}
          <div style={{ marginBottom: 28 }}>
            <p className="section-label">I am a</p>
            <div className="tab-bar">
              <button
                type="button"
                className={`tab-btn ${role === 'player' ? 'active' : ''}`}
                onClick={() => setRole('player')}
              >
                <User size={16} /> Player
              </button>
              <button
                type="button"
                className={`tab-btn ${role === 'coach' ? 'active' : ''}`}
                onClick={() => setRole('coach')}
              >
                <Users size={16} /> Coach
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Common Fields */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Full Name</label>
              <input id="reg-name" className="input-field" placeholder="Virat Kohli" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Email Address</label>
              <input id="reg-email" type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="divider" style={{ margin: '4px 0' }} />

            {/* Player-specific fields */}
            {role === 'player' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Age</label>
                    <input id="reg-age" type="number" className="input-field" placeholder="e.g. 20" min="5" max="60" value={form.age} onChange={set('age')} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Preferred Role</label>
                    <select id="reg-preferred-role" className="input-field" value={form.preferred_role} onChange={set('preferred_role')}>
                      {PREFERRED_ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Experience Level</label>
                  <select id="reg-experience" className="input-field" value={form.experience_level} onChange={set('experience_level')}>
                    {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Coach-specific fields */}
            {role === 'coach' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Academy / Organization Name</label>
                  <input id="reg-academy" className="input-field" placeholder="e.g. Mumbai Cricket Academy" value={form.academy_name} onChange={set('academy_name')} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Certification / Experience</label>
                  <input id="reg-certification" className="input-field" placeholder="e.g. BCCI Level 2 Coach" value={form.certification} onChange={set('certification')} />
                </div>
              </>
            )}

            <button id="reg-submit" type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8, justifyContent: 'center' }}>
              {loading ? <><span className="loading-spinner" /> Creating account...</> : <>Create Account <ChevronRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
