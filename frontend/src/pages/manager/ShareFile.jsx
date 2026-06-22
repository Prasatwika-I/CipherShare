import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { getManagerShareData, shareFile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* ── Helpers ─────────────────────────────────────────────── */
function fileIcon(name = '') {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf')                            return { icon: '📕', color: '#dc2626', bg: '#fef2f2' };
  if (['doc','docx'].includes(ext))             return { icon: '📘', color: '#2563eb', bg: '#eff6ff' };
  if (['xls','xlsx','csv'].includes(ext))       return { icon: '📗', color: '#059669', bg: '#f0fdf4' };
  if (['ppt','pptx'].includes(ext))             return { icon: '📙', color: '#d97706', bg: '#fffbeb' };
  if (['jpg','jpeg','png','gif','svg','webp'].includes(ext)) return { icon: '🖼️', color: '#7c3aed', bg: '#f5f3ff' };
  if (['zip','rar','7z'].includes(ext))         return { icon: '📦', color: '#6b7280', bg: '#f9fafb' };
  return { icon: '📄', color: '#6b7280', bg: '#f9fafb' };
}
function fmtSize(b = 0) {
  if (!b) return '—';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

export default function ShareFilePage() {
  const { user }                   = useAuth();
  const navigate                   = useNavigate();

  const [data, setData]             = useState({ files: [], users: [] });
  const [loading, setLoading]       = useState(true);
  const [selectedFile, setSelectedFile] = useState('');
  const [shareType, setShareType]   = useState('user'); // 'user' | 'role'
  const [shareTarget, setShareTarget] = useState(''); // role option
  const [selectedUserIds, setSelectedUserIds] = useState([]); // array of selected user uids
  const [userSearch, setUserSearch] = useState('');
  const [canDownload, setCanDownload] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState({ msg: '', type: 'success' });
  const [error, setError]           = useState('');
  const [successCount, setSuccessCount] = useState(0);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3800);
  };

  useEffect(() => {
    getManagerShareData()
      .then(r => {
        setData(r.data || { files: [], users: [] });
        if (r.data?.files?.length) setSelectedFile(r.data.files[0].fileId);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeUsers = (data.users || []).filter(u => u.uid !== user?.uid);

  // Filter users based on search query
  const filteredUsers = activeUsers.filter(u => {
    const term = userSearch.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term) ||
      (u.department || '').toLowerCase().includes(term)
    );
  });

  const roleOptions = [
    { value: 'employee', label: 'All Users (Employees)', name: 'All Users' },
    { value: 'manager',  label: 'All Managers',           name: 'All Managers' },
  ];

  const handleToggleUser = (uid) => {
    setSelectedUserIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allFilteredUids = filteredUsers.map(u => u.uid);
      setSelectedUserIds(prev => Array.from(new Set([...prev, ...allFilteredUids])));
    } else {
      const allFilteredUids = filteredUsers.map(u => u.uid);
      setSelectedUserIds(prev => prev.filter(id => !allFilteredUids.includes(id)));
    }
  };

  const selectedFileObj = data.files.find(f => f.fileId === selectedFile);
  const selFi = selectedFileObj ? fileIcon(selectedFileObj.fileName) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) { setError('Please select a file.'); return; }
    
    if (shareType === 'user' && selectedUserIds.length === 0) {
      setError('Please select at least one user from the list.');
      return;
    }
    if (shareType === 'role' && !shareTarget) {
      setError('Please select a target role.');
      return;
    }

    setSubmitting(true); setError('');
    try {
      if (shareType === 'user') {
        const uidsString = selectedUserIds.join(',');
        await shareFile({
          fileId: selectedFile,
          sharedWithId: uidsString,
          sharedWithType: 'user',
          sharedWithName: `${selectedUserIds.length} User(s)`,
          canDownload: canDownload.toString(),
        });
        showToast(`✅ "${selectedFileObj.fileName}" shared with ${selectedUserIds.length} user(s)!`);
        setSelectedUserIds([]);
      } else {
        const chosenRole = roleOptions.find(r => r.value === shareTarget);
        await shareFile({
          fileId: selectedFile,
          sharedWithId: shareTarget,
          sharedWithType: 'role',
          sharedWithName: chosenRole?.name || shareTarget,
          canDownload: canDownload.toString(),
        });
        showToast(`✅ "${selectedFileObj.fileName}" shared with role: ${chosenRole?.name}!`);
        setShareTarget('');
      }
      setSuccessCount(n => n + 1);
      setCanDownload(false);
    } catch (e) {
      setError('Sharing failed: ' + (e.response?.data?.error || e.message));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content mgr-main">

        {/* Toast */}
        {toast.msg && (
          <div style={{
            position: 'fixed', top: 24, right: 28, zIndex: 9998,
            padding: '12px 20px', borderRadius: 10,
            background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: toast.type === 'error' ? '#dc2626' : '#059669',
            border: `1.5px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            fontWeight: 700, fontSize: '.875rem',
            boxShadow: '0 8px 24px rgba(0,0,0,.12)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="mgr-page-header">
          <div>
            <h1 className="mgr-page-title">Share File</h1>
            <p className="mgr-page-sub">Grant access to your files securely</p>
          </div>
          {successCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 'var(--r-sm)', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#059669', fontSize: '.85rem', fontWeight: 700 }}>
              ✅ {successCount} share action{successCount > 1 ? 's' : ''} completed this session
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* Share Card */}
          <div className="mgr-card">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <div className="loading-spinner" />
              </div>
            ) : data.files.length === 0 ? (
              <div className="mgr-empty">
                <div className="mgr-empty-icon">📂</div>
                <p className="mgr-empty-title">No files to share</p>
                <p className="mgr-empty-sub">Upload a file first before sharing.</p>
                <button className="mgr-btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/manager/upload-file')}>
                  ⬆️ Upload a File
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 className="mgr-card-title" style={{ marginBottom: 4 }}>🔗 Share a File</h2>
                <p className="mgr-card-sub" style={{ marginBottom: 24 }}>Select a file, search and select target users, and assign access permissions</p>

                {error && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: '.85rem', marginBottom: 16, border: '1px solid #fecaca' }}>
                    ❌ {error}
                  </div>
                )}

                {/* File selector */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--fg2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Select File
                  </label>
                  {selectedFileObj && selFi && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: selFi.bg, marginBottom: 8 }}>
                      <span style={{ fontSize: '1.3rem' }}>{selFi.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '.85rem', color: selFi.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedFileObj.fileName}
                        </div>
                      </div>
                    </div>
                  )}
                  <select className="form-control" value={selectedFile} onChange={e => setSelectedFile(e.target.value)}>
                    {data.files.map(f => <option key={f.fileId} value={f.fileId}>{f.fileName}</option>)}
                  </select>
                </div>

                {/* Share type tabs */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--fg2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Share Mode
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {[['user', '👥 Users List'], ['role', '🏷️ By Role']].map(([t, label]) => (
                      <button key={t} type="button"
                        onClick={() => { setShareType(t); setError(''); }}
                        style={{
                          flex: 1, padding: '9px 12px', border: '1.5px solid',
                          borderColor: shareType === t ? 'var(--indigo)' : 'var(--border)',
                          background: shareType === t ? '#eef2ff' : '#fff',
                          color: shareType === t ? 'var(--indigo)' : 'var(--fg3)',
                          borderRadius: 'var(--r-sm)', fontWeight: 600, fontSize: '.85rem',
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s ease',
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Share Targets */}
                {shareType === 'user' ? (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--fg2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      Registered Users List ({selectedUserIds.length} selected)
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="🔍 Search users by name, email, dept..."
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        style={{ flex: 1, margin: 0 }}
                      />
                      {userSearch && (
                        <button type="button" onClick={() => setUserSearch('')} style={{ padding: '0 12px', border: '1.5px solid var(--border)', background: '#fff', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600 }}>Clear</button>
                      )}
                    </div>

                    {/* Users list container */}
                    <div style={{
                      border: '1.5px solid var(--border)',
                      borderRadius: 'var(--r-sm)',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      background: '#fff',
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                        <thead style={{ background: 'var(--bg-soft)', position: 'sticky', top: 0, zIndex: 1, borderBottom: '1.5px solid var(--border)' }}>
                          <tr>
                            <th style={{ padding: '8px 10px', textAlign: 'left', width: '35px' }}>
                              <input
                                type="checkbox"
                                onChange={handleSelectAll}
                                checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.uid))}
                              />
                            </th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--fg3)' }}>User Details</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--fg3)' }}>Department</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan="3" style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--fg4)' }}>
                                No registered users match your search.
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map(u => {
                              const isChecked = selectedUserIds.includes(u.uid);
                              return (
                                <tr key={u.uid}
                                  style={{
                                    borderBottom: '1px solid var(--border-2)',
                                    background: isChecked ? '#f5f3ff' : 'transparent',
                                    transition: 'background .15s',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => handleToggleUser(u.uid)}
                                >
                                  <td style={{ padding: '10px', verticalAlign: 'middle' }} onClick={e => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleUser(u.uid)}
                                    />
                                  </td>
                                  <td style={{ padding: '10px', verticalAlign: 'middle' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--fg)' }}>{u.name}</div>
                                    <div style={{ fontSize: '.72rem', color: 'var(--fg4)', marginTop: 1 }}>{u.email}</div>
                                    <div style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: 4, background: '#f3f4f6', color: '#4b5563', fontSize: '.65rem', fontWeight: 700, marginTop: 4 }}>
                                      {u.role === 'employee' ? 'User' : u.role}
                                    </div>
                                  </td>
                                  <td style={{ padding: '10px', verticalAlign: 'middle', color: 'var(--fg2)', fontWeight: 500 }}>
                                    {u.department || 'General'}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--fg2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      Select Target Role
                    </label>
                    <select className="form-control" value={shareTarget} onChange={e => setShareTarget(e.target.value)} required>
                      <option value="">— Choose role group —</option>
                      {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                )}

                {/* Permission */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--fg2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Assign Permission
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[
                      { val: false, icon: '👁️', label: 'View Only',      desc: 'Can only view the file'    },
                      { val: true,  icon: '⬇️', label: 'View & Download', desc: 'Can view and download'     },
                    ].map(p => (
                      <button key={String(p.val)} type="button"
                        onClick={() => setCanDownload(p.val)}
                        style={{
                          flex: 1, padding: '12px 14px', border: '1.5px solid',
                          borderColor: canDownload === p.val ? 'var(--indigo)' : 'var(--border)',
                          background: canDownload === p.val ? '#eef2ff' : '#fff',
                          borderRadius: 'var(--r-sm)', textAlign: 'left', cursor: 'pointer',
                          fontFamily: 'inherit', transition: 'all .15s ease',
                        }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{p.icon}</div>
                        <div style={{ fontSize: '.82rem', fontWeight: 700, color: canDownload === p.val ? 'var(--indigo)' : 'var(--fg2)' }}>{p.label}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--fg4)', marginTop: 2 }}>{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="mgr-btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
                    {submitting ? '⏳ Sharing…' : '🔗 Share File'}
                  </button>
                  <button type="button" onClick={() => navigate('/manager/shared-files')} style={{
                    padding: '9px 18px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)',
                    background: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.875rem',
                  }}>
                    View Shared →
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Info Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* How it works */}
            <div className="mgr-card">
              <h3 style={{ fontSize: '.85rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 14 }}>🔐 How Sharing Works</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: '1️⃣', text: 'Select the file you want to share' },
                  { icon: '2️⃣', text: 'Search and select specific users from the list' },
                  { icon: '3️⃣', text: 'Set the permission level (View or Download)' },
                  { icon: '4️⃣', text: 'Click Share — recipients get immediate access' },
                ].map(s => (
                  <div key={s.icon} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{s.icon}</span>
                    <span style={{ fontSize: '.82rem', color: 'var(--fg3)', lineHeight: 1.5 }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Permission guide */}
            <div className="mgr-card">
              <h3 style={{ fontSize: '.85rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 14 }}>📋 Permission Guide</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#2563eb' }}>👁️ View Only</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--fg3)', marginTop: 3 }}>Recipient can see the file but not download it. Best for sensitive documents.</div>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#059669' }}>⬇️ View & Download</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--fg3)', marginTop: 3 }}>Recipient can view and save a copy. Best for files they need to work with.</div>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="mgr-card">
              <h3 style={{ fontSize: '.85rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 12 }}>⚡ Quick Links</h3>
              {[
                { to: '/manager/shared-files', icon: '📤', label: 'View Shared Files' },
                { to: '/manager/my-files',     icon: '📁', label: 'My Files'          },
                { to: '/manager/file-status',  icon: '📊', label: 'File Status'        },
              ].map(l => (
                <a key={l.to} href={l.to} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                  borderRadius: 'var(--r-sm)', color: 'var(--fg2)', fontSize: '.82rem',
                  fontWeight: 600, marginBottom: 4, transition: 'var(--t)',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-soft2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>{l.icon}</span><span>{l.label}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--fg4)' }}>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
