import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { getAdminLogs } from '../../services/api';

const ACTION_LABELS = {
  LOGIN:'Login', LOGOUT:'Logout', UPLOAD:'Upload', DOWNLOAD:'Download',
  SHARE:'Share', DELETE:'Delete', REGISTER:'Register',
  ROLE_UPDATE:'Role Update', PROFILE_UPDATE:'Profile Update'
};

const ACTION_META = {
  login:          { color:'#059669', bg:'#f0fdf4', border:'#bbf7d0', icon:'🔐' },
  logout:         { color:'#6b7280', bg:'#f9fafb', border:'#e5e7eb', icon:'🚪' },
  upload:         { color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe', icon:'⬆️' },
  download:       { color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe', icon:'⬇️' },
  share:          { color:'#d97706', bg:'#fffbeb', border:'#fde68a', icon:'🔗' },
  delete:         { color:'#dc2626', bg:'#fef2f2', border:'#fecaca', icon:'🗑️' },
  register:       { color:'#059669', bg:'#f0fdf4', border:'#bbf7d0', icon:'✅' },
  role_update:    { color:'#d97706', bg:'#fffbeb', border:'#fde68a', icon:'🎯' },
  profile_update: { color:'#6b7280', bg:'#f9fafb', border:'#e5e7eb', icon:'✏️' },
};

export default function ViewLogs() {
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [view, setView]     = useState('table'); // 'table' | 'timeline'

  useEffect(() => {
    getAdminLogs()
      .then(r => setLogs(r.data.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    (actionFilter === 'all' || (l.action||'').toLowerCase() === actionFilter) &&
    ((l.userName||'').toLowerCase().includes(search.toLowerCase()) ||
     (l.action  ||'').toLowerCase().includes(search.toLowerCase()) ||
     (l.details ||'').toLowerCase().includes(search.toLowerCase()))
  );

  const actionCounts = {};
  logs.forEach(l => { const a = (l.action||'other').toLowerCase(); actionCounts[a] = (actionCounts[a]||0)+1; });

  const allActions = [...new Set(logs.map(l => (l.action||'').toLowerCase()))];

  const getMeta = (action) => ACTION_META[(action||'').toLowerCase()] || { color:'#6b7280', bg:'#f9fafb', border:'#e5e7eb', icon:'📋' };

  // Group by date for timeline
  const grouped = {};
  filtered.forEach(log => {
    const date = log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'Unknown';
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content admin-main">
        {/* Header */}
        <div className="admin-banner">
          <div className="admin-banner-left">
            <div className="admin-banner-badge">
              <span>📋</span><span>Activity Monitoring</span>
            </div>
            <h1 className="admin-banner-title">Audit Logs</h1>
            <p className="admin-banner-sub">Complete audit trail of all system actions and security events</p>
          </div>
          <div className="admin-banner-right">
            <div className="view-toggle" style={{background:'#f3f4f6',borderRadius:8,padding:4}}>
              <button className={`vt-btn ${view==='table'?'active':''}`} onClick={()=>setView('table')}>📋 Table</button>
              <button className={`vt-btn ${view==='timeline'?'active':''}`} onClick={()=>setView('timeline')}>⏱ Timeline</button>
            </div>
          </div>
        </div>

        {/* Action Stats */}
        <div className="logs-stats-row">
          {[
            { label:'Total Events',  val: logs.length,                   color:'#4f46e5' },
            { label:'Logins',        val: actionCounts['login']||0,      color:'#059669' },
            { label:'Uploads',       val: actionCounts['upload']||0,     color:'#2563eb' },
            { label:'Downloads',     val: actionCounts['download']||0,   color:'#7c3aed' },
            { label:'Shares',        val: actionCounts['share']||0,      color:'#d97706' },
            { label:'Deletions',     val: actionCounts['delete']||0,     color:'#dc2626' },
          ].map((s,i) => (
            <div key={i} className="ums-card" style={{borderTop:`3px solid ${s.color}`}}>
              <div className="ums-num" style={{color:s.color}}>{s.val}</div>
              <div className="ums-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="glass-card-admin" style={{marginBottom:20}}>
          <div className="users-toolbar">
            <div className="users-toolbar-left">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input type="text" className="admin-search"
                  placeholder="Search by user, action, or details..."
                  value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
              <select className="admin-filter-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                <option value="all">All Actions</option>
                {allActions.map(a => (
                  <option key={a} value={a}>{ACTION_LABELS[a.toUpperCase()] || a}</option>
                ))}
              </select>
            </div>
            <span className="result-count">{filtered.length} event{filtered.length!==1?'s':''}</span>
          </div>
        </div>

        {/* Content */}
        <div className="glass-card-admin">
          {loading ? (
            <div style={{padding:60,display:'flex',justifyContent:'center'}}>
              <div className="loading-spinner"/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No logs found matching your criteria.</p>
            </div>
          ) : view === 'table' ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>User</th>
                    <th>File</th>
                    <th>Details</th>
                    <th>IP / Device</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log, i) => {
                    const m = getMeta(log.action);
                    return (
                      <tr key={i}>
                        <td>
                          <span className="admin-event-badge" style={{background:m.bg, color:m.color, border:`1px solid ${m.border}`}}>
                            <span>{m.icon}</span>
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div className="user-avatar-sm employee-avatar" style={{width:28,height:28,fontSize:'.72rem'}}>
                              {(log.userName||'S')[0]}
                            </div>
                            <strong style={{fontSize:'.875rem'}}>{log.userName || 'System'}</strong>
                          </div>
                        </td>
                        <td className="text-secondary text-sm">
                          {log.fileName ? (
                            <span title={log.fileName} style={{maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>
                              📄 {log.fileName}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="text-secondary text-sm" style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {log.details || '—'}
                        </td>
                        <td className="text-secondary text-sm">
                          {log.ip || '—'}
                        </td>
                        <td>
                          <div style={{fontSize:'.78rem'}}>
                            <div style={{color:'var(--fg2)',fontWeight:600}}>
                              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '—'}
                            </div>
                            <div style={{color:'var(--fg4)'}}>
                              {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : ''}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Timeline View */
            <div className="timeline-container">
              {Object.entries(grouped).map(([date, dayLogs]) => (
                <div key={date} className="timeline-day">
                  <div className="timeline-date-header">
                    <div className="tl-date-line"/>
                    <span className="tl-date-label">{date}</span>
                    <div className="tl-date-line"/>
                  </div>
                  {dayLogs.map((log, i) => {
                    const m = getMeta(log.action);
                    return (
                      <div key={i} className="timeline-item">
                        <div className="tl-icon" style={{background:m.bg, border:`2px solid ${m.border}`}}>
                          {m.icon}
                        </div>
                        <div className="tl-connector"/>
                        <div className="tl-content">
                          <div className="tl-header">
                            <span className="admin-event-badge" style={{background:m.bg,color:m.color,border:`1px solid ${m.border}`}}>
                              {ACTION_LABELS[log.action] || log.action}
                            </span>
                            <strong style={{marginLeft:8}}>{log.userName || 'System'}</strong>
                            {log.fileName && <span className="text-secondary text-sm" style={{marginLeft:8}}>· {log.fileName}</span>}
                          </div>
                          {log.details && <div className="tl-details">{log.details}</div>}
                          <div className="tl-time">
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '—'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
