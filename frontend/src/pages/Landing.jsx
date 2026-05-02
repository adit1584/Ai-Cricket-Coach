import { Link } from 'react-router-dom';
import { Activity, Video, TrendingUp, Users, ChevronRight, Zap, Target, BarChart3, Shield } from 'lucide-react';

const features = [
  {
    icon: <Video size={22} />,
    title: 'Video Analysis',
    desc: 'Upload your batting or bowling video and get data-driven feedback powered by AI pose detection.',
    color: '#22c55e',
  },
  {
    icon: <Activity size={22} />,
    title: 'Biomechanical Metrics',
    desc: 'Track head movement, knee angle, balance score, hip rotation, and more — frame by frame.',
    color: '#3b82f6',
  },
  {
    icon: <TrendingUp size={22} />,
    title: 'Progress Tracking',
    desc: 'See your improvement over time with visual charts comparing each session.',
    color: '#f97316',
  },
  {
    icon: <Users size={22} />,
    title: 'Coach Dashboard',
    desc: 'Coaches can manage their academy, upload videos for players, and compare batch performance.',
    color: '#a855f7',
  },
  {
    icon: <Target size={22} />,
    title: 'Weakness & Strength Tracker',
    desc: 'AI identifies recurring issues and consistent strengths across all your sessions.',
    color: '#eab308',
  },
  {
    icon: <Shield size={22} />,
    title: 'Private & Secure',
    desc: 'Players only see their own data. Coaches only access their academy players.',
    color: '#06b6d4',
  },
];

const shotTypes = ['Cover Drive', 'Pull Shot', 'Straight Drive', 'Cut Shot', 'Bowling Action', 'Footwork'];

export default function Landing() {
  return (
    <div className="hero-bg min-h-screen">
      {/* Navbar */}
      <nav style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(10,14,26,0.9)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={20} color="#fff" />
            </div>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: 0.5 }}>
              <span className="gradient-text">AI Cricket</span> Coach
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/login">
              <button className="btn-secondary" style={{ padding: '8px 20px', fontSize: 14 }}>Sign In</button>
            </Link>
            <Link to="/register">
              <button className="btn-primary" style={{ padding: '8px 20px', fontSize: 14 }}>Get Started</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div className="animate-fade-up">
          <span className="badge badge-green" style={{ marginBottom: 24, display: 'inline-flex' }}>
            <Zap size={12} /> Powered by MediaPipe + Gemma 2B
          </span>
          <h1 style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: 'clamp(42px, 8vw, 80px)',
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: 24,
            letterSpacing: '-1px',
          }}>
            AI Cricket Coach<br />
            <span className="gradient-text">for Everyone</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.8 }}>
            Upload your cricket video, get instant biomechanical analysis, track your progress, 
            and improve with AI-powered coaching feedback.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register?role=player">
              <button className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
                Sign Up as Player <ChevronRight size={18} />
              </button>
            </Link>
            <Link to="/register?role=coach">
              <button className="btn-secondary" style={{ fontSize: 16, padding: '14px 32px' }}>
                Sign Up as Coach <ChevronRight size={18} />
              </button>
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24, maxWidth: 600, margin: '64px auto 0',
        }}>
          {[
            { label: 'Shot Types', value: '6+' },
            { label: 'Metrics Tracked', value: '7+' },
            { label: 'Real-time Updates', value: 'WebSocket' },
          ].map((s) => (
            <div key={s.label} className="glass-card" style={{ padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-green)', fontFamily: 'Rajdhani' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Shot Types Strip */}
      <section style={{ padding: '20px 0', overflow: 'hidden', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 16, animation: 'none', justifyContent: 'center', flexWrap: 'wrap', padding: '0 24px' }}>
          {shotTypes.map((s) => (
            <span key={s} className="badge badge-blue" style={{ fontSize: 13, padding: '6px 16px' }}>{s}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p className="section-label">What You Get</p>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, fontFamily: 'Rajdhani' }}>
            Everything a <span className="gradient-text">modern cricketer</span> needs
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {features.map((f, i) => (
            <div key={f.title} className="glass-card animate-fade-up" style={{ padding: 28, animationDelay: `${i * 0.1}s` }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${f.color}18`,
                border: `1px solid ${f.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: f.color, marginBottom: 16,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <p className="section-label">How It Works</p>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, fontFamily: 'Rajdhani', marginBottom: 56 }}>
            From <span className="gradient-text-orange">upload</span> to <span className="gradient-text">insight</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
            {[
              { step: '01', title: 'Upload Video', desc: 'Upload your cricket practice video', icon: <Video size={28} /> },
              { step: '02', title: 'AI Processes', desc: 'MediaPipe extracts pose landmarks', icon: <Activity size={28} /> },
              { step: '03', title: 'Get Metrics', desc: 'Biomechanical metrics computed', icon: <BarChart3 size={28} /> },
              { step: '04', title: 'AI Feedback', desc: 'Gemma 2B generates coaching tips', icon: <Zap size={28} /> },
            ].map((s, i) => (
              <div key={s.step} style={{ position: 'relative' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 16, margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(59,130,246,0.15))',
                  border: '1px solid var(--border-active)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-green)',
                }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>STEP {s.step}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, fontFamily: 'Rajdhani', marginBottom: 16 }}>
          Start improving your <span className="gradient-text">game today</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 36, fontSize: 16 }}>
          Join players and coaches already using AI to get measurable, consistent improvement.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register?role=player">
            <button className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
              I'm a Player <ChevronRight size={18} />
            </button>
          </Link>
          <Link to="/register?role=coach">
            <button className="btn-secondary" style={{ fontSize: 16, padding: '14px 32px' }}>
              I'm a Coach <ChevronRight size={18} />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
          <Activity size={16} color="var(--accent-green)" />
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 16 }}>AI Cricket Coach</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Data-backed cricket technique feedback. Not a replacement for human coaches.
        </p>
      </footer>
    </div>
  );
}
