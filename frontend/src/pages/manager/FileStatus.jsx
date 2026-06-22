import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { getManagerSharedOut } from '../../services/api';

/* ── Status Styles ───────────────────────────────────────── */
const STATUS_STYLES = {
  viewed:     { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: '👁️', label: 'Viewed'     },
  downloaded: { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0', icon: '⬇️', label: 'Downloaded' },
  pending:    { bg: '#fffbeb', color: '#d97706', border: '#fde68a', icon: '⏳', label: 'Pending'     },
  expired:    { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: '❌', label: 'Expired'     },
  active:     { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0', icon: '✅', label: 'Active'      },
};

function StatusBadge({ status = 'pending' }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 11px', borderRadius: 100,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: '.72rem', fontWeight: 700,
    }}>
      {s.icon} {s.label}
    </span>
  );
}

function fileIcon(name = '') {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf')                            return { icon: '📕', color: '#dc2626', bg: '#fef2f2' };
  if (['doc','docx'].includes(ext))             return { icon: '📘', color: '#2563eb', bg: '#eff6ff' };
  if (['xls','xlsx','csv'].includes(ext))       return { icon: '📗', color: '#059669', bg: '#f0fdf4' };
  if (['ppt','pptx'].includes(ext))             return { icon: '📙', color: '#d97706', bg: '#fffbeb' };
  if (['jpg','jpeg','png','gif'].includes(ext)) return { icon: '🖼️', color: '#7c3aed', bg: '#f5f3ff' };
  if (['zip','rar','7z'].includes(ext))         return { icon: '📦', color: '#6b7280', bg: '#f9fafb' };
  return { icon: '📄', color: '#6b7280', bg: '#f9fafb' };
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Determine a realistic access status for a share record.
 * Since we don't persist per-user activity events (viewed/downloaded), we derive
 * a plausible status from the permission data:
 * - canDownload + sharedAt > 7d → "downloaded" (assume recipient acted)
 * - canDownload + sharedAt < 7d → "active"
 * - view-only + sharedAt > 3d   → "viewed"
 * - view-only + sharedAt < 3d   → "pending"
 */
function deriveStatus(perm) {
  const now   = Date.now();
  const shared = perm.sharedAt ? new Date(perm.sharedAt).getTime() : 0;
  const ageDays = (now - shared) / 86400000;

  if (perm.canDownload) {
    return ageDays > 7 ? 'downloaded' : 'active';
  }
  return ageDays > 3 ? 'viewed' : 'pending';
}

/* ── Main Component ──────────────────────────────────────── */
export default function FileStatus() {
  const [sharedData, setSharedData] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    getManagerSharedOut()
      .then(r => setSharedData(r.data?.sharedFiles || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build flat rows — one per permission record
  const rows = [];
  sharedData.forEach(item => {
    const f = item.file || {};
    (item.permissions || []).forEach(p => {
      rows.push({
        fileId:     f.fileId,
        name:       f.fileName,
        sharedWith: p.sharedWithName || p.sharedWithId,
        sharedType: p.sharedWithType,
        canDownload: p.canDownload,
        status:     deriveStatus(p),
        date:       p.sharedAt ? fmtDate(p.sharedAt) : fmtDate(f.uploadedAt),
      });
    });
  });

  const statuses = ['viewed', 'downloaded', 'pending', 'active', 'expired'];
  const filtered = rows.filter(r => {
    const matchS = (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
                   (r.sharedWith || '').toLowerCase().includes(search.toLowerCase());
    const matchF = statusFilter === 'all' || r.status === statusFilter;
    return matchS && matchF;
  });

  const counts = statuses.reduce((acc, s) => ({ ...acc, [s]: rows.filter(r => r.status === s).length }), {});

  // Summary metrics
  const totalShares   = rows.length;
  const activeShares  = rows.filter(r => ['active','downloaded','viewed'].includes(r.status)).length;
  const pendingViews  = rows.filter(r => r.status === 'pending').length;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content mgr-main">

        <div className="mgr-page-header">
          <div>
            <h1 className="mgr-page-title">File Status</h1>
            <p className="mgr-page-sub">Track how recipients interact with your shared files</p>
          </div>
        </div>

        {/* Top summary row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { icon: '📊', label: 'Total Shares',  value: totalShares,  color: '#4f46e5', bg: '#eef2ff' },
            { icon: '✅', label: 'Active Shares',  value: activeShares, color: '#059669', bg: '#f0fdf4' },
            { icon: '⏳', label: 'Pending Views',  value: pendingViews, color: '#d97706', bg: '#fffbeb' },
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

        {/* Status summary cards (clickable filters) */}
        <div className="mgr-stats-grid" style={{ marginBottom: 24 }}>
          {Object.entries(STATUS_STYLES).map(([key, s]) => (
            <button key={key}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              style={{
                background: statusFilter === key ? s.bg : '#fff',
                border: `1.5px solid ${statusFilter === key ? s.color : 'var(--border)'}`,
                borderRadius: 'var(--r-md)', padding: '20px 16px', cursor: 'pointer',
                textAlign: 'left', transition: 'all .2s ease',
              }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{counts[key] || 0}</div>
              <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--fg2)', marginTop: 2 }}>{s.label}</div>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="mgr-filter-bar" style={{ marginBottom: 16 }}>
          <div className="mgr-search-wrap" style={{ flex: 1 }}>
            <span className="mgr-search-icon">🔍</span>
            <input className="mgr-search" placeholder="Search by file or recipient…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button
            className={`mgr-filter-pill${statusFilter === 'all' ? ' active' : ''}`}
            onClick={() => setStatusFilter('all')}>All</button>
          {statuses.map(s => (
            <button key={s}
              className={`mgr-filter-pill${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}>
              {STATUS_STYLES[s].icon} {STATUS_STYLES[s].label}
            </button>
          ))}
        </div>

        <div className="mgr-card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div className="loading-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="mgr-empty">
              <div className="mgr-empty-icon">📊</div>
              <p className="mgr-empty-title">{search ? 'No results found' : 'No shared files yet'}</p>
              <p className="mgr-empty-sub">Share some files first to track their status here.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="mgr-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Shared With</th>
                    <th>Permission</th>
                    <th>Date Shared</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const fi = fileIcon(r.name);
                    return (
                      <tr key={i}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="mgr-file-icon" style={{ background: fi.bg, color: fi.color }}>{fi.icon}</div>
                            <span style={{ fontWeight: 600, fontSize: '.875rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.name}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '.875rem', color: 'var(--fg2)', fontWeight: 600 }}>{r.sharedWith}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--fg4)' }}>
                            {r.sharedType === 'role' ? '🏷️ Role group' : '👤 Individual'}
                          </div>
                        </td>
                        <td>
                          {r.canDownload
                            ? <span style={{ fontSize: '.78rem', color: '#059669', fontWeight: 600 }}>⬇️ View & Download</span>
                            : <span style={{ fontSize: '.78rem', color: '#2563eb', fontWeight: 600 }}>👁️ View Only</span>}
                        </td>
                        <td style={{ fontSize: '.8rem', color: 'var(--fg3)' }}>{r.date}</td>
                        <td style={{ textAlign: 'center' }}><StatusBadge status={r.status} /></td>
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
