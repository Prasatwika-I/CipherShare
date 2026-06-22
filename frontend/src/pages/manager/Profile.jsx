import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function ManagerProfile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(user?.name || '');
  const [saved, setSaved]     = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    // In a real app, call updateUserProfile here
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content mgr-main">

        <div className="mgr-page-header">
          <div>
            <h1 className="mgr-page-title">My Profile</h1>
            <p className="mgr-page-sub">Your account information and preferences</p>
          </div>
        </div>

        {saved && <div className="admin-toast">✅ Profile updated!</div>}

        <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:24,alignItems:'start'}}>

          {/* Profile Card */}
          <div className="mgr-card" style={{textAlign:'center'}}>
            <div style={{
              width:88,height:88,borderRadius:'50%',margin:'0 auto 16px',
              background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:'2.2rem',fontWeight:800,color:'#fff',
              boxShadow:'0 8px 24px rgba(79,70,229,.3)',
            }}>
              {user?.name?.[0]?.toUpperCase() || 'M'}
            </div>
            <div style={{fontSize:'1.15rem',fontWeight:800,color:'var(--fg)'}}>{user?.name}</div>
            <div style={{fontSize:'.85rem',color:'var(--fg3)',marginTop:4}}>{user?.email}</div>
            <div style={{
              display:'inline-flex',alignItems:'center',gap:5,
              marginTop:10,padding:'4px 14px',borderRadius:100,
              background:'#eff6ff',color:'#2563eb',border:'1px solid #bfdbfe',
              fontSize:'.75rem',fontWeight:700,
            }}>
              🎯 Manager
            </div>

            <div style={{marginTop:24,textAlign:'left',borderTop:'1px solid var(--border)',paddingTop:20}}>
              {[
                { label:'Role', value:'Manager' },
                { label:'Status', value:'Active' },
              ].map(row => (
                <div key={row.label} style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                  <span style={{fontSize:'.8rem',color:'var(--fg3)'}}>{row.label}</span>
                  <span style={{fontSize:'.8rem',fontWeight:600,color:'var(--fg)'}}>{row.value}</span>
                </div>
              ))}
            </div>

            <button className="mgr-btn-primary" style={{width:'100%',marginTop:4}}
              onClick={() => setEditing(!editing)}>
              {editing ? '✕ Cancel Edit' : '✏️ Edit Profile'}
            </button>
          </div>

          {/* Details / Edit */}
          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            <div className="mgr-card">
              <h2 className="mgr-card-title" style={{marginBottom:20}}>
                {editing ? '✏️ Edit Profile' : '👤 Account Details'}
              </h2>
              {editing ? (
                <form onSubmit={handleSave}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-control" value={name}
                      onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-control" value={user?.email || ''} disabled
                      style={{opacity:.6,cursor:'not-allowed'}}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input className="form-control" value="Manager" disabled
                      style={{opacity:.6,cursor:'not-allowed'}}/>
                  </div>
                  <div style={{display:'flex',gap:10,marginTop:8}}>
                    <button type="submit" className="mgr-btn-primary">💾 Save Changes</button>
                    <button type="button" onClick={() => setEditing(false)}
                      style={{padding:'9px 20px',border:'1.5px solid var(--border)',borderRadius:'var(--r-sm)',background:'#fff',fontFamily:'inherit',fontWeight:600,cursor:'pointer'}}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  {[
                    { label:'Full Name', value: user?.name },
                    { label:'Email',     value: user?.email },
                    { label:'Role',      value: 'Manager' },
                    { label:'Account Status', value: 'Active' },
                  ].map(row => (
                    <div key={row.label} style={{
                      display:'flex',justifyContent:'space-between',
                      padding:'14px 0',borderBottom:'1px solid var(--border-2)',alignItems:'center',
                    }}>
                      <span style={{fontSize:'.85rem',color:'var(--fg3)',fontWeight:500}}>{row.label}</span>
                      <span style={{fontSize:'.875rem',fontWeight:600,color:'var(--fg)'}}>{row.value || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Permissions card */}
            <div className="mgr-card">
              <h2 className="mgr-card-title" style={{marginBottom:16}}>🛡️ Your Permissions</h2>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[
                  { label:'Upload Files',        ok:true  },
                  { label:'Share Files',          ok:true  },
                  { label:'Delete Own Files',     ok:true  },
                  { label:'Download Files',       ok:true  },
                  { label:'Manage Other Users',   ok:false },
                  { label:'Access Admin Panel',   ok:false },
                  { label:'System Settings',      ok:false },
                  { label:'View All User Files',  ok:false },
                ].map(p => (
                  <div key={p.label} style={{
                    display:'flex',alignItems:'center',gap:8,
                    padding:'8px 12px',borderRadius:'var(--r-sm)',
                    background: p.ok ? '#f0fdf4' : '#fafafa',
                    border: `1px solid ${p.ok ? '#bbf7d0' : '#e5e7eb'}`,
                  }}>
                    <span style={{color: p.ok ? '#059669' : '#9ca3af',fontWeight:700}}>
                      {p.ok ? '✓' : '✕'}
                    </span>
                    <span style={{fontSize:'.78rem',color: p.ok ? 'var(--fg2)' : 'var(--fg4)',fontWeight:500}}>
                      {p.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
