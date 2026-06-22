import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/Alert';
import {
  getUserProfile,
  updateUserProfile,
  getUserDashboard,
  getUserDownloads,
  getUserActivity,
  uploadAvatar,
  uploadCover,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';

const DEPARTMENTS = ['General', 'Engineering', 'Marketing', 'Finance', 'HR', 'Operations', 'Sales', 'Legal', 'IT'];

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState('');
  const [dept, setDept] = useState('General');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [createdAt, setCreatedAt] = useState(null);

  // Stats & logs
  const [stats, setStats] = useState({
    totalShared: 0,
    uniqueDownloads: 0,
    totalDownloads: 0,
    totalActivities: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);

  // States
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [editing, setEditing] = useState(false);

  // Upload previews
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [coverRemoved, setCoverRemoved] = useState(false);

  // Mock MFA
  const [mfaEnabled, setMfaEnabled] = useState(() => {
    return localStorage.getItem(`mfa_${user?.uid}`) === 'true';
  });

  const loadProfile = useCallback(() => {
    getUserProfile()
      .then((r) => {
        const u = r.data.user;
        setName(u?.name || '');
        setDept(u?.department || 'General');
        setPhone(u?.phoneNumber || '');
        setBio(u?.bio || '');
        setProfilePic(u?.profilePictureUrl || '');
        setCoverPhoto(u?.coverPhotoUrl || '');
        setAvatarPreview(u?.profilePictureUrl || '');
        setCoverPreview(u?.coverPhotoUrl || '');
        setCreatedAt(u?.createdAt || null);
      })
      .catch(console.error);

    Promise.all([
      getUserDashboard().catch(() => ({ data: {} })),
      getUserDownloads().catch(() => ({ data: { downloads: [] } })),
      getUserActivity().catch(() => ({ data: { logs: [] } })),
    ]).then(([dash, dlRes, actRes]) => {
      const dls = dlRes.data.downloads || [];
      const logs = actRes.data.logs || [];
      const uniqDls = new Set(dls.map((d) => d.fileId)).size;
      const logins = logs.filter((l) => l.action === 'LOGIN').slice(0, 3);

      setStats({
        totalShared: dash.data.totalShared || 0,
        uniqueDownloads: uniqDls,
        totalDownloads: dls.length,
        totalActivities: logs.length,
      });
      setActivities(logs.slice(0, 5));
      setLoginHistory(logins);
    });
  }, [user?.uid]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleToggleMfa = () => {
    const next = !mfaEnabled;
    setMfaEnabled(next);
    localStorage.setItem(`mfa_${user?.uid}`, String(next));
    setAlert({ type: 'success', message: `✅ Two-Factor Authentication has been ${next ? 'enabled' : 'disabled'}.` });
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setAlert({ type: 'success', message: '📧 Password reset email sent! Please check your inbox.' });
    } catch (err) {
      setAlert({ type: 'error', message: '❌ Failed to send password reset email: ' + err.message });
    }
  };

  // Image Selection Validation and Local Preview
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setAlert({ type: 'error', message: '❌ Invalid file type. Only JPG, JPEG, and PNG images are supported.' });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarRemoved(false);
    setEditing(true); // Automatically switch to editing mode so Save button is visible
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setAvatarRemoved(true);
    setEditing(true);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setAlert({ type: 'error', message: '❌ Invalid file type. Only JPG, JPEG, and PNG images are supported.' });
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setCoverRemoved(false);
    setEditing(true);
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview('');
    setCoverRemoved(true);
    setEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);
    try {
      let finalAvatarUrl = profilePic;
      let finalCoverUrl = coverPhoto;

      // 1. Upload new avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const res = await uploadAvatar(formData);
        finalAvatarUrl = res.data.url;
      } else if (avatarRemoved) {
        finalAvatarUrl = '';
      }

      // 2. Upload new cover if selected
      if (coverFile) {
        const formData = new FormData();
        formData.append('file', coverFile);
        const res = await uploadCover(formData);
        finalCoverUrl = res.data.url;
      } else if (coverRemoved) {
        finalCoverUrl = '';
      }

      // 3. Save to profile update endpoint
      await updateUserProfile(name, dept, phone, bio, finalAvatarUrl, finalCoverUrl);

      // 4. Update states & context
      setProfilePic(finalAvatarUrl);
      setCoverPhoto(finalCoverUrl);
      setAvatarPreview(finalAvatarUrl);
      setCoverPreview(finalCoverUrl);
      setAvatarFile(null);
      setCoverFile(null);
      setAvatarRemoved(false);
      setCoverRemoved(false);

      setUser((prev) => ({
        ...prev,
        name,
        department: dept,
        profilePictureUrl: finalAvatarUrl,
      }));

      setAlert({ type: 'success', message: '💾 Profile details saved successfully!' });
      setEditing(false);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setAlert({ type: 'error', message: '❌ Failed to update profile details: ' + msg });
    } finally {
      setSaving(false);
    }
  };

  // Profile completion calculation
  const getCompletionPercentage = () => {
    let pct = 0;
    if (name.trim()) pct += 20;
    if (user?.email) pct += 20;
    if (phone.trim()) pct += 20;
    if (bio.trim()) pct += 20;
    if (avatarPreview) pct += 20;
    return pct;
  };

  const completionPct = getCompletionPercentage();

  // Date Formatting Helper
  const fmtJoinDate = (ts) => {
    if (!ts) return 'Member';
    const d = new Date(ts);
    return 'Joined ' + d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Activity Timeline Styles
  const ACT_STYLES = {
    UPLOAD: { icon: '⬆️', color: '#2563eb', bg: '#eff6ff', label: 'Uploaded' },
    SHARE: { icon: '🔗', color: '#7c3aed', bg: '#f5f3ff', label: 'Shared' },
    DOWNLOAD: { icon: '⬇️', color: '#059669', bg: '#f0fdf4', label: 'Downloaded' },
    DELETE: { icon: '🗑️', color: '#dc2626', bg: '#fef2f2', label: 'Deleted' },
    PROFILE_UPDATE: { icon: '✏️', color: '#d97706', bg: '#fffbeb', label: 'Updated profile' },
    LOGIN: { icon: '🔐', color: '#059669', bg: '#f0fdf4', label: 'Logged in' },
  };
  const DEFAULT_STYLE = { icon: '📋', color: '#6b7280', bg: '#f9fafb', label: 'Action' };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content mgr-main">
        <PageHeader title="My Profile" subtitle="Manage your enterprise user profile and security preferences" />
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* ── PROFILE BANNER SECTION ── */}
        <div
          className="usr-profile-banner"
          style={{
            backgroundImage: coverPreview
              ? `url(${coverPreview})`
              : 'linear-gradient(135deg, var(--indigo) 0%, var(--purple) 100%)',
          }}
        >
          <div className="usr-profile-banner-overlay" style={{ gap: 8 }}>
            {coverPreview && (
              <button className="usr-cover-upload-btn" onClick={handleRemoveCover} style={{ color: '#dc2626' }}>
                🗑️ Remove Cover
              </button>
            )}
            <label className="usr-cover-upload-btn">
              📷 Change Cover Photo
              <input type="file" accept=".jpg,.png,.jpeg" style={{ display: 'none' }} onChange={handleCoverChange} />
            </label>
          </div>

          <div className="usr-profile-header-container">
            {/* Avatar Circle */}
            <div
              className="usr-profile-avatar-container"
              style={{
                backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none',
              }}
            >
              {!avatarPreview && (
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--indigo)' }}>
                  {name?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
              <label className="usr-profile-avatar-hover">
                <span>📷</span>
                <span>Change</span>
                <input type="file" accept=".jpg,.png,.jpeg" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
            </div>

            {/* Title / Meta */}
            <div className="usr-profile-header-info">
              <h2 className="usr-profile-header-name">{name}</h2>
              <div className="usr-profile-header-sub">
                <span className="text-secondary">{user?.email}</span>
                <span style={{ color: 'var(--border)' }}>•</span>
                <span className={`badge badge-${user?.role || 'employee'}`} style={{ textTransform: 'capitalize' }}>
                  {user?.role === 'employee' ? 'User' : user?.role || 'User'}
                </span>
                <span style={{ color: 'var(--border)' }}>•</span>
                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  📅 {fmtJoinDate(createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="usr-profile-grid">
          {/* ── LEFT COLUMN: OVERVIEW & STATS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Completion Card */}
            <div className="usr-profile-completion-card">
              <div className="usr-profile-completion-header">
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--fg)' }}>Profile Completion</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--indigo)' }}>{completionPct}%</span>
              </div>
              <div className="usr-profile-completion-track">
                <div className="usr-profile-completion-bar" style={{ width: `${completionPct}%` }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--fg4)', marginTop: 8 }}>
                Complete your details to secure your enterprise identity.
              </div>
            </div>

            {/* Profile Details summary card */}
            <div className="mgr-card">
              <h3 className="mgr-card-title" style={{ marginBottom: 16 }}>👤 Account Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Name', name || '—'],
                  ['Email', user?.email || '—'],
                  ['Role', user?.role === 'employee' ? 'User' : user?.role || 'User'],
                  ['Department', dept || '—'],
                  ['Phone', phone || '—'],
                  ['Status', <span style={{ color: '#059669', fontWeight: 700 }}>● Active</span>],
                ].map(([label, value]) => (
                  <div key={label.toString()} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-2)', paddingBottom: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--fg3)' }}>{label}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--fg)' }}>{value}</span>
                  </div>
                ))}
              </div>
              {avatarPreview && (
                <button
                  className="mgr-btn-outline"
                  onClick={handleRemoveAvatar}
                  style={{ width: '100%', marginTop: 18, color: '#dc2626', borderColor: '#fca5a5' }}
                >
                  🗑️ Remove Profile Picture
                </button>
              )}
            </div>

            {/* Statistics */}
            <div className="mgr-card">
              <h3 className="mgr-card-title" style={{ marginBottom: 16 }}>📊 Platform Activity</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['📁 Shared Files', stats.totalShared, '#eff6ff', '#2563eb'],
                  ['📥 Files Downloaded', stats.uniqueDownloads, '#f0fdf4', '#059669'],
                  ['⬇️ Total Downloads', stats.totalDownloads, '#fffbeb', '#d97706'],
                  ['⚡ Total Actions', stats.totalActivities, '#f5f3ff', '#7c3aed'],
                ].map(([label, value, bg, color]) => (
                  <div
                    key={label.toString()}
                    style={{
                      background: '#fff',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-sm)',
                      padding: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: color }}>{value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--fg3)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: EDIT DETAILS, ACTIVITY, SECURITY ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Edit / Details Card */}
            <div className="mgr-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="mgr-card-title">{editing ? '✏️ Edit Profile' : '👤 Profile Details'}</h3>
                <button className="mgr-btn-sm-outline" onClick={() => setEditing(!editing)}>
                  {editing ? '✕ Cancel' : '✏️ Edit Details'}
                </button>
              </div>

              {editing ? (
                <form onSubmit={handleSaveProfile}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        className="form-control"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select className="form-control" value={dept} onChange={(e) => setDept(e.target.value)}>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <input
                        className="form-control"
                        value={user?.role === 'employee' ? 'User' : user?.role || 'User'}
                        disabled
                        style={{ opacity: 0.6, cursor: 'not-allowed', textTransform: 'capitalize' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label className="form-label">Bio / Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Write a short bio about yourself..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                    <button type="submit" className="mgr-btn-primary" disabled={saving}>
                      {saving ? <span className="spinner" /> : '💾'} Save Changes
                    </button>
                    <button type="button" className="mgr-btn-outline" onClick={() => { setEditing(false); loadProfile(); }}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: 'var(--bg-soft)', borderRadius: 'var(--r-sm)', padding: 14, fontSize: '0.85rem', color: 'var(--fg2)', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--fg)' }}>Bio</div>
                    {bio || <em style={{ color: 'var(--fg4)' }}>No bio written yet. Click Edit Details to write one.</em>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--fg4)', fontWeight: 700 }}>Phone</span>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 2, color: 'var(--fg2)' }}>{phone || '—'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--fg4)', fontWeight: 700 }}>Department</span>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 2, color: 'var(--fg2)' }}>{dept}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── SECURITY SECTION ── */}
            <div className="mgr-card">
              <h3 className="mgr-card-title" style={{ marginBottom: 4 }}>🛡️ Security and Authentication</h3>
              <p className="mgr-card-sub" style={{ marginBottom: 16 }}>Configure credentials and view active login sessions</p>

              <div className="usr-security-grid">
                {/* Card: Reset Password */}
                <div className="usr-security-card">
                  <div className="usr-security-icon-wrap" style={{ background: '#eef2ff', color: '#4f46e5' }}>🔑</div>
                  <div className="usr-security-body">
                    <div>
                      <div className="usr-security-title">Change Password</div>
                      <div className="usr-security-desc">Receive a secure link to reset your account credentials.</div>
                    </div>
                    <button className="mgr-btn-sm-outline" style={{ alignSelf: 'flex-start' }} onClick={handlePasswordReset}>
                      ✉️ Reset Password
                    </button>
                  </div>
                </div>

                {/* Card: Two-Factor Auth */}
                <div className="usr-security-card">
                  <div className="usr-security-icon-wrap" style={{ background: mfaEnabled ? '#f0fdf4' : '#fffbeb', color: mfaEnabled ? '#059669' : '#d97706' }}>🛡️</div>
                  <div className="usr-security-body">
                    <div>
                      <div className="usr-security-title">Two-Factor Auth (MFA)</div>
                      <div className="usr-security-desc">Protect your workspace downloads with supplementary verification.</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                      <button
                        className={mfaEnabled ? 'mgr-btn-sm-primary' : 'mgr-btn-sm-outline'}
                        onClick={handleToggleMfa}
                      >
                        {mfaEnabled ? '✓ Enabled' : 'Enable MFA'}
                      </button>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: mfaEnabled ? '#059669' : 'var(--fg4)' }}>
                        {mfaEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Information */}
              <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 10 }}>Session Info</h4>
                <div style={{ display: 'flex', gap: 16, background: 'var(--bg-soft)', borderRadius: 'var(--r-sm)', padding: 12, fontSize: '0.78rem', color: 'var(--fg3)', flexWrap: 'wrap' }}>
                  <div>🖥️ <strong>OS:</strong> Windows</div>
                  <div>🌐 <strong>Browser:</strong> Chrome / Firefox (Webkit)</div>
                  <div>⏱️ <strong>Active Session:</strong> 30 min timeout</div>
                </div>
              </div>

              {/* Login history */}
              {loginHistory.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 8 }}>Recent Logins</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {loginHistory.map((h, i) => (
                      <div key={h.logId || i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--fg4)' }}>
                        <span>📍 {h.details || 'Session started'}</span>
                        <span>{new Date(h.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(h.timestamp).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RECENT ACTIVITY TIMELINE ── */}
            <div className="mgr-card">
              <h3 className="mgr-card-title" style={{ marginBottom: 16 }}>🕐 Recent Activities</h3>
              {activities.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--fg4)', fontSize: '0.82rem' }}>
                  No activities recorded yet.
                </div>
              ) : (
                <div className="mgr-timeline-full" style={{ padding: 0 }}>
                  {activities.map((log, i) => {
                    const s = ACT_STYLES[log.action] || DEFAULT_STYLE;
                    return (
                      <div key={log.logId || i} className="usr-timeline-item">
                        <div className="usr-timeline-icon" style={{ background: s.bg, color: s.color }}>
                          {s.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.details || s.label}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--fg4)', marginTop: 2 }}>
                            {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
