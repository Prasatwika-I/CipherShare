import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';
import logoImg from '../assets/ciphershare-logo.png.png';
import BackButton from '../components/BackButton';

/* ── Icons ───────────────────────────────────────────── */
const ShieldIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const FEATURES = [
  { icon:'🔐', title:'Role-Based Access',  desc:'Scoped permissions per role' },
  { icon:'🛡️', title:'Firebase Auth',       desc:'JWT secured on every call'   },
  { icon:'📁', title:'Smart File Sharing', desc:'Share by user, role or dept'  },
  { icon:'📊', title:'Audit Logs',         desc:'Every action timestamped'     },
];
const ROLES = [
  { icon:'👑', name:'Admin',    desc:'Full control',    color:'#7c3aed' },
  { icon:'💼', name:'Manager', desc:'Upload & share',  color:'#2563eb' },
  { icon:'👤', name:'Employee',desc:'View & download', color:'#059669' },
];

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleRedirect = (role) => {
    if (role === 'admin')   return navigate('/admin/dashboard');
    if (role === 'manager') return navigate('/manager/dashboard');
    navigate('/user/dashboard');
  };

  const doLogin = async (firebaseUser) => {
    const idToken = await firebaseUser.getIdToken();
    const res = await loginUser(idToken);
    login(res.data);
    handleRedirect(res.data.role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await doLogin(cred.user);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(msg.includes('invalid-credential') || msg.includes('INVALID_LOGIN')
        ? 'Invalid email or password. Please try again.'
        : msg);
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await doLogin(cred.user);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <BackButton to="/" />
      <main className="auth-main" style={{paddingTop: 40}}>
        <div className="auth-container">

          {/* ─── LEFT SECTION ─────────────────────────── */}
          <div className="auth-left-section">
            <div className="auth-left-badge">
              <span className="auth-left-badge-dot"/>
              ✦ Secure · Role-Based · Enterprise-Ready
            </div>

            <h1 className="auth-left-heading">
              Secure File Sharing<br/>
              <span className="grad">Made Simple</span>
            </h1>

            <p className="auth-left-sub">
              Manage documents, assign permissions and collaborate
              securely — with role-based access control at every layer.
            </p>

            <div className="auth-illus-row">
              <div className="auth-illus-card">
                <div className="auth-illus-icon blue">📁</div>
                <div>
                  <div className="auth-illus-label">Cloud Storage</div>
                  <div className="auth-illus-desc">Files synced globally</div>
                </div>
              </div>
              <div className="auth-illus-card">
                <div className="auth-illus-icon purple">🔐</div>
                <div>
                  <div className="auth-illus-label">End-to-End Secure</div>
                  <div className="auth-illus-desc">JWT on every request</div>
                </div>
              </div>
              <div className="auth-illus-card">
                <div className="auth-illus-icon indigo">📊</div>
                <div>
                  <div className="auth-illus-label">Audit Logs</div>
                  <div className="auth-illus-desc">Full compliance trail</div>
                </div>
              </div>
            </div>

            <div>
              <div className="auth-roles-label">Access Roles</div>
              <div className="auth-roles-row">
                {ROLES.map(r => (
                  <div key={r.name} className="auth-role-chip">
                    <span className="auth-role-chip-icon">{r.icon}</span>
                    <div>
                      <div className="auth-role-chip-name" style={{color: r.color}}>{r.name}</div>
                      <div className="auth-role-chip-sub">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="auth-feat-grid">
              {FEATURES.map(f => (
                <div key={f.title} className="auth-feat-card">
                  <div className="auth-feat-card-icon">{f.icon}</div>
                  <div className="auth-feat-card-title">{f.title}</div>
                  <div className="auth-feat-card-desc">{f.desc}</div>
                </div>
              ))}
            </div>

            <div className="auth-proof-row">
              <div className="auth-proof-avatars">
                {['A','R','P','M','K'].map((l, i) => (
                  <div key={i} className="auth-proof-av" style={{marginLeft: i===0?0:-10}}>{l}</div>
                ))}
              </div>
              <div className="auth-proof-text">
                <strong>500+</strong> secure teams trust CipherShare
              </div>
            </div>
          </div>

          {/* ─── RIGHT SECTION: GLASS CARD ────────────── */}
          <div className="auth-glass-card">

            {/* Card logo */}
            <div className="auth-card-logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <img src={logoImg} alt="CipherShare Logo" style={{ width: '100%', maxWidth: '240px', height: 'auto', objectFit: 'contain' }} />
            </div>

            {/* Tabs */}
            <div className="auth-tabs">
              <button className="auth-tab active">Login</button>
              <Link to="/register" style={{flex:1, textDecoration:'none'}}>
                <button className="auth-tab" style={{width:'100%'}}>Sign Up</button>
              </Link>
            </div>

            <div style={{marginBottom:24}}>
              <h2 style={{fontSize:'1.45rem',fontWeight:900,color:'#0f172a',letterSpacing:'-0.5px',marginBottom:4}}>
                Welcome back 👋
              </h2>
              <p style={{fontSize:'0.875rem',color:'#64748b'}}>Sign in to your CipherShare workspace</p>
            </div>

            {error && (
              <div className="auth-error" style={{marginBottom:18}}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form-body">
              <div className="auth-field">
                <label className="auth-label" htmlFor="login-email">Email address</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><MailIcon /></span>
                  <input
                    id="login-email"
                    type="email"
                    className="auth-input has-icon"
                    placeholder="you@organization.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="login-password">Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><LockIcon /></span>
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    className="auth-input has-icon has-eye"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPass(s => !s)}>
                    {showPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="auth-row">
                <label className="auth-checkbox-label">
                  <input type="checkbox" className="auth-checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/>
                  Remember me
                </label>
                <a href="#" className="auth-forgot">Forgot password?</a>
              </div>

              <button id="login-submit" type="submit" className="auth-submit-btn" disabled={loading} style={{marginTop:4}}>
                {loading ? <><span className="auth-spinner"/> Signing in...</> : <>Sign In <ArrowIcon /></>}
              </button>

              {/* Divider */}
              <div className="auth-divider"><span>or continue with</span></div>

              {/* Google */}
              <button type="button" className="auth-google-btn" onClick={handleGoogle} disabled={loading}>
                <GoogleIcon /> Continue with Google
              </button>
            </form>

            <p className="auth-switch-text">
              Don&apos;t have an account?{' '}
              <Link to="/register">Create one for free</Link>
            </p>

            <div className="auth-secure-note">
              <ShieldIcon />
              Secured by Firebase Authentication · End-to-end encrypted
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
