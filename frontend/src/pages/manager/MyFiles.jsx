import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import {
  getManagerMyFiles, getManagerShareData,
  deleteFile, shareFile, downloadFileUrl,
} from '../../services/api';
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
  if (['txt','md'].includes(ext))               return { icon: '📝', color: '#4f46e5', bg: '#eef2ff' };
  return { icon: '📄', color: '#6b7280', bg: '#f9fafb' };
}
function fmtSize(b = 0) {
  if (!b) return '—';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}
function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ── Status Badge ────────────────────────────────────────── */
const STATUS_STYLES = {
  active:  { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0', icon: '✅', label: 'Active'  },
  shared:  { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: '📤', label: 'Shared'  },
  pending: { bg: '#fffbeb', color: '#d97706', border: '#fde68a', icon: '⏳', label: 'Pending' },
  deleted: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: '❌', label: 'Deleted' },
};
function StatusBadge({ status = 'active' }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.active;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 100,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: '.72rem', fontWeight: 700,
    }}>
      {s.icon} {s.label}
    </span>
  );
}

/* ── Share Modal ─────────────────────────────────────────── */
function ShareModal({ file, users = [], onClose, onSuccess }) {
  const { user } = useAuth();
  const [shareType, setShareType]     = useState('user');
  const [shareTarget, setShareTarget] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [userSearch, setUserSearch]   = useState('');
  const [canDownload, setCanDownload] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  const activeUsers = (users || []).filter(u => u.uid !== user?.uid);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (shareType === 'user' && selectedUserIds.length === 0) {
      setError('Please select at least one user.');
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
          fileId: file.fileId,
          sharedWithId: uidsString,
          sharedWithType: 'user',
          sharedWithName: `${selectedUserIds.length} User(s)`,
          canDownload: canDownload.toString(),
        });
        onSuccess(file.fileName, `${selectedUserIds.length} user(s)`);
      } else {
        const chosenRole = roleOptions.find(r => r.value === shareTarget);
        await shareFile({
          fileId: file.fileId,
          sharedWithId: shareTarget,
          sharedWithType: 'role',
          sharedWithName: chosenRole?.name || shareTarget,
          canDownload: canDownload.toString(),
        });
        onSuccess(file.fileName, chosenRole?.name);
      }
    } catch (e) {
      setError('Sharing failed: ' + (e.response?.data?.error || e.message));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mgr-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mgr-modal" style={{ maxWidth: 500 }}>
        <div className="mgr-modal-header">
          <div>
            <h2 className="mgr-modal-title">🔗 Share File</h2>
            <p className="mgr-modal-sub" style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.fileName}
            </p>
          </div>
          <button className="mgr-modal-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: '.85rem', marginBottom: 16, border: '1px solid #fecaca' }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Share type tabs */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--fg2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Share With
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[['user', '👥 Users List'], ['role', '🏷️ By Role']].map(([t, label]) => (
                <button key={t} type="button"
                  onClick={() => { setShareType(t); setError(''); }}
                  style={{
                    flex: 1, padding: '8px 12px', border: '1.5px solid',
                    borderColor: shareType === t ? 'var(--indigo)' : 'var(--border)',
                    background: shareType === t ? '#eef2ff' : '#fff',
                    color: shareType === t ? 'var(--indigo)' : 'var(--fg3)',
                    borderRadius: 'var(--r-sm)', fontWeight: 600, fontSize: '.8rem',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s ease',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Target input */}
          {shareType === 'user' ? (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--fg2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Select Users ({selectedUserIds.length} selected)
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search users by name, email, department..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <div style={{
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--r-sm)',
                maxHeight: '180px',
                overflowY: 'auto',
                background: '#fff',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
                  <thead style={{ background: 'var(--bg-soft)', position: 'sticky', top: 0, zIndex: 1, borderBottom: '1.5px solid var(--border)' }}>
                    <tr>
                      <th style={{ padding: '6px 8px', textAlign: 'left', width: '30px' }}>
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.uid))}
                        />
                      </th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700 }}>Name / Email</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700 }}>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--fg4)' }}>
                          No users found.
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
                              cursor: 'pointer',
                            }}
                            onClick={() => handleToggleUser(u.uid)}
                          >
                            <td style={{ padding: '8px', verticalAlign: 'middle' }} onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleUser(u.uid)}
                              />
                            </td>
                            <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                              <div style={{ fontWeight: 600 }}>{u.name}</div>
                              <div style={{ fontSize: '.7rem', color: 'var(--fg4)' }}>{u.email}</div>
                            </td>
                            <td style={{ padding: '8px', verticalAlign: 'middle', color: 'var(--fg2)' }}>
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
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--fg2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Select Role Group
              </label>
              <select className="form-control" value={shareTarget} onChange={e => setShareTarget(e.target.value)} required>
                <option value="">— Choose role group —</option>
                {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}

          {/* Permission */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--fg2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Permission
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { val: false, icon: '👁️', label: 'View Only',      desc: 'Can only view the file'    },
                { val: true,  icon: '⬇️', label: 'View & Download', desc: 'Can view and download'     },
              ].map(p => (
                <button key={String(p.val)} type="button"
                  onClick={() => setCanDownload(p.val)}
                  style={{
                    flex: 1, padding: '10px 12px', border: '1.5px solid',
                    borderColor: canDownload === p.val ? 'var(--indigo)' : 'var(--border)',
                    background: canDownload === p.val ? '#eef2ff' : '#fff',
                    borderRadius: 'var(--r-sm)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all .15s ease',
                  }}>
                  <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{p.icon}</div>
                  <div style={{ fontSize: '.8rem', fontWeight: 700, color: canDownload === p.val ? 'var(--indigo)' : 'var(--fg2)' }}>{p.label}</div>
                  <div style={{ fontSize: '.68rem', color: 'var(--fg4)', marginTop: 2 }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="mgr-btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
              {submitting ? '⏳ Sharing…' : '🔗 Share File'}
            </button>
            <button type="button" onClick={onClose} style={{
              padding: '9px 18px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)',
              background: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.875rem',
            }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Upload Modal ────────────────────────────────────────── */
function UploadModal({ onClose, onSuccess }) {
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState('');
  const fileRef = useRef();
  const { uploadFile: upload } = { uploadFile: require('../../services/api').uploadFile };

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) { setError('File exceeds 50 MB limit.'); return; }
    setFile(f); setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setProgress(0); setError('');
    const interval = setInterval(() => setProgress(p => Math.min(p + 12, 88)), 180);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { uploadFile: apiUpload } = await import('../../services/api');
      const response = await apiUpload(fd);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => { onSuccess(response.data); }, 500);
    } catch (e) {
      clearInterval(interval);
      setError(e.response?.data?.error || 'Upload failed. Please try again.');
    } finally { setUploading(false); }
  };

  const fi = file ? fileIcon(file.name) : null;

  return (
    <div className="mgr-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mgr-modal">
        <div className="mgr-modal-header">
          <div>
            <h2 className="mgr-modal-title">⬆️ Upload File</h2>
            <p className="mgr-modal-sub">Drag & drop or browse to upload</p>
          </div>
          <button className="mgr-modal-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: '.85rem', marginBottom: 16, border: '1px solid #fecaca' }}>
            ❌ {error}
          </div>
        )}

        {!file ? (
          <div
            className={`mgr-upload-zone${dragging ? ' dragging' : ''}`}
            onClick={() => fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <div className="mgr-upload-icon">{dragging ? '📂' : '⬆️'}</div>
            <div className="mgr-upload-title">{dragging ? 'Drop it here!' : 'Drop files here or click to browse'}</div>
            <div className="mgr-upload-sub">PDF, Word, Excel, Images, ZIP — Max 50 MB</div>
            <input ref={fileRef} type="file" style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.txt,.csv"
              onChange={e => handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div className="mgr-file-preview">
            <div className="mgr-file-icon" style={{ background: fi.bg, color: fi.color, width: 50, height: 50, fontSize: '1.4rem' }}>
              {fi.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--fg4)', marginTop: 3 }}>{fmtSize(file.size)}</div>
            </div>
            <button onClick={() => setFile(null)} style={{ border: 'none', background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer', fontSize: '.8rem' }}>
              ✕ Remove
            </button>
          </div>
        )}

        {uploading && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: 'var(--fg3)', marginBottom: 6 }}>
              <span>Uploading…</span><span>{progress}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 100, background: '#e5e7eb', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 100,
                background: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
                width: `${progress}%`, transition: 'width .2s ease',
              }} />
            </div>
          </div>
        )}
        {progress === 100 && !uploading && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#f0fdf4', color: '#059669', fontSize: '.85rem', fontWeight: 600, border: '1px solid #bbf7d0' }}>
            ✅ Upload complete!
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="mgr-btn-primary" style={{ flex: 1, justifyContent: 'center' }}
            disabled={!file || uploading} onClick={handleUpload}>
            {uploading ? '⏳ Uploading…' : '⬆️ Upload File'}
          </button>
          <button onClick={onClose} style={{
            padding: '9px 18px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)',
            background: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.875rem',
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */
export default function MyFiles() {
  const [files, setFiles]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast]       = useState({ msg: '', type: 'success' });
  const [view, setView]         = useState('table');
  const [shareFile, setShareFile] = useState(null);   // file object to share
  const [showUpload, setShowUpload] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3200);
  };

  useEffect(() => {
    Promise.all([
      getManagerMyFiles(),
      getManagerShareData().catch(() => ({ data: { users: [] } })),
    ]).then(([filesR, shareR]) => {
      setFiles(filesR.data?.files || []);
      setUsers(shareR.data?.users || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`Delete "${fileName}"? This cannot be undone.`)) return;
    setDeleting(fileId);
    try {
      await deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.fileId !== fileId));
      showToast(`🗑️ "${fileName}" deleted.`);
    } catch { showToast('❌ Delete failed.', 'error'); }
    finally { setDeleting(null); }
  };

  const handleUploadSuccess = (uploadedFile) => {
    const newFile = {
      fileId: uploadedFile.fileId,
      fileName: uploadedFile.fileName,
      fileSize: uploadedFile.fileSize,
      uploadedAt: uploadedFile.uploadedAt || new Date().toISOString(),
      fileType: uploadedFile.fileType,
      downloadUrl: uploadedFile.downloadUrl,
      status: uploadedFile.status || 'active',
    };
    setFiles(prev => [newFile, ...prev]);
    setShowUpload(false);
    showToast(`✅ "${newFile.fileName}" uploaded successfully!`);
  };

  const handleShareSuccess = (fileName, recipient) => {
    // Update file status to 'shared' in local state
    setFiles(prev => prev.map(f =>
      f.fileName === fileName ? { ...f, status: 'shared' } : f
    ));
    setShareFile(null);
    showToast(`✅ "${fileName}" shared with ${recipient || 'recipient'}!`);
  };

  // Derive file type filter options
  const types = ['all', ...new Set(files.map(f => (f.fileName?.split('.').pop() || 'file').toLowerCase()))];
  const filtered = files.filter(f => {
    const matchSearch = (f.fileName || '').toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === 'all' || (f.fileName || '').toLowerCase().endsWith(typeFilter);
    return matchSearch && matchType;
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content mgr-main">

        {/* Modals */}
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={handleUploadSuccess} />}
        {shareFile && (
          <ShareModal
            file={shareFile}
            users={users}
            onClose={() => setShareFile(null)}
            onSuccess={handleShareSuccess}
          />
        )}

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
            <h1 className="mgr-page-title">My Files</h1>
            <p className="mgr-page-sub">All your uploaded files in one place — {files.length} file{files.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="mgr-btn-primary" onClick={() => setShowUpload(true)}>
              ⬆️ Upload File
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mgr-filter-bar">
          <div className="mgr-search-wrap">
            <span className="mgr-search-icon">🔍</span>
            <input
              className="mgr-search"
              placeholder="Search files…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="mgr-type-filters">
            {types.slice(0, 7).map(t => (
              <button key={t}
                className={`mgr-filter-pill${typeFilter === t ? ' active' : ''}`}
                onClick={() => setTypeFilter(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`mgr-view-btn${view === 'table' ? ' active' : ''}`} onClick={() => setView('table')} title="Table view">≡</button>
            <button className={`mgr-view-btn${view === 'grid' ? ' active' : ''}`} onClick={() => setView('grid')} title="Grid view">⊞</button>
          </div>
        </div>

        <div className="mgr-card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div className="loading-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="mgr-empty">
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>📂</div>
              <p className="mgr-empty-title">{search ? 'No files match your search' : 'No files uploaded yet'}</p>
              <p className="mgr-empty-sub">
                {search ? 'Try a different search term.' : 'Upload your first file to get started.'}
              </p>
              {!search && (
                <button className="mgr-btn-primary" style={{ marginTop: 16 }} onClick={() => setShowUpload(true)}>
                  ⬆️ Upload Your First File
                </button>
              )}
            </div>
          ) : view === 'table' ? (
            <div className="table-container">
              <table className="mgr-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Upload Date</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(f => {
                    const fi = fileIcon(f.fileName);
                    const ext = (f.fileName?.split('.').pop() || '').toUpperCase();
                    const isDeleting = deleting === f.fileId;
                    const fileUrl = (f.downloadUrl && f.downloadUrl.startsWith('http'))
                      ? f.downloadUrl
                      : downloadFileUrl(f.fileId);
                    return (
                      <tr key={f.fileId} style={{ opacity: isDeleting ? .45 : 1, transition: 'opacity .2s' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="mgr-file-icon" style={{ background: fi.bg, color: fi.color }}>{fi.icon}</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--fg)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {f.fileName}
                              </div>
                              <div style={{ fontSize: '.7rem', color: 'var(--fg4)', marginTop: 1 }}>ID: {String(f.fileId).slice(-6)}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="mgr-ext-badge" style={{ background: fi.bg, color: fi.color }}>{ext}</span></td>
                        <td style={{ fontSize: '.8rem', color: 'var(--fg3)' }}>{fmtSize(f.fileSize)}</td>
                        <td style={{ fontSize: '.8rem', color: 'var(--fg3)' }}>{fmtDate(f.uploadedAt)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <StatusBadge status={f.status || 'active'} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                            {/* View */}
                            <a href={fileUrl} target="_blank" rel="noreferrer"
                              title="View" className="mgr-action-btn">👁️</a>
                            {/* Download */}
                            <a href={fileUrl} download={f.fileName}
                              title="Download" className="mgr-action-btn">⬇️</a>
                            {/* Share */}
                            <button title="Share" className="mgr-action-btn"
                              onClick={() => setShareFile(f)}>🔗</button>
                            {/* Delete */}
                            <button title="Delete" className="mgr-action-btn danger"
                              disabled={isDeleting}
                              onClick={() => handleDelete(f.fileId, f.fileName)}>
                              {isDeleting ? '⏳' : '🗑️'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="mgr-file-grid">
              {filtered.map(f => {
                const fi = fileIcon(f.fileName);
                const ext = (f.fileName?.split('.').pop() || '').toUpperCase();
                const fileUrl = (f.downloadUrl && f.downloadUrl.startsWith('http'))
                  ? f.downloadUrl
                  : downloadFileUrl(f.fileId);
                return (
                  <div key={f.fileId} className="mgr-file-grid-card">
                    <div className="mgr-fgc-icon" style={{ background: fi.bg }}>
                      <span style={{ fontSize: '2.2rem' }}>{fi.icon}</span>
                    </div>
                    <div className="mgr-fgc-ext" style={{ background: fi.bg, color: fi.color }}>{ext}</div>
                    <div className="mgr-fgc-name" title={f.fileName}>{f.fileName}</div>
                    <div className="mgr-fgc-meta">{fmtSize(f.fileSize)} · {fmtDate(f.uploadedAt)}</div>
                    <div style={{ marginTop: 6 }}><StatusBadge status={f.status || 'active'} /></div>
                    <div className="mgr-fgc-actions">
                      <a href={fileUrl} target="_blank" rel="noreferrer"
                        className="mgr-action-btn" title="View">👁️</a>
                      <a href={fileUrl} download={f.fileName}
                        className="mgr-action-btn" title="Download">⬇️</a>
                      <button className="mgr-action-btn" title="Share"
                        onClick={() => setShareFile(f)}>🔗</button>
                      <button className="mgr-action-btn danger" title="Delete"
                        disabled={deleting === f.fileId}
                        onClick={() => handleDelete(f.fileId, f.fileName)}>
                        {deleting === f.fileId ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
