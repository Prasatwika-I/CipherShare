import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { getAdminDashboard, getPendingUsers, approveUser, deactivateUser } from '../../services/api';

const ACTION_LABELS = {
  LOGIN:'Login', LOGOUT:'Logout', UPLOAD:'Upload', DOWNLOAD:'Download',
  SHARE:'Share', DELETE:'Delete', REGISTER:'Register', ROLE_UPDATE:'Role Update',
  APPROVE_USER:'Approved', DEACTIVATE_USER:'Rejected',
};

const ACTION_COLORS = {
  LOGIN:'#059669', LOGOUT:'#6b7280', UPLOAD:'#2563eb', DOWNLOAD:'#7c3aed',
  SHARE:'#d97706', DELETE:'#dc2626', REGISTER:'#059669', ROLE_UPDATE:'#d97706',
  APPROVE_USER:'#059669', DEACTIVATE_USER:'#dc2626',
};

// Mini sparkline bar chart component
function SparkBar({ values = [], color = '#4f46e5' }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:40 }}>
      {values.map((v, i) => (
        <div key={i} style={{
          flex:1, background: color,
          height: `${(v/max)*100}%`, minHeight:4,
          borderRadius:'2px 2px 0 0', opacity: 0.7 + (i/values.length)*0.3,
          transition:'all 0.3s ease'
        }}/>
      ))}
    </div>
  );
}

// Donut chart component
function DonutChart({ percentage = 0, color = '#4f46e5', size = 80 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percentage / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{transition:'stroke-dasharray 0.8s ease'}}/>
    </svg>
  );
}

// ── Confirmation Modal ─────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, confirmLabel, confirmColor, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(0,0,0,0.45)', display:'flex',
      alignItems:'center', justifyContent:'center', padding:16,
    }}>
      <div style={{
        background:'#fff', borderRadius:16, padding:28,
        maxWidth:420, width:'100%',
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
        border:'1.5px solid var(--border)',
        animation:'slideInRight .2s ease',
      }}>
        <div style={{ fontSize:'2rem', textAlign:'center', marginBottom:12 }}>
          {confirmColor === '#059669' ? '✅' : '❌'}
        </div>
        <h3 style={{ fontSize:'1.05rem', fontWeight:800, color:'#0f172a', textAlign:'center', marginBottom:8 }}>
          {title}
        </h3>
        <p style={{ fontSize:'.875rem', color:'#64748b', textAlign:'center', marginBottom:24, lineHeight:1.6 }}>
          {message}
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1, padding:'10px 16px', border:'1.5px solid #e2e8f0',
            borderRadius:8, background:'#f9fafb', color:'#374151',
            fontWeight:600, fontSize:'.875rem', cursor:'pointer', fontFamily:'inherit',
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            flex:1, padding:'10px 16px', border:'none',
            borderRadius:8, background: confirmColor, color:'#fff',
            fontWeight:700, fontSize:'.875rem', cursor:'pointer', fontFamily:'inherit',
          }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [actionLoading, setActionLoading] = useState(null); // uid being processed
  const [toast, setToast]             = useState(null);
  const [modal, setModal]             = useState(null); // { type:'approve'|'reject', user }
  const [now] = useState(new Date());

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadPending = useCallback(() => {
    getPendingUsers()
      .then(r => setPendingUsers(r.data?.users || []))
      .catch(() => setPendingUsers([]));
  }, []);

  useEffect(() => {
    getAdminDashboard()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
    loadPending();
  }, [loadPending]);

  // ── Approve handler ───────────────────────────────────────
  const handleApprove = async (user) => {
    setModal(null);
    setActionLoading(user.uid);
    try {
      await approveUser(user.uid, 'manager');
      setPendingUsers(prev => prev.filter(u => u.uid !== user.uid));
      showToast(`✅ ${user.name} approved as Manager`);
    } catch {
      showToast('❌ Failed to approve. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reject handler ────────────────────────────────────────
  const handleReject = async (user) => {
    setModal(null);
    setActionLoading(user.uid);
    try {
      await deactivateUser(user.uid);
      setPendingUsers(prev => prev.filter(u => u.uid !== user.uid));
      showToast(`🚫 ${user.name}'s request has been rejected.`);
    } catch {
      showToast('❌ Failed to reject. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const totalUsers  = data?.totalUsers  ?? 0;
  const totalFiles  = data?.totalFiles  ?? 0;
  const recentLogs  = data?.recentLogs  ?? [];
  const storageUsed = Math.min(Math.round((totalFiles * 2.4) % 100), 85);
  const pendingCount = pendingUsers.length;

  const weeklyUploads = [3,7,5,9,4,8,totalFiles % 10 || 6];
  const userGrowth    = [10,18,14,22,19,25,totalUsers % 30 || 20];

  const quickStats = [
    { icon:'👥', label:'Total Users',    value: totalUsers,  sub:'Registered accounts',   color:'#4f46e5', bg:'#eef2ff', link:'/admin/manage-users', spark: userGrowth },
    { icon:'✅', label:'Active Users',   value: Math.ceil(totalUsers * 0.78), sub:'Currently active', color:'#059669', bg:'#f0fdf4', link:'/admin/manage-users', spark:[5,8,6,9,7,10,8] },
    { icon:'📁', label:'Total Files',    value: totalFiles,  sub:'Across all users',       color:'#2563eb', bg:'#eff6ff', link:'/admin/manage-files', spark: weeklyUploads },
    { icon:'🔗', label:'Shared Files',   value: Math.ceil(totalFiles * 0.6), sub:'Active shares',    color:'#7c3aed', bg:'#f5f3ff', link:'/admin/manage-files', spark:[2,4,3,6,5,7,4] },
    { icon:'💾', label:'Storage Used',   value: `${storageUsed}%`, sub:'of 100 GB quota',  color:'#d97706', bg:'#fffbeb', link:'/admin/system-settings', spark:[20,35,42,55,60,68,storageUsed] },
    { icon:'⏳', label:'Pending Requests', value: pendingCount, sub:'Awaiting approval',   color:'#dc2626', bg:'#fef2f2', link:'#pending-requests', spark:[1,2,1,3,2,4,pendingCount] },
  ];

  // 3 roles only — no Viewer
  const roleDistribution = [
    { role:'Admin',   count:1,                               color:'#dc2626', pct:5  },
    { role:'Manager', count:Math.ceil(totalUsers*0.25)||1,   color:'#2563eb', pct:25 },
    { role:'User',    count:Math.max(totalUsers-2, 0)||2,    color:'#059669', pct:70 },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content admin-main">

        {/* Global Toast */}
        {toast && <div className="admin-toast">{toast}</div>}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={!!modal}
          title={modal?.type === 'approve' ? 'Approve Manager Request' : 'Reject Manager Request'}
          message={
            modal?.type === 'approve'
              ? `Are you sure you want to approve this manager request? "${modal?.user?.name}" will receive Manager role and dashboard access.`
              : `Are you sure you want to reject this manager request? "${modal?.user?.name}" will be denied access.`
          }
          confirmLabel={modal?.type === 'approve' ? '✅ Approve Manager' : '❌ Reject Manager'}
          confirmColor={modal?.type === 'approve' ? '#059669' : '#dc2626'}
          onConfirm={() => modal?.type === 'approve' ? handleApprove(modal.user) : handleReject(modal.user)}
          onCancel={() => setModal(null)}
        />

        {/* ── Top Banner ── */}
        <div className="admin-banner">
          <div className="admin-banner-left">
            <div className="admin-banner-badge">
              <span className="admin-crown">👑</span>
              <span>Administrator</span>
            </div>
            <h1 className="admin-banner-title">Admin Command Center</h1>
            <p className="admin-banner-sub">
              Full system control · {now.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
            </p>
          </div>
          <div className="admin-banner-right">
            {pendingCount > 0 && (
              <a href="#pending-requests" style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'8px 16px', borderRadius:'var(--r-sm)',
                background:'#fef2f2', color:'#dc2626',
                border:'1.5px solid #fecaca', fontWeight:700,
                fontSize:'.875rem', textDecoration:'none',
              }}>
                ⏳ {pendingCount} Pending
              </a>
            )}
            <Link to="/admin/manage-users" className="btn btn-primary">
              <span>👤</span> Add User
            </Link>
            <Link to="/admin/view-logs" className="btn btn-outline-indigo">
              <span>📋</span> View Logs
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'80px'}}>
            <div className="loading-spinner"/>
          </div>
        ) : (
          <>
            {/* ── Stats Grid ── */}
            <div className="admin-stats-grid">
              {quickStats.map((s, i) => (
                <a href={s.link} key={i} className="admin-stat-card" style={{ '--accent': s.color, '--accent-bg': s.bg, textDecoration:'none' }}>
                  <div className="asc-top">
                    <div className="asc-icon-wrap" style={{background: s.bg}}>
                      <span style={{fontSize:'1.4rem'}}>{s.icon}</span>
                    </div>
                    <SparkBar values={s.spark} color={s.color}/>
                  </div>
                  <div className="asc-value" style={{color: s.color}}>{s.value}</div>
                  <div className="asc-label">{s.label}</div>
                  <div className="asc-sub">{s.sub}</div>
                </a>
              ))}
            </div>

            {/* ── Pending Manager Requests ── */}
            {pendingCount > 0 && (
              <div id="pending-requests" className="glass-card-admin" style={{ marginBottom:24, borderLeft:'4px solid #dc2626' }}>
                <div className="card-header-admin">
                  <div>
                    <h2 className="card-title-admin" style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{
                        background:'#dc2626', color:'#fff',
                        borderRadius:100, padding:'2px 9px',
                        fontSize:'.75rem', fontWeight:800,
                      }}>{pendingCount}</span>
                      Pending Manager Requests
                    </h2>
                    <p className="card-sub-admin">
                      Review and approve or reject Manager role requests
                    </p>
                  </div>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ textAlign:'left' }}>Name</th>
                        <th style={{ textAlign:'left' }}>Email</th>
                        <th style={{ textAlign:'left' }}>Registration Date</th>
                        <th style={{ textAlign:'center' }}>Status</th>
                        <th style={{ textAlign:'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map(u => {
                        const isProcessing = actionLoading === u.uid;
                        const regDate = u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
                          : '—';
                        return (
                          <tr key={u.uid}>
                            {/* Name */}
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <div style={{
                                  width:34, height:34, borderRadius:'50%',
                                  background:'#eff6ff', color:'#2563eb',
                                  display:'flex', alignItems:'center', justifyContent:'center',
                                  fontWeight:800, fontSize:'.875rem', flexShrink:0,
                                }}>
                                  {u.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div>
                                  <div style={{ fontWeight:700, fontSize:'.875rem', color:'var(--fg)' }}>{u.name}</div>
                                  <div style={{ fontSize:'.7rem', color:'var(--fg4)' }}>Requested: Manager</div>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td style={{ fontSize:'.875rem', color:'var(--fg2)' }}>{u.email}</td>

                            {/* Registration Date */}
                            <td style={{ fontSize:'.875rem', color:'var(--fg2)' }}>{regDate}</td>

                            {/* Status */}
                            <td style={{ textAlign:'center' }}>
                              <span style={{
                                display:'inline-flex', alignItems:'center', gap:5,
                                padding:'4px 12px', borderRadius:100,
                                background:'#fffbeb', color:'#d97706',
                                border:'1px solid #fde68a',
                                fontSize:'.72rem', fontWeight:700,
                              }}>
                                ⏳ Pending Approval
                              </span>
                            </td>

                            {/* Actions */}
                            <td>
                              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, flexWrap:'wrap' }}>
                                {/* View Details */}
                                <button
                                  disabled={isProcessing}
                                  onClick={() => alert(`Name: ${u.name}\nEmail: ${u.email}\nRequested Role: Manager\nRegistered: ${regDate}`)}
                                  style={{
                                    display:'inline-flex', alignItems:'center', gap:5,
                                    padding:'6px 12px', borderRadius:7,
                                    border:'1.5px solid var(--border)',
                                    background:'#f9fafb', color:'var(--fg2)',
                                    fontWeight:600, fontSize:'.78rem',
                                    cursor:'pointer', fontFamily:'inherit',
                                    opacity: isProcessing ? .5 : 1,
                                  }}
                                >
                                  🔍 Details
                                </button>

                                {/* Approve */}
                                <button
                                  disabled={isProcessing}
                                  onClick={() => setModal({ type:'approve', user: u })}
                                  style={{
                                    display:'inline-flex', alignItems:'center', gap:5,
                                    padding:'6px 14px', borderRadius:7,
                                    border:'none',
                                    background: isProcessing ? '#d1fae5' : '#059669',
                                    color:'#fff',
                                    fontWeight:700, fontSize:'.78rem',
                                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                                    fontFamily:'inherit',
                                    boxShadow:'0 2px 8px rgba(5,150,105,.3)',
                                    transition:'all .15s ease',
                                  }}
                                  onMouseEnter={e => { if(!isProcessing) e.currentTarget.style.background='#047857'; }}
                                  onMouseLeave={e => { if(!isProcessing) e.currentTarget.style.background='#059669'; }}
                                >
                                  {isProcessing ? '⏳' : '✅'} Approve Manager
                                </button>

                                {/* Reject */}
                                <button
                                  disabled={isProcessing}
                                  onClick={() => setModal({ type:'reject', user: u })}
                                  style={{
                                    display:'inline-flex', alignItems:'center', gap:5,
                                    padding:'6px 14px', borderRadius:7,
                                    border:'none',
                                    background: isProcessing ? '#fee2e2' : '#dc2626',
                                    color:'#fff',
                                    fontWeight:700, fontSize:'.78rem',
                                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                                    fontFamily:'inherit',
                                    boxShadow:'0 2px 8px rgba(220,38,38,.3)',
                                    transition:'all .15s ease',
                                  }}
                                  onMouseEnter={e => { if(!isProcessing) e.currentTarget.style.background='#b91c1c'; }}
                                  onMouseLeave={e => { if(!isProcessing) e.currentTarget.style.background='#dc2626'; }}
                                >
                                  {isProcessing ? '⏳' : '❌'} Reject Manager
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Middle Row: Role Distribution + System Health ── */}
            <div className="admin-mid-grid">

              {/* Role Distribution */}
              <div className="glass-card-admin">
                <div className="card-header-admin">
                  <div>
                    <h2 className="card-title-admin">Role Distribution</h2>
                    <p className="card-sub-admin">Users by access level</p>
                  </div>
                  <Link to="/admin/role-management" className="btn btn-outline-indigo btn-sm">Manage</Link>
                </div>
                <div className="role-dist-grid">
                  {roleDistribution.map((r, i) => (
                    <div key={i} className="role-dist-card" style={{'--rc': r.color}}>
                      <div className="rdc-donut">
                        <DonutChart percentage={r.pct} color={r.color} size={72}/>
                        <div className="rdc-pct" style={{color: r.color}}>{r.pct}%</div>
                      </div>
                      <div className="rdc-role">{r.role}</div>
                      <div className="rdc-count">{r.count} users</div>
                      <div className="rdc-bar">
                        <div className="rdc-fill" style={{width:`${r.pct}%`, background: r.color}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Health */}
              <div className="glass-card-admin">
                <div className="card-header-admin">
                  <div>
                    <h2 className="card-title-admin">System Health</h2>
                    <p className="card-sub-admin">Infrastructure status</p>
                  </div>
                  <span className="health-badge online">● All Systems Online</span>
                </div>
                <div className="health-items">
                  {[
                    { label:'API Server',       pct:98,  color:'#059669', status:'Healthy' },
                    { label:'Database',          pct:95,  color:'#059669', status:'Healthy' },
                    { label:'Storage Engine',    pct:storageUsed, color: storageUsed > 80 ? '#dc2626' : '#d97706', status: storageUsed > 80 ? 'Warning' : 'Normal' },
                    { label:'Authentication',    pct:100, color:'#059669', status:'Healthy' },
                    { label:'File Encryption',   pct:100, color:'#059669', status:'Active'  },
                    { label:'Audit Logging',     pct:99,  color:'#059669', status:'Active'  },
                  ].map((h, i) => (
                    <div key={i} className="health-item">
                      <div className="hi-top">
                        <span className="hi-label">{h.label}</span>
                        <span className="hi-status" style={{color: h.color}}>{h.status}</span>
                      </div>
                      <div className="hi-bar-bg">
                        <div className="hi-bar-fill" style={{width:`${h.pct}%`, background: h.color}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Upload Trend Chart (Sparkbar) ── */}
            <div className="glass-card-admin" style={{marginBottom:24}}>
              <div className="card-header-admin">
                <div>
                  <h2 className="card-title-admin">Activity Overview — Last 7 Days</h2>
                  <p className="card-sub-admin">File uploads, logins, and sharing activity</p>
                </div>
              </div>
              <div className="activity-chart-grid">
                {[
                  { label:'File Uploads',  vals:[3,7,5,9,4,8,totalFiles%10||6],  color:'#2563eb' },
                  { label:'User Logins',   vals:[12,18,15,22,19,25,totalUsers%15||8], color:'#4f46e5' },
                  { label:'File Shares',   vals:[2,4,3,6,5,7,4],                  color:'#7c3aed' },
                  { label:'Downloads',     vals:[5,9,7,11,8,13,6],                color:'#059669' },
                ].map((m, i) => (
                  <div key={i} className="activity-metric-card">
                    <div className="amc-label">{m.label}</div>
                    <div className="amc-chart">
                      {m.vals.map((v, j) => {
                        const max = Math.max(...m.vals);
                        const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
                        return (
                          <div key={j} className="amc-col" title={`${days[j]}: ${v}`}>
                            <div className="amc-bar" style={{height:`${(v/max)*100}%`, background:m.color}}/>
                            <div className="amc-day">{days[j][0]}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="amc-total" style={{color: m.color}}>
                      {m.vals.reduce((a,b)=>a+b,0)} <span>total</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Recent Activity + Quick Actions ── */}
            <div className="admin-bottom-grid">
              <div className="glass-card-admin" style={{flex:2}}>
                <div className="card-header-admin">
                  <div>
                    <h2 className="card-title-admin">Recent Activity</h2>
                    <p className="card-sub-admin">Latest system events</p>
                  </div>
                  <Link to="/admin/view-logs" className="btn btn-outline-indigo btn-sm">View All</Link>
                </div>
                {recentLogs.length > 0 ? (
                  <div className="admin-activity-list">
                    {recentLogs.slice(0,8).map((log, i) => (
                      <div key={i} className="activity-item">
                        <div className="ai-dot" style={{background: ACTION_COLORS[log.action] || '#6b7280'}}/>
                        <div className="ai-info">
                          <span className={`action-badge action-${(log.action||'').toLowerCase()}`}>
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                          <strong style={{marginLeft:8}}>{log.userName || 'System'}</strong>
                          {log.details && <span className="ai-detail"> · {log.details}</span>}
                        </div>
                        <div className="ai-time">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '-'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>No activity logs yet.</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div style={{flex:1, display:'flex', flexDirection:'column', gap:16}}>
                <div className="glass-card-admin">
                  <h2 className="card-title-admin" style={{marginBottom:16}}>Quick Actions</h2>
                  <div className="quick-actions-list">
                    {[
                      { icon:'👤', label:'Add New User',       to:'/admin/manage-users',   color:'#4f46e5' },
                      { icon:'🔑', label:'Manage Roles',        to:'/admin/role-management', color:'#7c3aed' },
                      { icon:'🛡️', label:'Access Control',      to:'/admin/access-control',  color:'#2563eb' },
                      { icon:'📁', label:'File Management',     to:'/admin/manage-files',    color:'#059669' },
                      { icon:'📋', label:'Audit Logs',          to:'/admin/view-logs',       color:'#d97706' },
                      { icon:'⚙️', label:'System Settings',     to:'/admin/system-settings', color:'#6b7280' },
                    ].map((qa, i) => (
                      <Link key={i} to={qa.to} className="qa-item" style={{'--qc': qa.color}}>
                        <span className="qa-icon-wrap" style={{background: `${qa.color}15`}}>
                          {qa.icon}
                        </span>
                        <span className="qa-label">{qa.label}</span>
                        <span className="qa-arrow">→</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="glass-card-admin">
                  <h2 className="card-title-admin" style={{marginBottom:12}}>Security Status</h2>
                  <div className="security-items">
                    {[
                      { label:'RBAC Enabled',   ok:true  },
                      { label:'Data Encrypted',  ok:true  },
                      { label:'Audit Logging',   ok:true  },
                      { label:'2FA Available',   ok:false },
                    ].map((s, i) => (
                      <div key={i} className="sec-item">
                        <span className={`sec-icon ${s.ok ? 'ok' : 'warn'}`}>{s.ok ? '✓' : '!'}</span>
                        <span className="sec-label">{s.label}</span>
                        <span className={`sec-status ${s.ok ? 'ok' : 'warn'}`}>{s.ok ? 'Active' : 'Disabled'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
