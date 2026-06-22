import { useState } from 'react';
import Sidebar from '../../components/Sidebar';

function DonutChart({ percentage = 0, color = '#4f46e5', size = 120, label = '' }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percentage / 100) * circ;
  return (
    <div style={{ position:'relative', width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <svg width={size} height={size} style={{ position:'absolute', transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={12}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={12}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{transition:'stroke-dasharray 0.8s ease'}}/>
      </svg>
      <div style={{ position:'relative', textAlign:'center' }}>
        <div style={{ fontSize:'1.3rem', fontWeight:900, color }}>{percentage}%</div>
        {label && <div style={{ fontSize:'.65rem', color:'#6b7280' }}>{label}</div>}
      </div>
    </div>
  );
}

const INITIAL_SETTINGS = {
  siteName: 'CipherShare',
  maxFileSize: '50',
  sessionTimeout: '60',
  allowedFileTypes: '.pdf,.docx,.xlsx,.pptx,.txt,.zip,.jpg,.png',
  storageQuota: '100',
  maintenanceMode: false,
  emailNotifications: true,
  auditLogging: true,
  twoFactorAuth: false,
  fileEncryption: true,
  autoBackup: true,
  debugMode: false,
};

export default function SystemSettings() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // general | storage | security | notifications

  const storageUsed = 67;
  const storageTotal = parseInt(settings.storageQuota) || 100;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));
  const update  = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const TABS = [
    { id:'general',       label:'⚙️ General'       },
    { id:'storage',       label:'💾 Storage'        },
    { id:'security',      label:'🔒 Security'       },
    { id:'notifications', label:'🔔 Notifications'  },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content admin-main">
        {/* Header */}
        <div className="admin-banner">
          <div className="admin-banner-left">
            <div className="admin-banner-badge">
              <span>⚙️</span><span>System Settings</span>
            </div>
            <h1 className="admin-banner-title">System Settings</h1>
            <p className="admin-banner-sub">Configure system parameters, storage, and security policies</p>
          </div>
          <div className="admin-banner-right">
            {saved && <span className="admin-toast-inline">✅ Settings saved!</span>}
            <button className="btn btn-primary" onClick={handleSave}>
              💾 Save Changes
            </button>
          </div>
        </div>

        {/* System Health Overview */}
        <div className="sys-health-grid">
          <div className="glass-card-admin sys-health-card">
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <DonutChart percentage={storageUsed} color={storageUsed > 80 ? '#dc2626' : '#4f46e5'} size={100} label="Used"/>
              <div>
                <div className="card-title-admin">Storage Usage</div>
                <div className="card-sub-admin">{storageUsed} GB of {storageTotal} GB used</div>
                <div style={{marginTop:8}}>
                  <div className="hi-bar-bg" style={{width:180}}>
                    <div className="hi-bar-fill" style={{width:`${(storageUsed/storageTotal)*100}%`, background: storageUsed > 80 ? '#dc2626' : '#4f46e5'}}/>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {[
            { icon:'🟢', label:'API Server',     status:'Online',  uptime:'99.8%', color:'#059669' },
            { icon:'🟢', label:'Database',       status:'Healthy', uptime:'99.9%', color:'#059669' },
            { icon:'🟢', label:'File System',    status:'Active',  uptime:'99.5%', color:'#059669' },
            { icon:'🟢', label:'Auth Service',   status:'Running', uptime:'100%',  color:'#059669' },
          ].map((h, i) => (
            <div key={i} className="glass-card-admin sys-health-card" style={{borderTop:`3px solid ${h.color}`}}>
              <div style={{fontSize:'1.5rem',marginBottom:8}}>{h.icon}</div>
              <div style={{fontWeight:700,fontSize:'.9rem',color:'var(--fg)'}}>{h.label}</div>
              <div style={{color:h.color,fontSize:'.8rem',fontWeight:600,margin:'4px 0'}}>{h.status}</div>
              <div style={{fontSize:'.75rem',color:'var(--fg4)'}}>Uptime: <strong>{h.uptime}</strong></div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`settings-tab ${activeTab===t.id?'active':''}`} onClick={()=>setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="settings-content">

          {activeTab === 'general' && (
            <div className="glass-card-admin">
              <h2 className="card-title-admin" style={{marginBottom:24}}>General Configuration</h2>
              <div className="settings-form-grid">
                <div className="form-group">
                  <label className="form-label">System Name</label>
                  <input type="text" className="form-control"
                    value={settings.siteName} onChange={e => update('siteName', e.target.value)}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Session Timeout (minutes)</label>
                  <input type="number" className="form-control"
                    value={settings.sessionTimeout} onChange={e => update('sessionTimeout', e.target.value)}/>
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Allowed File Types</label>
                  <input type="text" className="form-control"
                    value={settings.allowedFileTypes} onChange={e => update('allowedFileTypes', e.target.value)}/>
                  <div style={{fontSize:'.75rem',color:'var(--fg4)',marginTop:4}}>Comma-separated extensions (e.g., .pdf,.docx)</div>
                </div>
              </div>
              <div className="settings-toggles">
                {[
                  { key:'maintenanceMode',  label:'Maintenance Mode',   desc:'Temporarily block all non-admin access', danger:true  },
                  { key:'debugMode',        label:'Debug Mode',          desc:'Enable verbose logging and error details', danger:true  },
                ].map(s => (
                  <div key={s.key} className={`settings-toggle-item ${s.danger ? 'danger-toggle' : ''}`}>
                    <div>
                      <div className="stg-label">{s.label}</div>
                      <div className="stg-desc">{s.desc}</div>
                    </div>
                    <div className={`toggle-switch ${settings[s.key] ? 'on' : 'off'}`} onClick={() => toggle(s.key)}>
                      <div className="toggle-thumb"/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="glass-card-admin">
              <h2 className="card-title-admin" style={{marginBottom:24}}>Storage Management</h2>
              <div className="settings-form-grid">
                <div className="form-group">
                  <label className="form-label">Max File Size (MB)</label>
                  <input type="number" className="form-control"
                    value={settings.maxFileSize} onChange={e => update('maxFileSize', e.target.value)}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Storage Quota (GB)</label>
                  <input type="number" className="form-control"
                    value={settings.storageQuota} onChange={e => update('storageQuota', e.target.value)}/>
                </div>
              </div>

              {/* Storage breakdown */}
              <div style={{marginTop:24}}>
                <div className="card-title-admin" style={{marginBottom:16}}>Storage Breakdown</div>
                <div className="storage-breakdown">
                  {[
                    { label:'PDFs',       pct:28, color:'#4f46e5', size:'18.7 GB' },
                    { label:'Images',     pct:22, color:'#059669', size:'14.7 GB' },
                    { label:'Documents',  pct:18, color:'#2563eb', size:'12.1 GB' },
                    { label:'Archives',   pct:12, color:'#7c3aed', size:'8.1 GB'  },
                    { label:'Other',      pct:20, color:'#d97706', size:'13.4 GB' },
                  ].map((b,i) => (
                    <div key={i} className="sb-item">
                      <div className="sb-top">
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:10,height:10,borderRadius:'50%',background:b.color,flexShrink:0}}/>
                          <span style={{fontWeight:600,fontSize:'.875rem'}}>{b.label}</span>
                        </div>
                        <div style={{display:'flex',gap:12}}>
                          <span style={{color:'var(--fg4)',fontSize:'.8rem'}}>{b.size}</span>
                          <span style={{fontWeight:700,color:b.color,fontSize:'.8rem'}}>{b.pct}%</span>
                        </div>
                      </div>
                      <div className="hi-bar-bg">
                        <div className="hi-bar-fill" style={{width:`${b.pct}%`, background:b.color}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="settings-toggles" style={{marginTop:24}}>
                <div className="settings-toggle-item">
                  <div>
                    <div className="stg-label">Auto Backup</div>
                    <div className="stg-desc">Automatically backup files daily</div>
                  </div>
                  <div className={`toggle-switch ${settings.autoBackup ? 'on' : 'off'}`} onClick={() => toggle('autoBackup')}>
                    <div className="toggle-thumb"/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="glass-card-admin">
              <h2 className="card-title-admin" style={{marginBottom:24}}>Security Settings</h2>
              <div className="settings-toggles">
                {[
                  { key:'fileEncryption',  label:'File Encryption',        desc:'AES-256 encryption for all stored files', icon:'🔐' },
                  { key:'auditLogging',    label:'Audit Logging',           desc:'Log all user actions for compliance',      icon:'📋' },
                  { key:'twoFactorAuth',   label:'Two-Factor Authentication', desc:'Require 2FA for all admin accounts',    icon:'📱' },
                ].map(s => (
                  <div key={s.key} className="settings-toggle-item">
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontSize:'1.4rem'}}>{s.icon}</span>
                      <div>
                        <div className="stg-label">{s.label}</div>
                        <div className="stg-desc">{s.desc}</div>
                      </div>
                    </div>
                    <div className={`toggle-switch ${settings[s.key] ? 'on' : 'off'}`} onClick={() => toggle(s.key)}>
                      <div className="toggle-thumb"/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:24, padding:16, background:'#f0fdf4', borderRadius:12, border:'1px solid #bbf7d0'}}>
                <div style={{fontWeight:700, color:'#059669', marginBottom:8}}>🛡️ Security Score: Excellent</div>
                <div style={{fontSize:'.875rem', color:'#6b7280'}}>
                  Your system has RBAC enabled, file encryption active, and audit logging running.
                  Enable 2FA to achieve maximum security.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="glass-card-admin">
              <h2 className="card-title-admin" style={{marginBottom:24}}>Notification Settings</h2>
              <div className="settings-toggles">
                {[
                  { key:'emailNotifications', label:'Email Notifications', desc:'Send email alerts for important events', icon:'📧' },
                ].map(s => (
                  <div key={s.key} className="settings-toggle-item">
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontSize:'1.4rem'}}>{s.icon}</span>
                      <div>
                        <div className="stg-label">{s.label}</div>
                        <div className="stg-desc">{s.desc}</div>
                      </div>
                    </div>
                    <div className={`toggle-switch ${settings[s.key] ? 'on' : 'off'}`} onClick={() => toggle(s.key)}>
                      <div className="toggle-thumb"/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:24}}>
                <div className="card-title-admin" style={{marginBottom:12}}>Notification Events</div>
                {[
                  'New user registration',
                  'Role changes',
                  'Large file uploads (>10MB)',
                  'Failed login attempts',
                  'Storage quota exceeded',
                  'System errors',
                ].map((ev, i) => (
                  <div key={i} className="settings-toggle-item" style={{borderBottom:'1px solid var(--border)'}}>
                    <span style={{fontSize:'.875rem', color:'var(--fg2)'}}>{ev}</span>
                    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                      <input type="checkbox" defaultChecked={i < 4}
                        style={{accentColor:'var(--indigo)',width:16,height:16}}/>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
