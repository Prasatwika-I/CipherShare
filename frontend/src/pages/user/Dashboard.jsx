import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import {
  getUserDashboard, getUserNotifications, getUserDownloads,
  downloadFileUrl, recordDownload,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fileIcon(name = '', type = '') {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf' || type?.includes('pdf'))
    return { icon: '📕', color: '#dc2626', bg: '#fef2f2' };
  if (['doc','docx'].includes(ext) || type?.includes('word'))
    return { icon: '📘', color: '#2563eb', bg: '#eff6ff' };
  if (['xls','xlsx','csv'].includes(ext) || type?.includes('spreadsheet'))
    return { icon: '📗', color: '#059669', bg: '#f0fdf4' };
  if (['ppt','pptx'].includes(ext) || type?.includes('presentation'))
    return { icon: '📙', color: '#d97706', bg: '#fffbeb' };
  if (['jpg','jpeg','png','gif','svg','webp'].includes(ext) || type?.includes('image'))
    return { icon: '🖼️', color: '#7c3aed', bg: '#f5f3ff' };
  if (['zip','rar','7z'].includes(ext))
    return { icon: '📦', color: '#6b7280', bg: '#f9fafb' };
  if (['txt','md'].includes(ext))
    return { icon: '📝', color: '#4f46e5', bg: '#eef2ff' };
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
  const d = new Date(ts);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400)  return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

/* ─────────────────────────────────────────────────────────
   PERMISSION BADGE
───────────────────────────────────────────────────────── */
function PermBadge({ canDownload }) {
  return canDownload
    ? <span className="usr-perm-download">⬇️ View &amp; Download</span>
    : <span className="usr-perm-view">👁️ View Only</span>;
}

/* ─────────────────────────────────────────────────────────
   FILE DETAIL MODAL
───────────────────────────────────────────────────────── */
function FileDetailModal({ file, onClose, onDownload }) {
  if (!file) return null;
  const fi  = fileIcon(file.fileName, file.fileType);
  const ext = (file.fileName?.split('.').pop() || 'FILE').toUpperCase();
  const viewUrl = `/preview/${file.fileId}`;
  const downloadUrl = downloadFileUrl(file.fileId) + '&mode=download';

  return (
    <div className="mgr-modal-backdrop" onClick={onClose}>
      <div className="usr-detail-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="usr-detail-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
            <div className="usr-detail-file-icon" style={{ background: fi.bg }}>
              <span style={{ fontSize: '2rem' }}>{fi.icon}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div className="usr-detail-title">{file.fileName}</div>
              <div className="usr-detail-sub">
                <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 5, fontSize: '.65rem', fontWeight: 800, background: fi.bg, color: fi.color, marginRight: 8 }}>{ext}</span>
                {fmtSize(file.fileSize)}
              </div>
            </div>
          </div>
          <button className="mgr-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Meta grid */}
        <div className="usr-detail-meta-grid">
          {[
            { label: 'Shared By',    value: file.ownerName || file.sharedBy || '—' },
            { label: 'Shared Date',  value: fmtDate(file.sharedAt || file.uploadedAt) },
            { label: 'File Type',    value: ext },
            { label: 'File Size',    value: fmtSize(file.fileSize) },
            { label: 'Permission',   value: <PermBadge canDownload={file.canDownload} /> },
            { label: 'Status',       value: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '.78rem', fontWeight: 700, color: '#059669' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}/>
                  Active
                </span>
              )
            },
          ].map(({ label, value }) => (
            <div key={label} className="usr-detail-meta-item">
              <div className="usr-detail-meta-label">{label}</div>
              <div className="usr-detail-meta-value">{value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="usr-detail-actions">
          <a href={viewUrl} target="_blank" rel="noreferrer" className="usr-btn-view">
            👁️ View File
          </a>
          {file.canDownload ? (
            <a
              href={downloadUrl}
              download={file.fileName}
              className="usr-btn-download"
              onClick={() => onDownload(file.fileId)}
            >
              ⬇️ Download
            </a>
          ) : (
            <button className="usr-btn-locked" disabled>
              🔒 Download Restricted
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STORAGE RING (visual stat)
───────────────────────────────────────────────────────── */
function MiniDonut({ pct = 0, color = '#4f46e5', size = 44 }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${(Math.min(pct,100)/100)*c} ${c}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .9s ease' }} />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   NOTIFICATION ICON MAP
───────────────────────────────────────────────────────── */
function notifMeta(type = '') {
  const t = type.toLowerCase();
  if (t.includes('share') || t.includes('new'))
    return { icon: '📁', bg: '#eef2ff', color: '#4f46e5' };
  if (t.includes('permission') || t.includes('update'))
    return { icon: '🔑', bg: '#fffbeb', color: '#d97706' };
  if (t.includes('remov') || t.includes('delet') || t.includes('revok'))
    return { icon: '🗑️', bg: '#fef2f2', color: '#dc2626' };
  return { icon: '🔔', bg: '#f0fdf4', color: '#059669' };
}

/* ─────────────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────────────── */
export default function UserDashboard() {
  const { user }                  = useAuth();
  const navigate                  = useNavigate();
  const [data, setData]           = useState(null);
  const [notifs, setNotifs]       = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getUserDashboard().catch(() => ({ data: {} })),
      getUserNotifications().catch(() => ({ data: { notifications: [] } })),
      getUserDownloads().catch(() => ({ data: { downloads: [] } })),
    ]).then(([dash, notifRes, dlRes]) => {
      setData(dash.data);
      setNotifs((notifRes.data.notifications || []).slice(0, 5));
      setDownloads((dlRes.data.downloads || []).slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const handleDownload = async (fileId) => {
    try { await recordDownload(fileId); } catch { /* silent */ }
  };

  const showAccessDenied = () => {
    setAccessDenied(true);
    setTimeout(() => setAccessDenied(false), 3500);
  };

  const files         = data?.sharedFiles || [];
  const totalShared   = data?.totalShared || 0;
  const totalDL       = data?.totalDownloadable || 0;
  const totalViewOnly = data?.totalViewOnly || 0;
  const recentFiles   = files.slice(0, 6);
  const unreadNotifs  = notifs.filter(n => !n.read).length;

  // Approx storage: sum of file sizes shown
  const storageUsed   = files.reduce((s, f) => s + (f.fileSize || 0), 0);
  const storageLimitB = 1024 * 1024 * 500; // 500 MB display cap
  const storagePct    = Math.min((storageUsed / storageLimitB) * 100, 100);

  const statCards = [
    {
      icon: '📁', label: 'Files Shared With Me',
      value: totalShared, sub: 'total files accessible',
      color: '#4f46e5', bg: '#eef2ff', pct: null,
      link: '/user/shared-files',
    },
    {
      icon: '⬇️', label: 'Available Downloads',
      value: totalDL, sub: `${totalViewOnly} view-only`,
      color: '#059669', bg: '#f0fdf4', pct: null,
      link: '/user/shared-files',
    },
    {
      icon: '🕐', label: 'Recent Downloads',
      value: downloads.length, sub: 'in your history',
      color: '#d97706', bg: '#fffbeb', pct: null,
      link: '/user/recent-downloads',
    },
    {
      icon: '💾', label: 'Storage Used',
      value: fmtSize(storageUsed), sub: `${storagePct.toFixed(0)}% of quota`,
      color: '#7c3aed', bg: '#f5f3ff', pct: storagePct,
      link: null,
    },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content mgr-main">

        {/* ── Access Denied Toast ── */}
        {accessDenied && (
          <div className="usr-access-denied">
            🚫 Access Denied — you don't have download permission for this file.
          </div>
        )}

        {/* ── Welcome Banner ── */}
        <div className="mgr-banner" style={{ marginBottom: 28 }}>
          <div className="mgr-banner-left">
            <div className="mgr-banner-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div>
              <div className="mgr-banner-greeting">
                Good {getGreeting()}, {user?.name?.split(' ')[0] || 'User'} 👋
              </div>
              <h1 className="mgr-banner-title">My Dashboard</h1>
              <div className="mgr-banner-sub">
                <span className="mgr-role-pill" style={{ background: '#f0fdf4', color: '#059669', borderColor: '#bbf7d0' }}>
                  👤 User
                </span>
                Files shared with you appear here
                {unreadNotifs > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', borderRadius: 100, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '.7rem', fontWeight: 700 }}>
                    🔔 {unreadNotifs} new notification{unreadNotifs > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mgr-banner-actions">
            <Link to="/user/shared-files" className="mgr-btn-primary">
              📁 View All Files
            </Link>
            <Link to="/user/notifications" className="mgr-btn-outline">
              🔔 Notifications
              {unreadNotifs > 0 && <span className="usr-notif-dot" />}
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
            <div className="loading-spinner" />
          </div>
        ) : (<>

          {/* ── Stat Cards ── */}
          <div className="usr-stats-grid">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="mgr-stat-card"
                style={{ '--ms-color': s.color, cursor: s.link ? 'pointer' : 'default' }}
                onClick={() => s.link && navigate(s.link)}
              >
                <div className="mgr-stat-top">
                  <div className="mgr-stat-icon" style={{ background: s.bg }}>
                    <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
                  </div>
                  {s.pct !== null && (
                    <MiniDonut pct={s.pct} color={s.color} size={44} />
                  )}
                </div>
                <div className="mgr-stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="mgr-stat-label">{s.label}</div>
                <div className="mgr-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Middle Grid: Recent Files + Notifications ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 28 }}>

            {/* Recent Files */}
            <div className="mgr-card">
              <div className="mgr-card-header">
                <div>
                  <div className="mgr-card-title">📁 Recent Shared Files</div>
                  <div className="mgr-card-sub">{totalShared} file{totalShared !== 1 ? 's' : ''} shared with you</div>
                </div>
                <Link to="/user/shared-files" className="mgr-btn-sm-outline">
                  View All →
                </Link>
              </div>

              {recentFiles.length === 0 ? (
                <div className="mgr-empty sm">
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
                  <p className="mgr-empty-title">No files shared yet</p>
                  <p className="mgr-empty-sub">When a manager shares files with you, they'll appear here.</p>
                  <button
                    className="mgr-btn-sm-outline"
                    style={{ marginTop: 16 }}
                    onClick={() => setRefreshKey(k => k + 1)}
                  >
                    🔄 Refresh
                  </button>
                </div>
              ) : (
                <div className="usr-dl-list">
                  {recentFiles.map((f, i) => {
                    const fi  = fileIcon(f.fileName, f.fileType);
                    const ext = (f.fileName?.split('.').pop() || '').toUpperCase();
                    return (
                      <div
                        key={f.fileId || i}
                        className="usr-dl-item"
                        style={{ cursor: 'pointer', padding: '10px 0' }}
                        onClick={() => setSelectedFile(f)}
                      >
                        <div
                          className="mgr-file-icon"
                          style={{ background: fi.bg, color: fi.color, flexShrink: 0 }}
                        >
                          {fi.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.fileName}
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 2, alignItems: 'center' }}>
                            <span className="mgr-ext-badge" style={{ background: fi.bg, color: fi.color }}>{ext}</span>
                            <span style={{ fontSize: '.72rem', color: 'var(--fg4)' }}>
                              {f.ownerName || f.sharedBy || 'Manager'}
                            </span>
                            <span style={{ fontSize: '.72rem', color: 'var(--fg4)' }}>
                              · {fmtDate(f.sharedAt || f.uploadedAt)}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                          <PermBadge canDownload={f.canDownload} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right column: Notifications preview + Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Notifications Preview */}
              <div className="mgr-card" style={{ flex: 1 }}>
                <div className="mgr-card-header">
                  <div>
                    <div className="mgr-card-title">
                      🔔 Notifications
                      {unreadNotifs > 0 && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 18, height: 18, borderRadius: '50%',
                          background: '#dc2626', color: '#fff',
                          fontSize: '.6rem', fontWeight: 900, marginLeft: 7,
                        }}>
                          {unreadNotifs}
                        </span>
                      )}
                    </div>
                    <div className="mgr-card-sub">Recent activity</div>
                  </div>
                  <Link to="/user/notifications" className="mgr-btn-sm-outline">
                    See all →
                  </Link>
                </div>

                {notifs.length === 0 ? (
                  <div className="mgr-empty sm">
                    <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔕</div>
                    <p className="mgr-empty-sub">No notifications yet</p>
                  </div>
                ) : (
                  <div className="usr-notif-list">
                    {notifs.map((n, i) => {
                      const nm = notifMeta(n.type);
                      return (
                        <div key={n.id || i} className={`usr-notif-item${!n.read ? ' unread' : ''}`}>
                          <div className="usr-notif-icon-wrap" style={{ background: nm.bg }}>
                            <span style={{ fontSize: '.95rem' }}>{nm.icon}</span>
                          </div>
                          <div className="usr-notif-body">
                            <div className="usr-notif-msg">{n.message}</div>
                            <div className="usr-notif-time">{fmtDate(n.createdAt)}</div>
                          </div>
                          {!n.read && <div className="usr-notif-unread-dot" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mgr-card">
                <div className="mgr-card-title" style={{ marginBottom: 14 }}>⚡ Quick Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { icon: '📁', label: 'Browse All Files', sub: 'View files shared with you', to: '/user/shared-files', color: '#4f46e5' },
                    { icon: '⬇️', label: 'Download History', sub: 'Your recent downloads', to: '/user/recent-downloads', color: '#059669' },
                    { icon: '🔔', label: 'Notifications', sub: 'View all alerts', to: '/user/notifications', color: '#d97706' },
                    { icon: '👤', label: 'My Profile', sub: 'Update account info', to: '/user/profile', color: '#7c3aed' },
                  ].map(qa => (
                    <Link
                      key={qa.to}
                      to={qa.to}
                      className="qa-item"
                      style={{ '--qc': qa.color }}
                    >
                      <div className="qa-icon-wrap" style={{ background: qa.color + '18', color: qa.color }}>
                        {qa.icon}
                      </div>
                      <div className="qa-label">
                        <div style={{ fontWeight: 600, fontSize: '.82rem', color: 'var(--fg)' }}>{qa.label}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--fg4)' }}>{qa.sub}</div>
                      </div>
                      <span className="qa-arrow">›</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Recent Downloads Row ── */}
          {downloads.length > 0 && (
            <div className="mgr-card" style={{ marginBottom: 28 }}>
              <div className="mgr-card-header">
                <div>
                  <div className="mgr-card-title">⬇️ Recent Downloads</div>
                  <div className="mgr-card-sub">Your last {downloads.length} downloaded files</div>
                </div>
                <Link to="/user/recent-downloads" className="mgr-btn-sm-outline">
                  Full History →
                </Link>
              </div>
              <div className="usr-dl-list">
                {downloads.map((dl, i) => {
                  const fi = fileIcon(dl.fileName, dl.fileType);
                  return (
                    <div key={dl.fileId || i} className="usr-dl-item">
                      <div className="mgr-file-icon" style={{ background: fi.bg, color: fi.color, flexShrink: 0 }}>
                        {fi.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dl.fileName || 'Unknown File'}
                        </div>
                        <div style={{ fontSize: '.72rem', color: 'var(--fg4)', marginTop: 2 }}>
                          Shared by {dl.sharedBy || dl.ownerName || 'Manager'}
                        </div>
                      </div>
                      <div style={{ fontSize: '.78rem', color: 'var(--fg3)', whiteSpace: 'nowrap' }}>
                        {fmtDate(dl.downloadedAt || dl.timestamp)}
                      </div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 100,
                        background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0',
                        fontSize: '.68rem', fontWeight: 700,
                      }}>
                        ✅ Downloaded
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Sharing History / Activity ── */}
          <div className="mgr-card">
            <div className="mgr-card-header">
              <div>
                <div className="mgr-card-title">📋 Sharing History</div>
                <div className="mgr-card-sub">Files shared with you over time</div>
              </div>
            </div>
            {files.length === 0 ? (
              <div className="mgr-empty sm">
                <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📭</div>
                <p className="mgr-empty-title">No files have been shared with you yet.</p>
                <p className="mgr-empty-sub" style={{ marginBottom: 16 }}>
                  When a manager shares a file with you, it will appear here automatically.
                </p>
                <button
                  className="mgr-btn-sm-outline"
                  onClick={() => setRefreshKey(k => k + 1)}
                >
                  🔄 Refresh
                </button>
              </div>
            ) : (
              <div>
                {files.map((f, i) => {
                  const fi = fileIcon(f.fileName, f.fileType);
                  return (
                    <div key={f.fileId || i} className="usr-history-row">
                      <div className="mgr-file-icon sm" style={{ background: fi.bg, color: fi.color }}>
                        {fi.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: '.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {f.fileName}
                        </span>
                        <span style={{ fontSize: '.72rem', color: 'var(--fg4)' }}>
                          Shared by {f.ownerName || f.sharedBy || 'Manager'}
                        </span>
                      </div>
                      <div style={{ fontSize: '.78rem', color: 'var(--fg3)', whiteSpace: 'nowrap', marginRight: 12 }}>
                        {fmtDate(f.sharedAt || f.uploadedAt)}
                      </div>
                      <PermBadge canDownload={f.canDownload} />
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          className="mgr-action-btn"
                          title="View details"
                          onClick={() => setSelectedFile(f)}
                        >
                          👁️
                        </button>
                        {f.canDownload ? (
                          <a
                            href={downloadFileUrl(f.fileId) + '&mode=download'}
                            download={f.fileName}
                            className="mgr-action-btn"
                            title="Download"
                            onClick={() => handleDownload(f.fileId)}
                            style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
                          >
                            ⬇️
                          </a>
                        ) : (
                          <button
                            className="mgr-action-btn"
                            title="Download not permitted"
                            style={{ opacity: .35, cursor: 'not-allowed' }}
                            onClick={showAccessDenied}
                          >
                            🔒
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </>)}

        {/* ── File Detail Modal ── */}
        {selectedFile && (
          <FileDetailModal
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
            onDownload={handleDownload}
          />
        )}
      </main>
    </div>
  );
}
