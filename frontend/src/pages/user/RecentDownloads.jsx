import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { getUserDownloads, downloadFileUrl } from '../../services/api';

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

function fmtDateFull(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/* ─────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────── */
function EmptyDownloads() {
  return (
    <div className="mgr-empty" style={{ padding: '80px 24px' }}>
      <div style={{ marginBottom: 20, position: 'relative', display: 'inline-block' }}>
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="55" cy="55" r="52" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2" />
          <rect x="33" y="28" width="44" height="52" rx="6" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5" />
          <line x1="55" y1="40" x2="55" y2="62" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
          <polyline points="46,54 55,64 64,54" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="44" y1="72" x2="66" y2="72" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <p className="mgr-empty-title" style={{ fontSize: '1.1rem' }}>No downloads yet</p>
      <p className="mgr-empty-sub" style={{ maxWidth: 340, lineHeight: 1.6, margin: '8px auto 0' }}>
        Files you download will appear here. Browse your shared files and start downloading to build your history.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
export default function RecentDownloads() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    getUserDownloads()
      .then(r => setDownloads(r.data.downloads || []))
      .catch(() => setDownloads([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const filtered = downloads.filter(dl =>
    (dl.fileName || '').toLowerCase().includes(search.toLowerCase()) ||
    (dl.sharedBy || dl.ownerName || '').toLowerCase().includes(search.toLowerCase())
  );

  // Group by date for timeline display
  const grouped = filtered.reduce((acc, dl) => {
    const dateKey = dl.downloadedAt
      ? new Date(dl.downloadedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : 'Unknown Date';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(dl);
    return acc;
  }, {});
  const groupEntries = Object.entries(grouped);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content mgr-main">

        {/* Page Header */}
        <div className="mgr-page-header">
          <div>
            <h1 className="mgr-page-title">⬇️ Recent Downloads</h1>
            <p className="mgr-page-sub">Your file download history</p>
          </div>
          <button
            className="mgr-btn-sm-outline"
            onClick={() => setRefreshKey(k => k + 1)}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { icon: '⬇️', label: 'Total Downloads', value: downloads.length,  color: '#059669', bg: '#f0fdf4' },
            { icon: '📅', label: 'This Week',        value: downloads.filter(d => {
                const diff = (Date.now() - new Date(d.downloadedAt)) / 1000 / 86400;
                return diff < 7;
              }).length, color: '#4f46e5', bg: '#eef2ff' },
            { icon: '📁', label: 'Unique Files',     value: new Set(downloads.map(d => d.fileId)).size, color: '#d97706', bg: '#fffbeb' },
          ].map(s => (
            <div key={s.label} className="mgr-stat-card" style={{ '--ms-color': s.color }}>
              <div className="mgr-stat-top">
                <div className="mgr-stat-icon" style={{ background: s.bg }}>
                  <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
                </div>
              </div>
              <div className="mgr-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="mgr-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mgr-filter-bar" style={{ marginBottom: 20 }}>
          <div className="mgr-search-wrap" style={{ flex: 1, maxWidth: 380 }}>
            <span className="mgr-search-icon">🔍</span>
            <input
              id="downloads-search"
              className="mgr-search"
              placeholder="Search by file name or shared by…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--fg4)', fontSize: '.8rem', padding: '0 4px' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Downloads List */}
        <div className="mgr-card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div className="loading-spinner" />
            </div>
          ) : downloads.length === 0 ? (
            <EmptyDownloads />
          ) : filtered.length === 0 ? (
            <div className="mgr-empty">
              <div style={{ fontSize: '3rem', marginBottom: 14 }}>🔍</div>
              <p className="mgr-empty-title">No downloads match your search</p>
              <button
                className="mgr-btn-sm-outline"
                style={{ marginTop: 16 }}
                onClick={() => setSearch('')}
              >
                ✕ Clear Search
              </button>
            </div>
          ) : (
            <div>
              {/* Timeline-grouped view */}
              {groupEntries.length > 0 ? (
                groupEntries.map(([dateLabel, items]) => (
                  <div key={dateLabel} style={{ marginBottom: 28 }}>
                    {/* Date header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{
                        fontSize: '.7rem', fontWeight: 700, color: 'var(--fg4)',
                        textTransform: 'uppercase', letterSpacing: '.06em',
                        background: '#f9fafb', padding: '3px 10px', borderRadius: 5,
                        whiteSpace: 'nowrap',
                      }}>
                        📅 {dateLabel}
                      </div>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      <span style={{ fontSize: '.72rem', color: 'var(--fg4)', fontWeight: 600 }}>
                        {items.length} file{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Files in this group */}
                    <div className="table-container">
                      <table className="mgr-table">
                        <thead>
                          <tr>
                            <th>File Name</th>
                            <th>File Size</th>
                            <th>Shared By</th>
                            <th>Downloaded At</th>
                            <th style={{ textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((dl, i) => {
                            const fi  = fileIcon(dl.fileName, dl.fileType);
                            const ext = (dl.fileName?.split('.').pop() || '').toUpperCase();
                            const fileUrl = dl.fileId ? (downloadFileUrl(dl.fileId) + '&mode=download') : '#';
                            return (
                              <tr key={dl.fileId || i}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className="mgr-file-icon" style={{ background: fi.bg, color: fi.color, flexShrink: 0 }}>
                                      {fi.icon}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--fg)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {dl.fileName || 'Unknown File'}
                                      </div>
                                      <span className="mgr-ext-badge" style={{ background: fi.bg, color: fi.color, fontSize: '.65rem', marginTop: 2, display: 'inline-flex' }}>
                                        {ext || 'FILE'}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ fontSize: '.82rem', color: 'var(--fg3)' }}>
                                  {fmtSize(dl.fileSize)}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                      width: 26, height: 26, borderRadius: '50%',
                                      background: '#eef2ff', color: '#4f46e5',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: '.7rem', fontWeight: 800, flexShrink: 0,
                                    }}>
                                      {(dl.sharedBy || dl.ownerName || 'M')[0].toUpperCase()}
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--fg2)' }}>
                                      {dl.sharedBy || dl.ownerName || 'Manager'}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontSize: '.82rem', color: 'var(--fg3)' }}>
                                    {fmtDate(dl.downloadedAt || dl.timestamp)}
                                  </div>
                                  <div style={{ fontSize: '.7rem', color: 'var(--fg4)', marginTop: 1 }}>
                                    {dl.downloadedAt
                                      ? new Date(dl.downloadedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                      : ''}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {fileUrl && fileUrl !== '#' ? (
                                    <a
                                      href={fileUrl}
                                      download={dl.fileName}
                                      title="Download again"
                                      className="mgr-action-btn"
                                      style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
                                    >
                                      ⬇️
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: '.75rem', color: 'var(--fg4)' }}>—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                /* Flat list fallback */
                <div className="usr-dl-list">
                  {filtered.map((dl, i) => {
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
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
