import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { registerUser } from '../services/api';
import './Auth.css';
import logoImg from '../assets/ciphershare-logo.png.png';
import BackButton from '../components/BackButton';

// Only Manager and User (employee) are self-registerable — Admin is created by Admin only
const ROLE_OPTIONS = [
  {
    value: 'employee',
    label: 'User',
    icon: '👤',
    desc: 'View & download authorized files',
    note: 'Instant access — no approval needed',
    color: '#059669',
    bg: 'rgba(5,150,105,0.08)',
    border: 'rgba(5,150,105,0.2)',
    noteColor: '#059669',
  },
  {
    value: 'manager',
    label: 'Manager',
    icon: '🎯',
    desc: 'Upload, share & manage files',
    note: 'Requires admin approval before login',
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.2)',
    noteColor: '#d97706',
  },
];

/* ── Icons ─────────────────────────────────────── */
const ShieldIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
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

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6)  s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}
const STR_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STR_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

export default function Register() {
  const [name,        setName]       = useState('');
  const [email,       setEmail]      = useState('');
  const [selectedRole, setSelectedRole] = useState('employee'); // default: User
  const [password,    setPassword]   = useState('');
  const [confirm,     setConfirm]    = useState('');
  const [showPass,    setShowPass]   = useState(false);
  const [showConf,    setShowConf]   = useState(false);
  const [error,       setError]      = useState('');
  const [success,     setSuccess]    = useState('');
  const [pending,     setPending]    = useState(false); // true when manager is pending approval
  const [loading,     setLoading]    = useState(false);
  const navigate = useNavigate();

  const strength = getStrength(password);

  const doRegister = async (firebaseUser, displayName, role) => {
    const idToken = await firebaseUser.getIdToken();
    const res = await registerUser(idToken, displayName, role);
    const data = res.data;

    if (data.pending) {
      // Manager registration — show approval pending screen
      setPending(true);
      setSuccess(data.message);
    } else {
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1800);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    setError(''); setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await doRegister(cred.user, name, selectedRole);
    } catch (err) {
      const code = err.code;
      setError(
        code === 'auth/email-already-in-use' ? 'This email is already registered. Try signing in.' :
        code === 'auth/weak-password'         ? 'Password must be at least 6 characters.' :
        err.response?.data?.error || err.message
      );
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      // Google sign-in always registers as User (employee) — no approval needed
      await doRegister(cred.user, cred.user.displayName || cred.user.email, 'employee');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally { setLoading(false); }
  };

  // ── Pending Approval Screen ────────────────────────────────
  if (pending) {
    return (
      <div className="auth-page">
        <main className="auth-main" style={{ paddingTop: 40 }}>
          <div style={{
            maxWidth: 480, margin: '0 auto', padding: '48px 32px',
            background: '#fff', borderRadius: 24,
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 8px 40px rgba(0,0,0,.1)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>
              Approval Pending
            </h2>
            <p style={{ color: '#64748b', fontSize: '.9rem', lineHeight: 1.6, marginBottom: 24 }}>
              Your <strong>Manager</strong> account request has been submitted.<br/>
              An <strong>Admin</strong> will review and approve your account.
              Once approved, you will be able to log in.
            </p>
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
              padding: '14px 20px', marginBottom: 24,
              fontSize: '.82rem', color: '#92400e', textAlign: 'left',
            }}>
              <strong>📧 What happens next?</strong>
              <ul style={{ margin: '8px 0 0 16px', padding: 0, lineHeight: 1.8 }}>
                <li>Admin reviews your registration request</li>
                <li>Your account is activated with the Manager role</li>
                <li>You can then log in with your credentials</li>
              </ul>
            </div>
            <Link to="/login" className="auth-submit-btn" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, textDecoration: 'none', marginBottom: 12,
            }}>
              Back to Login <ArrowIcon />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <BackButton to="/" />
      <main className="auth-main" style={{ paddingTop: 40 }}>
        <div className="auth-container">

          {/* ─── LEFT SECTION ─────────────────────────── */}
          <div className="auth-left-section">
            <div className="auth-left-badge">
              <span className="auth-left-badge-dot"/>
              ✦ Quick Setup · 60 seconds · Free Forever
            </div>

            <h1 className="auth-left-heading">
              Join Your Team&apos;s<br/>
              <span className="grad">Secure Workspace</span>
            </h1>

            <p className="auth-left-sub">
              Choose your role when signing up. Manager accounts require
              admin approval. User accounts get instant access.
            </p>

            {/* Role info cards */}
            <div>
              <div className="auth-roles-label">Choose Your Role</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ROLE_OPTIONS.map(r => (
                  <div key={r.value} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 18px',
                    background: 'rgba(255,255,255,0.78)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.65)',
                    borderRadius: 14,
                    boxShadow: '0 2px 12px rgba(99,102,241,0.08)',
                  }}>
                    <span style={{ fontSize: '1.4rem' }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{r.label}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 1 }}>{r.desc}</div>
                    </div>
                    <div style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                      background: r.bg, color: r.color, border: `1px solid ${r.border}`,
                      whiteSpace: 'nowrap',
                    }}>
                      {r.value === 'employee' ? '✓ Instant' : '⏳ Approval'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="auth-feat-grid">
              {[
                { icon: '✍️', title: 'Quick Setup',    desc: 'Under 60 seconds'    },
                { icon: '🔒', title: 'Instant Access', desc: 'Files ready on join' },
                { icon: '👑', title: 'Admin Approval', desc: 'For Manager role'    },
                { icon: '🛡️', title: 'Always Secure',  desc: 'RBAC every request'  },
              ].map(f => (
                <div key={f.title} className="auth-feat-card">
                  <div className="auth-feat-card-icon">{f.icon}</div>
                  <div className="auth-feat-card-title">{f.title}</div>
                  <div className="auth-feat-card-desc">{f.desc}</div>
                </div>
              ))}
            </div>

            <div className="auth-proof-row">
              <div className="auth-proof-avatars">
                {['A', 'R', 'P', 'M', 'K'].map((l, i) => (
                  <div key={i} className="auth-proof-av" style={{ marginLeft: i === 0 ? 0 : -10 }}>{l}</div>
                ))}
              </div>
              <div className="auth-proof-text">
                Users get <strong>instant access</strong> · Managers need <strong>approval</strong>
              </div>
            </div>
          </div>

          {/* ─── RIGHT SECTION: GLASS CARD ────────────── */}
          <div className="auth-glass-card">

            <div className="auth-card-logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <img src={logoImg} alt="CipherShare Logo" style={{ width: '100%', maxWidth: '240px', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div className="auth-tabs">
              <Link to="/login" style={{ flex: 1, textDecoration: 'none' }}>
                <button className="auth-tab" style={{ width: '100%' }}>Login</button>
              </Link>
              <button className="auth-tab active">Sign Up</button>
            </div>

            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 4 }}>
                Create account ✨
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Join your organization&apos;s secure file platform</p>
            </div>

            {error   && <div className="auth-error"   style={{ marginBottom: 16 }}><span>⚠️</span> {error}</div>}
            {success && <div className="auth-success" style={{ marginBottom: 16 }}><span>✅</span> {success}</div>}

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form-body">

              {/* Full Name */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="reg-name">Full Name</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><UserIcon /></span>
                  <input id="reg-name" type="text" className="auth-input has-icon" placeholder="John Doe"
                    value={name} onChange={e => setName(e.target.value)} required autoComplete="name"/>
                </div>
              </div>

              {/* Role Selector */}
              <div className="auth-field">
                <label className="auth-label">Account Role</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {ROLE_OPTIONS.map(r => {
                    const isSelected = selectedRole === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setSelectedRole(r.value)}
                        style={{
                          flex: 1, padding: '12px 10px',
                          border: isSelected ? `2px solid ${r.color}` : '2px solid #e2e8f0',
                          borderRadius: 12, cursor: 'pointer',
                          background: isSelected ? r.bg : '#fafafa',
                          transition: 'all 0.2s ease',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{r.icon}</div>
                        <div style={{ fontSize: '.82rem', fontWeight: 700, color: isSelected ? r.color : '#374151' }}>
                          {r.label}
                        </div>
                        <div style={{ fontSize: '.65rem', color: isSelected ? r.noteColor : '#9ca3af', marginTop: 3, fontWeight: 600 }}>
                          {r.value === 'employee' ? '✓ Instant access' : '⏳ Needs approval'}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedRole === 'manager' && (
                  <div style={{
                    marginTop: 8, padding: '8px 12px', borderRadius: 8,
                    background: '#fffbeb', border: '1px solid #fde68a',
                    fontSize: '.75rem', color: '#92400e', display: 'flex', gap: 6, alignItems: 'flex-start',
                  }}>
                    <span>⏳</span>
                    <span>Manager accounts require <strong>admin approval</strong> before you can log in.</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="reg-email">Email address</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><MailIcon /></span>
                  <input id="reg-email" type="email" className="auth-input has-icon" placeholder="you@organization.com"
                    value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"/>
                </div>
              </div>

              {/* Passwords */}
              <div className="auth-grid-2">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-password">Password</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><LockIcon /></span>
                    <input id="reg-password" type={showPass ? 'text' : 'password'}
                      className="auth-input has-icon has-eye" placeholder="Min. 6 chars"
                      value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete="new-password"/>
                    <button type="button" className="auth-eye-btn" onClick={() => setShowPass(s => !s)}>
                      {showPass ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {password && (
                    <div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} style={{
                            height: 3, flex: 1, borderRadius: 2,
                            background: i <= strength ? STR_COLORS[strength] : '#e2e8f0',
                            transition: 'background 0.3s',
                          }}/>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.68rem', marginTop: 3, color: STR_COLORS[strength], fontWeight: 600 }}>
                        {STR_LABELS[strength]}
                      </div>
                    </div>
                  )}
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-confirm">Confirm Password</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><LockIcon /></span>
                    <input id="reg-confirm" type={showConf ? 'text' : 'password'}
                      className="auth-input has-icon has-eye" placeholder="Repeat password"
                      value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password"/>
                    <button type="button" className="auth-eye-btn" onClick={() => setShowConf(s => !s)}>
                      {showConf ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {confirm && (
                    <div style={{ fontSize: '0.68rem', marginTop: 6, fontWeight: 600, color: confirm === password ? '#22c55e' : '#ef4444' }}>
                      {confirm === password ? '✓ Passwords match' : '✕ Do not match'}
                    </div>
                  )}
                </div>
              </div>

              <button id="register-submit" type="submit" className="auth-submit-btn" disabled={loading}>
                {loading
                  ? <><span className="auth-spinner"/> Creating account...</>
                  : <>{selectedRole === 'manager' ? '📋 Submit Manager Request' : '✨ Create Account'} <ArrowIcon /></>
                }
              </button>

              <div className="auth-divider"><span>or continue with</span></div>

              <button type="button" className="auth-google-btn" onClick={handleGoogle} disabled={loading}>
                <GoogleIcon /> Continue with Google (User role)
              </button>
            </form>

            <p className="auth-switch-text">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>

            <p className="auth-terms-text">
              By creating an account you agree to our{' '}
              <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
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
