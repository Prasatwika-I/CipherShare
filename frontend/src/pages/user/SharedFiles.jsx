import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import {
  getUserSharedFiles, downloadFileUrl, recordDownload,
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

function getExt(name = '') {
  return (name.split('.').pop() || '').toLowerCase();
}

/* ─────────────────────────────────────────────────────────
   PERMISSION BADGE
───────────────────────────────────────────────────────── */
function PermBadge({ canDownload }) {
  return canDownload
    ? <span className="usr-perm-download">⬇️ Download</span>
    : <span className="usr-perm-view">👁️ View Only</span>;
}

/* ─────────────────────────────────────────────────────────
   FILE DETAIL MODAL
───────────────────────────────────────────────────────── */
function FileDetailModal({ file, onClose, onDownload, onAccessDenied }) {
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="usr-detail-title">{file.fileName}</div>
              <div className="usr-detail-sub">
                <span style={{
                  display: 'inline-flex', padding: '2px 8px', borderRadius: 5,
                  fontSize: '.65rem', fontWeight: 800, background: fi.bg, color: fi.color, marginRight: 8
                }}>{ext}</span>
                {fmtSize(file.fileSize)}
              </div>
            </div>
          </div>
          <button className="mgr-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Meta grid */}
        <div className="usr-detail-meta-grid">
          {[
            { label: 'File Name',    value: file.fileName || '—' },
            { label: 'File Type',    value: ext },
            { label: 'File Size',    value: fmtSize(file.fileSize) },
            { label: 'Shared By',    value: file.ownerName || file.sharedBy || '—' },
            { label: 'Shared Date',  value: fmtDate(file.sharedAt || file.uploadedAt) },
            { label: 'Permission',   value: <PermBadge canDownload={file.canDownload} /> },
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
              onClick={() => { onDownload(file.fileId); onClose(); }}
            >
              ⬇️ Download
            </a>
          ) : (
            <button
              className="usr-btn-locked"
              disabled
              onClick={() => { onAccessDenied(); onClose(); }}
            >
              🔒 Access Denied
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TYPE FILTER CONFIG
───────────────────────────────────────────────────────── */
const TYPE_FILTERS = [
  { key: 'all',    label: 'All Files',  match: () => true },
  { key: 'pdf',    label: '📕 PDF',    match: (f) => getExt(f.fileName) === 'pdf' },
  { key: 'docx',   label: '📘 DOCX',   match: (f) => ['doc','docx'].includes(getExt(f.fileName)) },
  { key: 'xlsx',   label: '📗 XLSX',   match: (f) => ['xls','xlsx','csv'].includes(getExt(f.fileName)) },
  { key: 'ppt',    label: '📙 PPT',    match: (f) => ['ppt','pptx'].includes(getExt(f.fileName)) },
  { key: 'image',  label: '🖼️ Images', match: (f) => ['jpg','jpeg','png','gif','svg','webp'].includes(getExt(f.fileName)) },
];

const PERM_FILTERS = [
  { key: 'all',      label: 'All Permissions' },
  { key: 'download', label: '⬇️ Can Download' },
  { key: 'view',     label: '👁️ View Only' },
];

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
export default function SharedFiles() {
  const { user }              = useAuth();
  const [files, setFiles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [permFilter, setPermFilter] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [downloadMsg, setDownloadMsg]   = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const toastTimer = useRef(null);

  useEffect(() => {
    setLoading(true);
    getUserSharedFiles()
      .then(r => setFiles(r.data.sharedFiles || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimer.current);
    if (type === 'denied') setAccessDenied(true);
    else setDownloadMsg(msg);
    toastTimer.current = setTimeout(() => {
      setAccessDenied(false);
      setDownloadMsg('');
    }, 3500);
  };

  const handleDownload = async (fileId) => {
    try { await recordDownload(fileId); } catch { /* silent */ }
    showToast('✅ Download started!');
  };

  const handleAccessDenied = () => showToast('', 'denied');

  // ── Filtering ──────────────────────────────────────────
  const filtered = files.filter(f => {
    const matchS = (f.fileName || '').toLowerCase().includes(search.toLowerCase()) ||
                   (f.ownerName || f.sharedBy || '').toLowerCase().includes(search.toLowerCase());
    const matchT = TYPE_FILTERS.find(tf => tf.key === typeFilter)?.match(f) ?? true;
    const matchP = permFilter === 'all'
      || (permFilter === 'download' && f.canDownload)
      || (permFilter === 'view'     && !f.canDownload);
    return matchS && matchT && matchP;
  });

  const totalFiles    = files.length;
  const downloadCount = files.filter(f => f.canDownload).length;
  const viewOnlyCount = totalFiles - downloadCount;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content mgr-main">

        {/* ── Toasts ── */}
        {accessDenied && (
          <div className="usr-access-denied">
            🚫 Access Denied — you don't have download permission for this file.
          </div>
        )}
        {downloadMsg && (
          <div className="admin-toast">{downloadMsg}</div>
        )}

        {/* ── Page Header ── */}
        <div className="mgr-page-header">
          <div>
            <h1 className="mgr-page-title">📁 Files Shared With Me</h1>
            <p className="mgr-page-sub">
              Files accessible based on your role and permissions
              {user?.department && ` · ${user.department}`}
            </p>
          </div>
          <button
            className="mgr-btn-sm-outline"
            onClick={() => setRefreshKey(k => k + 1)}
          >
            🔄 Refresh
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { icon: '📁', label: 'Total Shared',      value: totalFiles,    color: '#4f46e5', bg: '#eef2ff' },
            { icon: '⬇️', label: 'Can Download',      value: downloadCount, color: '#059669', bg: '#f0fdf4' },
            { icon: '👁️', label: 'View Only',          value: viewOnlyCount, color: '#2563eb', bg: '#eff6ff' },
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

        {/* ── Search + Filters ── */}
        <div style={{ marginBottom: 16 }}>
          {/* Search bar */}
          <div className="mgr-filter-bar" style={{ marginBottom: 12 }}>
            <div className="mgr-search-wrap" style={{ flex: 1, maxWidth: 420 }}>
              <span className="mgr-search-icon">🔍</span>
              <input
                id="shared-files-search"
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
            {/* Permission filter */}
            <div style={{ display: 'flex', gap: 6 }}>
              {PERM_FILTERS.map(pf => (
                <button
                  key={pf.key}
                  id={`perm-filter-${pf.key}`}
                  className={`mgr-filter-pill${permFilter === pf.key ? ' active' : ''}`}
                  onClick={() => setPermFilter(pf.key)}
                >
                  {pf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type filters */}
          <div className="mgr-type-filters">
            {TYPE_FILTERS.map(tf => (
              <button
                key={tf.key}
                id={`type-filter-${tf.key}`}
                className={`mgr-filter-pill${typeFilter === tf.key ? ' active' : ''}`}
                onClick={() => setTypeFilter(tf.key)}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Files Table ── */}
        <div className="mgr-card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div className="loading-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="mgr-empty">
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>
                {files.length === 0 ? '📭' : '🔍'}
              </div>
              <p className="mgr-empty-title">
                {files.length === 0
                  ? 'No files have been shared with you yet.'
                  : 'No files match your search'}
              </p>
              <p className="mgr-empty-sub">
                {files.length === 0
                  ? `Your manager will share files with you based on your role${user?.department ? ` in ${user.department}` : ''}.`
                  : 'Try a different search term or clear the filters.'}
              </p>
              {files.length === 0 ? (
                <button
                  className="mgr-btn-sm-outline"
                  style={{ marginTop: 20 }}
                  onClick={() => setRefreshKey(k => k + 1)}
                >
                  🔄 Refresh
                </button>
              ) : (
                <button
                  className="mgr-btn-sm-outline"
                  style={{ marginTop: 20 }}
                  onClick={() => { setSearch(''); setTypeFilter('all'); setPermFilter('all'); }}
                >
                  ✕ Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '.78rem', color: 'var(--fg4)', fontWeight: 600 }}>
                  {filtered.length} file{filtered.length !== 1 ? 's' : ''} found
                  {filtered.length !== totalFiles && ` (${totalFiles} total)`}
                </span>
              </div>
              <div className="table-container">
                <table className="mgr-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>File Size</th>
                      <th>Shared By</th>
                      <th>Date Shared</th>
                      <th style={{ textAlign: 'center' }}>Permission</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(file => {
                      const fi  = fileIcon(file.fileName, file.fileType);
                      const ext = (file.fileName?.split('.').pop() || '').toUpperCase();
                      const viewUrl = `/preview/${file.fileId}`;
                      const downloadUrl = downloadFileUrl(file.fileId) + '&mode=download';

                      return (
                        <tr
                          key={file.fileId}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedFile(file)}
                        >
                          {/* File name */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="mgr-file-icon" style={{ background: fi.bg, color: fi.color }}>
                                {fi.icon}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--fg)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {file.fileName}
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                                  <span className="mgr-ext-badge" style={{ background: fi.bg, color: fi.color }}>
                                    {ext}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Size */}
                          <td style={{ fontSize: '.82rem', color: 'var(--fg3)' }}>
                            {fmtSize(file.fileSize)}
                          </td>

                          {/* Shared by */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: '#eef2ff', color: '#4f46e5',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '.75rem', fontWeight: 800, flexShrink: 0,
                              }}>
                                {(file.ownerName || file.sharedBy || 'M')[0].toUpperCase()}
                              </div>
                              <div style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--fg2)' }}>
                                {file.ownerName || file.sharedBy || 'Manager'}
                              </div>
                            </div>
                          </td>

                          {/* Date */}
                          <td style={{ fontSize: '.82rem', color: 'var(--fg3)' }}>
                            {fmtDate(file.sharedAt || file.uploadedAt)}
                          </td>

                          {/* Permission */}
                          <td style={{ textAlign: 'center' }}>
                            <PermBadge canDownload={file.canDownload} />
                          </td>

                          {/* Actions */}
                          <td onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              {/* View */}
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="View file"
                                className="mgr-action-btn"
                                onClick={e => e.stopPropagation()}
                              >
                                👁️
                              </a>

                              {/* Download (if permitted) */}
                              {file.canDownload ? (
                                <a
                                  href={downloadUrl}
                                  download={file.fileName}
                                  title="Download file"
                                  className="mgr-action-btn"
                                  style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
                                  onClick={e => { e.stopPropagation(); handleDownload(file.fileId); }}
                                >
                                  ⬇️
                                </a>
                              ) : (
                                <button
                                  title="Download not permitted"
                                  className="mgr-action-btn"
                                  style={{ opacity: .35, cursor: 'not-allowed' }}
                                  onClick={e => { e.stopPropagation(); handleAccessDenied(); }}
                                >
                                  🔒
                                </button>
                              )}

                              {/* Details */}
                              <button
                                title="File details"
                                className="mgr-action-btn"
                                style={{ background: '#eef2ff', borderColor: '#c7d2fe' }}
                                onClick={e => { e.stopPropagation(); setSelectedFile(file); }}
                              >
                                ℹ️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* ── File Detail Modal ── */}
        {selectedFile && (
          <FileDetailModal
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
            onDownload={handleDownload}
            onAccessDenied={handleAccessDenied}
          />
        )}
      </main>
    </div>
  );
}
