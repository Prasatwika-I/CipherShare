import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import {
  getUserNotifications, markNotificationRead, markAllNotificationsRead,
} from '../../services/api';

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400)  return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function notifMeta(type = '') {
  const t = (type || '').toLowerCase();
  if (t.includes('share') || t.includes('new_file') || t === 'file_shared')
    return { icon: '📁', bg: '#eef2ff', color: '#4f46e5', label: 'File Shared' };
  if (t.includes('permission') || t.includes('update') || t === 'permission_update')
    return { icon: '🔑', bg: '#fffbeb', color: '#d97706', label: 'Permission Updated' };
  if (t.includes('remov') || t.includes('delet') || t.includes('revok') || t === 'file_removed')
    return { icon: '🗑️', bg: '#fef2f2', color: '#dc2626', label: 'File Removed' };
  if (t.includes('login') || t === 'login')
    return { icon: '🔐', bg: '#f0fdf4', color: '#059669', label: 'Login' };
  return { icon: '🔔', bg: '#f3f4f6', color: '#6b7280', label: 'System' };
}

/* ─────────────────────────────────────────────────────────
   EMPTY STATE SVG ILLUSTRATION
───────────────────────────────────────────────────────── */
function EmptyNotifications() {
  return (
    <div className="mgr-empty" style={{ padding: '80px 24px' }}>
      <div style={{ marginBottom: 20 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="56" fill="#f3f4f6" />
          <rect x="38" y="32" width="44" height="52" rx="6" fill="#e5e7eb" />
          <rect x="44" y="42" width="32" height="4" rx="2" fill="#d1d5db" />
          <rect x="44" y="52" width="24" height="4" rx="2" fill="#d1d5db" />
          <rect x="44" y="62" width="28" height="4" rx="2" fill="#d1d5db" />
          <circle cx="60" cy="90" r="12" fill="#e5e7eb" />
          <text x="60" y="95" textAnchor="middle" fontSize="14" fill="#9ca3af">🔕</text>
        </svg>
      </div>
      <p className="mgr-empty-title" style={{ fontSize: '1.1rem' }}>No notifications yet</p>
      <p className="mgr-empty-sub" style={{ maxWidth: 340, lineHeight: 1.6, margin: '8px auto 0' }}>
        You'll be notified here when a manager shares a file with you, updates your permissions, or removes your access.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
const TABS = [
  { key: 'all',    label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'share',  label: '📁 File Shared' },
  { key: 'perm',   label: '🔑 Permissions' },
  { key: 'remove', label: '🗑️ Removed' },
];

export default function Notifications() {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [toast, setToast]     = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getUserNotifications()
      .then(r => setNotifs(r.data.notifications || []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleMarkRead = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      setNotifs(prev => prev.map(n =>
        n.id === notifId ? { ...n, read: true } : n
      ));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      showToast('✅ All notifications marked as read');
    } catch {
      showToast('❌ Could not mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  // ── Filtering ──────────────────────────────────────────
  const filtered = notifs.filter(n => {
    if (tab === 'all')    return true;
    if (tab === 'unread') return !n.read;
    const t = (n.type || '').toLowerCase();
    if (tab === 'share')  return t.includes('share') || t.includes('new') || t === 'file_shared';
    if (tab === 'perm')   return t.includes('permission') || t.includes('update');
    if (tab === 'remove') return t.includes('remov') || t.includes('delet') || t.includes('revok');
    return true;
  });

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content mgr-main">

        {/* Toast */}
        {toast && <div className="admin-toast">{toast}</div>}

        {/* Page Header */}
        <div className="mgr-page-header">
          <div>
            <h1 className="mgr-page-title">
              🔔 Notifications
              {unreadCount > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: '50%',
                  background: '#dc2626', color: '#fff',
                  fontSize: '.7rem', fontWeight: 900, marginLeft: 10,
                }}>
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="mgr-page-sub">
              Stay updated — new file shares, permission changes and removals
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {unreadCount > 0 && (
              <button
                className="mgr-btn-sm-outline"
                onClick={handleMarkAllRead}
                disabled={markingAll}
              >
                {markingAll ? '…' : '✓'} Mark All Read
              </button>
            )}
            <button className="mgr-btn-sm-outline" onClick={load}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { icon: '🔔', label: 'Total',    value: notifs.length,    color: '#4f46e5', bg: '#eef2ff' },
            { icon: '🔵', label: 'Unread',   value: unreadCount,      color: '#2563eb', bg: '#eff6ff' },
            { icon: '✅', label: 'Read',     value: notifs.length - unreadCount, color: '#059669', bg: '#f0fdf4' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', border: '1.5px solid var(--border)',
              borderRadius: 'var(--r-md)', padding: '14px 20px',
              flex: 1, minWidth: 120, boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--fg4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="usr-tab-bar">
          {TABS.map(t => (
            <button
              key={t.key}
              id={`notif-tab-${t.key}`}
              className={`usr-tab${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.key === 'unread' && unreadCount > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 16, height: 16, borderRadius: '50%',
                  background: tab === 'unread' ? '#4f46e5' : '#dc2626', color: '#fff',
                  fontSize: '.55rem', fontWeight: 900, marginLeft: 5,
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="mgr-card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div className="loading-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            notifs.length === 0
              ? <EmptyNotifications />
              : (
                <div className="mgr-empty">
                  <div style={{ fontSize: '3rem', marginBottom: 14 }}>🔍</div>
                  <p className="mgr-empty-title">No notifications in this category</p>
                  <p className="mgr-empty-sub">Try a different filter tab</p>
                  <button
                    className="mgr-btn-sm-outline"
                    style={{ marginTop: 16 }}
                    onClick={() => setTab('all')}
                  >
                    View All
                  </button>
                </div>
              )
          ) : (
            <div className="usr-notif-list">
              {filtered.map((n, i) => {
                const nm = notifMeta(n.type);
                return (
                  <div
                    key={n.id || i}
                    className={`usr-notif-item${!n.read ? ' unread' : ''}`}
                    onClick={() => !n.read && handleMarkRead(n.id)}
                    style={{ cursor: n.read ? 'default' : 'pointer' }}
                  >
                    <div className="usr-notif-icon-wrap" style={{ background: nm.bg }}>
                      <span style={{ fontSize: '1rem' }}>{nm.icon}</span>
                    </div>
                    <div className="usr-notif-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex', padding: '1px 8px', borderRadius: 100,
                          background: nm.bg, color: nm.color,
                          fontSize: '.65rem', fontWeight: 700,
                        }}>
                          {nm.label}
                        </span>
                        {!n.read && (
                          <span style={{
                            display: 'inline-flex', padding: '1px 8px', borderRadius: 100,
                            background: '#eef2ff', color: '#4f46e5',
                            fontSize: '.65rem', fontWeight: 700,
                          }}>
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="usr-notif-msg">{n.message}</div>
                      <div className="usr-notif-time">{fmtDate(n.createdAt)}</div>
                    </div>
                    {!n.read && <div className="usr-notif-unread-dot" />}
                    {n.read && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e5e7eb', flexShrink: 0, marginTop: 6 }} />
                    )}
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
