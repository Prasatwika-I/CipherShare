import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { getManagerActivity } from '../../services/api';

const ACT_STYLES = {
  UPLOAD:         { icon: '⬆️', color: '#2563eb', bg: '#eff6ff', label: 'Uploaded'   },
  SHARE:          { icon: '🔗', color: '#7c3aed', bg: '#f5f3ff', label: 'Shared'     },
  DOWNLOAD:       { icon: '⬇️', color: '#059669', bg: '#f0fdf4', label: 'Downloaded' },
  DELETE:         { icon: '🗑️', color: '#dc2626', bg: '#fef2f2', label: 'Deleted'    },
  PROFILE_UPDATE: { icon: '✏️', color: '#d97706', bg: '#fffbeb', label: 'Updated'    },
};
const DEFAULT_STYLE = { icon: '📋', color: '#6b7280', bg: '#f9fafb', label: 'Action' };

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

export default function ManagerActivity() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('ALL');
  const [error, setError]     = useState('');

  useEffect(() => {
    getManagerActivity()
      .then(r => setLogs(r.data?.logs || []))
      .catch(e => setError('Failed to load activity: ' + (e.response?.data?.error || e.message)))
      .finally(() => setLoading(false));
  }, []);

  const actionTypes = ['ALL', 'UPLOAD', 'SHARE', 'DOWNLOAD', 'DELETE'];
  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.action === filter);

  const counts = actionTypes.slice(1).reduce((acc, t) => {
    acc[t] = logs.filter(l => l.action === t).length;
    return acc;
  }, {});

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content mgr-main">

        <div className="mgr-page-header">
          <div>
            <h1 className="mgr-page-title">Recent Activity</h1>
            <p className="mgr-page-sub">Your complete file activity history</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '.8rem', color: 'var(--fg3)' }}>{logs.length} total events</span>
          </div>
        </div>

        {/* Count chips */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {actionTypes.slice(1).map(t => {
            const s = ACT_STYLES[t] || DEFAULT_STYLE;
            return (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 'var(--r-sm)', background: s.bg, border: '1px solid var(--border-2)' }}>
                <span>{s.icon}</span>
                <span style={{ fontSize: '.78rem', fontWeight: 700, color: s.color }}>{counts[t] || 0}</span>
                <span style={{ fontSize: '.75rem', color: 'var(--fg3)' }}>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {actionTypes.map(t => {
            const s = t === 'ALL' ? { icon: '🕐', color: '#4f46e5' } : ACT_STYLES[t];
            return (
              <button key={t} onClick={() => setFilter(t)} style={{
                padding: '7px 16px', borderRadius: 100,
                border: filter === t ? 'none' : '1.5px solid var(--border)',
                background: filter === t ? 'var(--indigo)' : '#fff',
                color: filter === t ? '#fff' : 'var(--fg3)',
                fontWeight: 600, fontSize: '.8rem', cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all .15s ease',
              }}>
                {s?.icon} {t === 'ALL' ? 'All Events' : (ACT_STYLES[t]?.label || t)}
              </button>
            );
          })}
        </div>

        <div className="mgr-card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div className="loading-spinner" />
            </div>
          ) : error ? (
            <div style={{ padding: 24, color: '#dc2626', fontSize: '.875rem' }}>❌ {error}</div>
          ) : filtered.length === 0 ? (
            <div className="mgr-empty">
              <div className="mgr-empty-icon">🕐</div>
              <p className="mgr-empty-title">No activity yet</p>
              <p className="mgr-empty-sub">Upload, share, or download a file to see activity here.</p>
            </div>
          ) : (
            <div className="mgr-timeline-full">
              {filtered.map((log, i) => {
                const s = ACT_STYLES[log.action] || DEFAULT_STYLE;
                return (
                  <div key={log.logId || i} className="mgr-timeline-item-full">
                    <div className="mgr-tl-dot-wrap">
                      <div className="mgr-tl-dot-lg" style={{ background: s.color }}>{s.icon}</div>
                      {i < filtered.length - 1 && <div className="mgr-tl-line-lg" />}
                    </div>
                    <div className="mgr-tl-body">
                      <div style={{ fontWeight: 700, fontSize: '.875rem', color: 'var(--fg)' }}>
                        {log.details || `${s.label} a file`}
                      </div>
                      {log.fileName && (
                        <div style={{ fontSize: '.78rem', color: 'var(--fg3)', marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span>📄</span>
                          <span style={{ fontWeight: 600 }}>{log.fileName}</span>
                        </div>
                      )}
                      <div style={{ fontSize: '.72rem', color: 'var(--fg4)', marginTop: 4 }}>
                        {fmtDate(log.timestamp)}
                      </div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '.7rem', fontWeight: 700, background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
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
