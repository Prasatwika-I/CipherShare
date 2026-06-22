import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { getManagerUsers, getManagerMyFiles, shareFile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* ── Helpers ─────────────────────────────────────────────── */
function fileIcon(name = '') {
  if (!name) name = '';
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf')                            return { icon: '📕', color: '#dc2626', bg: '#fef2f2' };
  if (['doc','docx'].includes(ext))             return { icon: '📘', color: '#2563eb', bg: '#eff6ff' };
  if (['xls','xlsx','csv'].includes(ext))       return { icon: '📗', color: '#059669', bg: '#f0fdf4' };
  if (['ppt','pptx'].includes(ext))             return { icon: '📙', color: '#d97706', bg: '#fffbeb' };
  if (['jpg','jpeg','png','gif','svg','webp'].includes(ext)) return { icon: '🖼️', color: '#7c3aed', bg: '#f5f3ff' };
  if (['zip','rar','7z'].includes(ext))         return { icon: '📦', color: '#6b7280', bg: '#f9fafb' };
  return { icon: '📄', color: '#6b7280', bg: '#f9fafb' };
}

export default function ManagerUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // File sharing selections
  const [selectedFileId, setSelectedFileId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [canDownload, setCanDownload] = useState(false); // false = View, true = Download
  
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3800);
  };

  useEffect(() => {
    Promise.all([
      getManagerUsers(),
      getManagerMyFiles()
    ]).then(([usersR, filesR]) => {
      setUsers(usersR.data?.users || []);
      const fileList = filesR.data?.files || [];
      setFiles(fileList);
      if (fileList.length > 0) {
        setSelectedFileId(fileList[0].fileId);
      }
    }).catch(err => {
      setError('Failed to load users or files data.');
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const activeUsers = users.filter(u => u.uid !== user?.uid);

  // Search filter
  const filteredUsers = activeUsers.filter(u => {
    const term = search.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term)
    );
  });

  const handleToggleUser = (uid) => {
    setSelectedUserIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all filtered users
      const allFilteredUids = filteredUsers.map(u => u.uid);
      setSelectedUserIds(prev => Array.from(new Set([...prev, ...allFilteredUids])));
    } else {
      // Unselect all filtered users
      const allFilteredUids = filteredUsers.map(u => u.uid);
      setSelectedUserIds(prev => prev.filter(id => !allFilteredUids.includes(id)));
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFileId) {
      setError('Please upload or select a file first.');
      return;
    }
    if (selectedUserIds.length === 0) {
      setError('Please select at least one user from the list to share with.');
      return;
    }

    setSharing(true);
    setError('');
    
    try {
      const uidsString = selectedUserIds.join(',');
      const fileObj = files.find(f => f.fileId === selectedFileId);

      await shareFile({
        fileId: selectedFileId,
        sharedWithId: uidsString,
        sharedWithType: 'user',
        sharedWithName: `${selectedUserIds.length} User(s)`,
        canDownload: canDownload.toString(),
      });

      showToast(`✅ Successfully shared "${fileObj?.fileName}" with ${selectedUserIds.length} user(s)!`);
      setSelectedUserIds([]);
      setError('');
    } catch (err) {
      setError('Sharing failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSharing(false);
    }
  };

  const selectedFileObj = files.find(f => f.fileId === selectedFileId);
  const selFi = selectedFileObj ? fileIcon(selectedFileObj.fileName) : null;

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
            <h1 className="mgr-page-title">Users</h1>
            <p className="mgr-page-sub">Browse registered users and select recipients to share files</p>
          </div>
          <button className="mgr-btn-primary" onClick={() => navigate('/manager/shared-files')} style={{ background: '#fff', border: '1.5px solid var(--border)', color: 'var(--fg)' }}>
            ⚙️ Manage Shared Access
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* Left panel: Users list */}
          <div className="mgr-card">
            <h2 className="mgr-card-title" style={{ marginBottom: 4 }}>👥 Registered Users</h2>
            <p className="mgr-card-sub" style={{ marginBottom: 20 }}>Search and select one or more users for secure file sharing</p>

            {/* Search Input */}
            <div className="mgr-filter-bar" style={{ marginBottom: 16, padding: 0, border: 'none' }}>
              <div className="mgr-search-wrap" style={{ flex: 1 }}>
                <span className="mgr-search-icon">🔍</span>
                <input
                  className="mgr-search"
                  placeholder="Search users by name or email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <div className="loading-spinner" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="mgr-empty">
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>👥</div>
                <p className="mgr-empty-title">No users found</p>
                <p className="mgr-empty-sub">Try searching using a different name or email.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="mgr-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.uid))}
                        />
                      </th>
                      <th>Name</th>
                      <th>Email</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => {
                      const isSelected = selectedUserIds.includes(u.uid);
                      return (
                        <tr key={u.uid} style={{ background: isSelected ? '#f5f3ff' : 'transparent', transition: 'background .15s' }}>
                          <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleUser(u.uid)}
                            />
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: u.active ? '#eef2ff' : '#fffbeb',
                                color: u.active ? 'var(--indigo)' : '#d97706',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '.8rem',
                              }}>
                                {u.name ? u.name[0].toUpperCase() : 'U'}
                              </div>
                              <div style={{ fontWeight: 600, color: 'var(--fg)' }}>{u.name}</div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--fg3)', fontSize: '.85rem' }}>{u.email}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-flex', padding: '3px 10px', borderRadius: 100, fontSize: '.7rem', fontWeight: 700,
                              background: u.active ? '#f0fdf4' : '#fffbeb',
                              color: u.active ? '#059669' : '#d97706',
                              border: `1px solid ${u.active ? '#bbf7d0' : '#fde68a'}`
                            }}>
                              {u.active ? 'Active' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right panel: File sharing integration */}
          <div className="mgr-card">
            <h2 className="mgr-card-title" style={{ marginBottom: 4 }}>🔗 Share File</h2>
            <p className="mgr-card-sub" style={{ marginBottom: 20 }}>Select file and grant permission to selected users</p>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: '.85rem', marginBottom: 16, border: '1px solid #fecaca' }}>
                ❌ {error}
              </div>
            )}

            <form onSubmit={handleShareSubmit}>
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
                {files.length === 0 ? (
                  <div style={{ padding: '12px', border: '1.5px dashed var(--border)', borderRadius: 8, textAlign: 'center', fontSize: '.82rem', color: 'var(--fg4)' }}>
                    No files available. <a href="/manager/upload-file" style={{ color: 'var(--indigo)', fontWeight: 600 }}>Upload a file first →</a>
                  </div>
                ) : (
                  <select className="form-control" value={selectedFileId} onChange={e => setSelectedFileId(e.target.value)} required>
                    {files.map(f => (
                      <option key={f.fileId} value={f.fileId}>{f.fileName}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selection Count Summary */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--fg2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Recipients
                </label>
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: selectedUserIds.length > 0 ? '#eef2ff' : 'var(--bg-soft)',
                  border: `1.5px solid ${selectedUserIds.length > 0 ? 'var(--indigo-border)' : 'var(--border)'}`,
                  fontSize: '.82rem', fontWeight: 600, color: selectedUserIds.length > 0 ? 'var(--indigo)' : 'var(--fg3)',
                }}>
                  👥 {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
                </div>
              </div>

              {/* Permission Level Selector */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--fg2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Permission
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { val: false, icon: '👁️', label: 'View Only', desc: 'Allow online viewing only' },
                    { val: true,  icon: '⬇️', label: 'View & Download', desc: 'Allow viewing and saving local copy' }
                  ].map(p => (
                    <button
                      key={String(p.val)}
                      type="button"
                      onClick={() => setCanDownload(p.val)}
                      style={{
                        padding: '10px 12px', border: '1.5px solid',
                        borderColor: canDownload === p.val ? 'var(--indigo)' : 'var(--border)',
                        background: canDownload === p.val ? '#eef2ff' : '#fff',
                        borderRadius: 'var(--r-sm)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s'
                      }}
                    >
                      <input
                        type="radio"
                        checked={canDownload === p.val}
                        onChange={() => setCanDownload(p.val)}
                        style={{ pointerEvents: 'none' }}
                      />
                      <div style={{ fontSize: '1.1rem' }}>{p.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--fg)' }}>{p.label}</div>
                        <div style={{ fontSize: '.7rem', color: 'var(--fg4)' }}>{p.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Share File Button */}
              <button
                type="submit"
                className="mgr-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={sharing || selectedUserIds.length === 0 || files.length === 0}
              >
                {sharing ? '⏳ Sharing…' : '🔗 Share File'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
