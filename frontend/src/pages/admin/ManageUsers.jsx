import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Alert from '../../components/Alert';
import { getAdminUsers, updateUserRole, approveUser, deactivateUser, inviteUser } from '../../services/api';

const ROLES = ['employee', 'manager', 'admin'];

// 3 roles only — employee is displayed as "User" (backend stores 'employee')
const ROLE_META = {
  admin:    { color:'#dc2626', bg:'#fef2f2', border:'#fecaca', icon:'👑', label:'Admin'   },
  manager:  { color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe', icon:'🎯', label:'Manager' },
  employee: { color:'#059669', bg:'#f0fdf4', border:'#bbf7d0', icon:'👤', label:'User'    },
};

export default function ManageUsers() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [alert, setAlert]         = useState(null);
  const [updating, setUpdating]   = useState({});
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode]   = useState('table'); // 'table' | 'card'
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'employee', department: '' });
  const [inviting, setInviting]     = useState(false);

  useEffect(() => {
    getAdminUsers()
      .then(r => setUsers(r.data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await inviteUser(inviteForm.name, inviteForm.email, inviteForm.role, inviteForm.department);
      setAlert({ type: 'success', message: '✅ User invited! Default password: CipherShare123!' });
      setShowInvite(false);
      setInviteForm({ name: '', email: '', role: 'employee', department: '' });
      getAdminUsers().then(r => setUsers(r.data.users || []));
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.error || '❌ Failed to invite user.' });
    } finally {
      setInviting(false);
    }
  };

  const handleRoleUpdate = async (uid, role) => {
    setUpdating(u => ({ ...u, [uid]: true }));
    try {
      await updateUserRole(uid, role);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
      setAlert({ type:'success', message:'✅ Role updated successfully.' });
    } catch {
      setAlert({ type:'error', message:'❌ Failed to update role.' });
    } finally {
      setUpdating(u => ({ ...u, [uid]: false }));
    }
  };

  const handleApprove = async (uid, name) => {
    if (!window.confirm(`Are you sure you want to approve this manager request?\n"${name}" will receive Manager role and dashboard access.`)) return;
    setUpdating(u => ({ ...u, [uid]: true }));
    try {
      await approveUser(uid, 'manager');
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role:'manager', active:true } : u));
      setAlert({ type:'success', message:`✅ ${name} approved as Manager.` });
    } catch {
      setAlert({ type:'error', message:'❌ Failed to approve user.' });
    } finally {
      setUpdating(u => ({ ...u, [uid]: false }));
    }
  };

  const handleReject = async (uid, name) => {
    if (!window.confirm(`Are you sure you want to reject this manager request?\n"${name}" will be denied access.`)) return;
    setUpdating(u => ({ ...u, [uid]: true }));
    try {
      await deactivateUser(uid);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, active:false } : u));
      setAlert({ type:'success', message:`🚫 ${name}'s request rejected.` });
    } catch {
      setAlert({ type:'error', message:'❌ Failed to reject user.' });
    } finally {
      setUpdating(u => ({ ...u, [uid]: false }));
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = (u.name||'').toLowerCase().includes(search.toLowerCase()) ||
                        (u.email||'').toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' ||
                        (statusFilter === 'active' && u.active) ||
                        (statusFilter === 'inactive' && !u.active);
    return matchSearch && matchRole && matchStatus;
  });

  const stats = ROLES.map(r => ({ role: r, count: users.filter(u => u.role === r).length }));
  const activeCount = users.filter(u => u.active).length;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content admin-main">
        {/* Header */}
        <div className="admin-banner">
          <div className="admin-banner-left">
            <div className="admin-banner-badge">
              <span>👥</span><span>User Management</span>
            </div>
            <h1 className="admin-banner-title">Manage Users</h1>
            <p className="admin-banner-sub">Assign roles, control access, manage all accounts</p>
          </div>
          <div className="admin-banner-right">
            <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
              <span>➕</span> Invite User
            </button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* Invite Modal */}
        {showInvite && (
          <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:420, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', border:'1.5px solid var(--border)', animation:'slideInRight .2s ease' }}>
              <h3 style={{ fontSize:'1.2rem', fontWeight:800, marginBottom:20, color:'#0f172a' }}>Invite New User</h3>
              <form onSubmit={handleInvite} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div>
                  <label style={{ display:'block', fontSize:'.875rem', fontWeight:600, marginBottom:6, color:'#374151' }}>Full Name</label>
                  <input type="text" required style={{ width:'100%', padding:'10px', borderRadius:8, border:'1.5px solid #e2e8f0', fontFamily:'inherit' }}
                    value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'.875rem', fontWeight:600, marginBottom:6, color:'#374151' }}>Email Address</label>
                  <input type="email" required style={{ width:'100%', padding:'10px', borderRadius:8, border:'1.5px solid #e2e8f0', fontFamily:'inherit' }}
                    value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'.875rem', fontWeight:600, marginBottom:6, color:'#374151' }}>Role</label>
                  <select style={{ width:'100%', padding:'10px', borderRadius:8, border:'1.5px solid #e2e8f0', fontFamily:'inherit' }}
                    value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'.875rem', fontWeight:600, marginBottom:6, color:'#374151' }}>Department <span style={{fontWeight:400, color:'#9ca3af'}}>(Optional)</span></label>
                  <input type="text" style={{ width:'100%', padding:'10px', borderRadius:8, border:'1.5px solid #e2e8f0', fontFamily:'inherit' }}
                    value={inviteForm.department} onChange={e => setInviteForm({...inviteForm, department: e.target.value})} />
                </div>
                <div style={{ display:'flex', gap:10, marginTop:8 }}>
                  <button type="button" onClick={() => setShowInvite(false)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#f9fafb', color:'#374151', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                  <button type="submit" disabled={inviting} style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'#4f46e5', color:'#fff', fontWeight:700, cursor: inviting ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>{inviting ? 'Inviting...' : 'Send Invite'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mini Stats */}
        <div className="user-mini-stats">
          <div className="ums-card" style={{borderTop:'3px solid #4f46e5'}}>
            <div className="ums-num">{users.length}</div>
            <div className="ums-lbl">Total Users</div>
          </div>
          <div className="ums-card" style={{borderTop:'3px solid #059669'}}>
            <div className="ums-num">{activeCount}</div>
            <div className="ums-lbl">Active</div>
          </div>
          <div className="ums-card" style={{borderTop:'3px solid #d97706'}}>
            <div className="ums-num">{users.length - activeCount}</div>
            <div className="ums-lbl">Inactive</div>
          </div>
          {stats.map(s => {
            const m = ROLE_META[s.role] || ROLE_META.employee;
            return (
              <div key={s.role} className="ums-card" style={{borderTop:`3px solid ${m.color}`}}>
                <div className="ums-num" style={{color: m.color}}>{s.count}</div>
                <div className="ums-lbl">{m.label}s</div>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="glass-card-admin" style={{marginBottom:20}}>
          <div className="users-toolbar">
            <div className="users-toolbar-left">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input type="text" className="admin-search"
                  placeholder="Search users by name or email..."
                  value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
              <select className="admin-filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </select>
              <select className="admin-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="users-toolbar-right">
              <span className="result-count">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
              <div className="view-toggle">
                <button className={`vt-btn ${viewMode==='table'?'active':''}`} onClick={()=>setViewMode('table')}>☰</button>
                <button className={`vt-btn ${viewMode==='card'?'active':''}`}  onClick={()=>setViewMode('card')}>⊞</button>
              </div>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="glass-card-admin">
          {loading ? (
            <div style={{padding:60,display:'flex',justifyContent:'center'}}>
              <div className="loading-spinner"/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>No users found matching your criteria.</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const m = ROLE_META[u.role] || ROLE_META.employee;
                    return (
                      <tr key={u.uid}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div className={`user-avatar-sm ${u.role}-avatar`}>{u.name?.[0] || '?'}</div>
                            <div>
                              <div style={{fontWeight:700,fontSize:'.875rem'}}>{u.name}</div>
                              <div style={{fontSize:'.72rem',color:'var(--fg4)'}}>UID: {u.uid?.slice(-6)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-secondary">{u.email}</td>
                        <td className="text-secondary">{u.department || '—'}</td>
                        <td>
                          {!u.active && u.requestedRole ? (
                            <span className="admin-role-badge" style={{background:'#fef3c7', color:'#d97706', border:'1px solid #fde68a'}}>
                              ⏳ Req: {u.requestedRole.charAt(0).toUpperCase() + u.requestedRole.slice(1)}
                            </span>
                          ) : (
                            <span className="admin-role-badge" style={{background:m.bg, color:m.color, border:`1px solid ${m.border}`}}>
                              {m.icon} {m.label}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`admin-status-badge ${u.active ? 'active' : 'inactive'}`}>
                            <span className="status-pulse"/>
                            {u.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-secondary text-sm">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td>
                          {/* Pending users: show Approve / Reject. Active users: show role selector */}
                          {!u.active ? (
                            <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                              <button
                                disabled={updating[u.uid]}
                                onClick={() => handleApprove(u.uid, u.name)}
                                style={{
                                  display:'inline-flex', alignItems:'center', gap:4,
                                  padding:'5px 10px', border:'none', borderRadius:7,
                                  background:'#059669', color:'#fff',
                                  fontWeight:700, fontSize:'.75rem',
                                  cursor: updating[u.uid] ? 'not-allowed' : 'pointer',
                                  fontFamily:'inherit',
                                  boxShadow:'0 2px 6px rgba(5,150,105,.25)',
                                }}
                              >
                                {updating[u.uid] ? '⏳' : '✅'} Approve
                              </button>
                              <button
                                disabled={updating[u.uid]}
                                onClick={() => handleReject(u.uid, u.name)}
                                style={{
                                  display:'inline-flex', alignItems:'center', gap:4,
                                  padding:'5px 10px', border:'none', borderRadius:7,
                                  background:'#dc2626', color:'#fff',
                                  fontWeight:700, fontSize:'.75rem',
                                  cursor: updating[u.uid] ? 'not-allowed' : 'pointer',
                                  fontFamily:'inherit',
                                  boxShadow:'0 2px 6px rgba(220,38,38,.25)',
                                }}
                              >
                                {updating[u.uid] ? '⏳' : '❌'} Reject
                              </button>
                            </div>
                          ) : (
                            <div style={{display:'flex',gap:8,alignItems:'center'}}>
                              <select
                                defaultValue={u.role}
                                className="admin-role-select"
                                onChange={e => handleRoleUpdate(u.uid, e.target.value)}
                                disabled={updating[u.uid]}
                              >
                                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                              </select>
                              {updating[u.uid] && <div className="loading-spinner" style={{width:16,height:16,borderWidth:2,margin:0}}/>}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card View */
            <div className="user-card-grid">
              {filtered.map(u => {
                const m = ROLE_META[u.role] || ROLE_META.employee;
                return (
                  <div key={u.uid} className="user-card">
                    <div className="uc-top" style={{background:`linear-gradient(135deg, ${m.color}18, ${m.color}08)`}}>
                      <div className={`user-avatar ${u.role}-avatar`} style={{width:52,height:52,fontSize:'1.2rem'}}>
                        {u.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className={`admin-status-badge ${u.active ? 'active' : 'inactive'}`} style={{position:'absolute',top:12,right:12}}>
                        {u.active ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                    <div className="uc-body">
                      <div className="uc-name">{u.name}</div>
                      <div className="uc-email">{u.email}</div>
                      {!u.active && u.requestedRole ? (
                        <span className="admin-role-badge" style={{background:'#fef3c7', color:'#d97706', border:'1px solid #fde68a', marginTop:8, display:'inline-flex'}}>
                          ⏳ Req: {u.requestedRole.charAt(0).toUpperCase() + u.requestedRole.slice(1)}
                        </span>
                      ) : (
                        <span className="admin-role-badge" style={{background:m.bg,color:m.color,border:`1px solid ${m.border}`,marginTop:8,display:'inline-flex'}}>
                          {m.icon} {m.label}
                        </span>
                      )}
                      <div className="uc-dept">{u.department || 'No Department'}</div>
                    </div>
                    <div className="uc-footer">
                      <select
                        defaultValue={u.role}
                        className="admin-role-select"
                        style={{flex:1}}
                        onChange={e => handleRoleUpdate(u.uid, e.target.value)}
                        disabled={updating[u.uid]}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                      </select>
                      {updating[u.uid] && <div className="loading-spinner" style={{width:16,height:16,borderWidth:2,margin:0}}/>}
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
