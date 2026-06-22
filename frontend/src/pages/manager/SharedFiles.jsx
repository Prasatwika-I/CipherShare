import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import {
  getManagerSharedOut, updateSharePermission, revokeShareAccess, downloadFileUrl,
} from '../../services/api';

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
function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Permission Badge ────────────────────────────────────── */
function PermBadge({ canDownload }) {
  return canDownload
    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 100, background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', fontSize: '.72rem', fontWeight: 700 }}>⬇️ View & Download</span>
    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 100, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '.72rem', fontWeight: 700 }}>👁️ View Only</span>;
}

/* ── Edit Permission Modal ───────────────────────────────── */
function EditPermModal({ perm, fileName, onClose, onSave }) {
  const [canDownload, setCanDownload] = useState(perm.canDownload);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await updateSharePermission(perm.permissionId, canDownload);
      onSave(perm.permissionId, canDownload);
    } catch (e) {
      setError('Update failed: ' + (e.response?.data?.error || e.message));
    } finally { setSaving(false); }
  };

  return (
    <div className="mgr-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mgr-modal" style={{ maxWidth: 420 }}>
        <div className="mgr-modal-header">
          <div>
            <h2 className="mgr-modal-title">✏️ Edit Permission</h2>
            <p className="mgr-modal-sub" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileName} → {perm.sharedWithName}
            </p>
          </div>
          <button className="mgr-modal-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: '.85rem', marginBottom: 16, border: '1px solid #fecaca' }}>
            ❌ {error}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--fg2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Permission Level
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
                  borderRadius: 'var(--r-sm)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .15s ease',
                }}>
                <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{p.icon}</div>
                <div style={{ fontSize: '.82rem', fontWeight: 700, color: canDownload === p.val ? 'var(--indigo)' : 'var(--fg2)' }}>{p.label}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--fg4)', marginTop: 2 }}>{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="mgr-btn-primary" style={{ flex: 1, justifyContent: 'center' }}
            disabled={saving || canDownload === perm.canDownload} onClick={handleSave}>
            {saving ? '⏳ Saving…' : '✅ Save Changes'}
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
export default function ManagerSharedFiles() {
  const [sharedData, setSharedData] = useState([]);  // Array of { file, permissions[], recipientCount }
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [toast, setToast]           = useState({ msg: '', type: 'success' });
  const [editPerm, setEditPerm]     = useState(null);  // { perm, fileName }
  const [revoking, setRevoking]     = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3200);
  };

  useEffect(() => {
    getManagerSharedOut()
      .then(r => setSharedData(r.data?.sharedFiles || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build flat rows: one row per permission (recipient)
  const rows = [];
  sharedData.forEach(item => {
    const f = item.file || {};
    (item.permissions || []).forEach(p => {
      rows.push({ file: f, perm: p });
    });
  });

  const filtered = rows.filter(r =>
    (r.file?.fileName || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.perm?.sharedWithName || '').toLowerCase().includes(search.toLowerCase())
  );

  // Metrics
  const totalShared     = rows.length;
  const downloadEnabled = rows.filter(r => r.perm?.canDownload).length;
  const viewOnly        = totalShared - downloadEnabled;

  const handlePermSaved = (permissionId, canDownload) => {
    setSharedData(prev => prev.map(item => ({
      ...item,
      permissions: (item.permissions || []).map(p =>
        p.permissionId === permissionId ? { ...p, canDownload } : p
      ),
    })));
    setEditPerm(null);
    showToast('✅ Permission updated successfully!');
  };

  const handleRevoke = async (permissionId, fileName, recipientName) => {
    if (!window.confirm(`Remove ${recipientName}'s access to "${fileName}"?`)) return;
    setRevoking(permissionId);
    try {
      await revokeShareAccess(permissionId);
      setSharedData(prev => prev.map(item => ({
        ...item,
        permissions: (item.permissions || []).filter(p => p.permissionId !== permissionId),
      })).filter(item => (item.permissions || []).length > 0));
      showToast(`✅ Access revoked for ${recipientName}.`);
    } catch { showToast('❌ Revoke failed.', 'error'); }
    finally { setRevoking(null); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content mgr-main">

        {/* Edit Permission Modal */}
        {editPerm && (
          <EditPermModal
            perm={editPerm.perm}
            fileName={editPerm.fileName}
            onClose={() => setEditPerm(null)}
            onSave={handlePermSaved}
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
            <h1 className="mgr-page-title">Shared Files</h1>
            <p className="mgr-page-sub">Files you have shared with users or roles</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { icon: '📤', label: 'Total Shares',     value: totalShared,     color: '#7c3aed', bg: '#f5f3ff' },
            { icon: '⬇️', label: 'Download Enabled', value: downloadEnabled, color: '#059669', bg: '#f0fdf4' },
            { icon: '👁️', label: 'View Only',         value: viewOnly,       color: '#2563eb', bg: '#eff6ff' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', padding: '20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', background: s.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--fg3)', fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mgr-filter-bar" style={{ marginBottom: 16 }}>
          <div className="mgr-search-wrap" style={{ flex: 1 }}>
            <span className="mgr-search-icon">🔍</span>
            <input className="mgr-search" placeholder="Search by file name or recipient…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="mgr-card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div className="loading-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="mgr-empty">
              <div className="mgr-empty-icon">📤</div>
              <p className="mgr-empty-title">{search ? 'No results found' : 'No shared files yet'}</p>
              <p className="mgr-empty-sub">
                {search ? 'Try a different search term.' : 'Share a file from My Files or the Dashboard to see it here.'}
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="mgr-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Shared With</th>
                    <th style={{ textAlign: 'center' }}>Permission</th>
                    <th>Share Date</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(({ file: f, perm: p }, i) => {
                    const fi = fileIcon(f.fileName);
                    const ext = (f.fileName?.split('.').pop() || '').toUpperCase();
                    const fileUrl = (f.downloadUrl && f.downloadUrl.startsWith('http'))
                      ? f.downloadUrl
                      : downloadFileUrl(f.fileId);
                    const isRevoking = revoking === p.permissionId;

                    return (
                      <tr key={i} style={{ opacity: isRevoking ? .45 : 1, transition: 'opacity .2s' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="mgr-file-icon" style={{ background: fi.bg, color: fi.color }}>{fi.icon}</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '.875rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {f.fileName}
                              </div>
                              <span className="mgr-ext-badge" style={{ background: fi.bg, color: fi.color, fontSize: '.65rem', padding: '1px 6px' }}>{ext}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{p.sharedWithName}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--fg4)', marginTop: 1 }}>
                            {p.sharedWithType === 'role' ? '🏷️ Role group' : '👤 Individual'}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <PermBadge canDownload={p.canDownload} />
                        </td>
                        <td style={{ fontSize: '.8rem', color: 'var(--fg3)' }}>
                          {fmtDate(p.sharedAt || f.uploadedAt)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                            {/* View file */}
                            <a href={fileUrl} target="_blank" rel="noreferrer"
                              title="View file" className="mgr-action-btn">👁️</a>
                            {/* Edit permission */}
                            <button title="Edit permission" className="mgr-action-btn"
                              onClick={() => setEditPerm({ perm: p, fileName: f.fileName })}>
                              ✏️
                            </button>
                            {/* Revoke access */}
                            <button title="Remove access" className="mgr-action-btn danger"
                              disabled={isRevoking}
                              onClick={() => handleRevoke(p.permissionId, f.fileName, p.sharedWithName)}>
                              {isRevoking ? '⏳' : '🚫'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
