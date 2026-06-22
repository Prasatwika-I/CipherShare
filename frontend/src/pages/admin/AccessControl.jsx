import { useState } from 'react';
import Sidebar from '../../components/Sidebar';

// Only 3 roles — matches the backend: admin, manager, employee (displayed as "User")
const ROLE_META = {
  admin:    { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '👑', label: 'Admin'   },
  manager:  { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '🎯', label: 'Manager' },
  employee: { color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', icon: '👤', label: 'User'    },
};

// Sample data — 3 roles only (no viewer)
const MOCK_USERS = [
  { uid: 'u1', name: 'Alice Johnson', email: 'alice@company.com', role: 'manager',  active: true  },
  { uid: 'u2', name: 'Bob Smith',     email: 'bob@company.com',   role: 'employee', active: true  },
  { uid: 'u3', name: 'Carol White',   email: 'carol@company.com', role: 'employee', active: false },
  { uid: 'u4', name: 'David Lee',     email: 'david@company.com', role: 'employee', active: true  },
];

const MOCK_FILES = [
  { fid: 'f1', name: 'Q4_Report.pdf',     owner: 'Alice Johnson', shared: ['u2', 'u4'] },
  { fid: 'f2', name: 'Budget_2025.xlsx',  owner: 'Bob Smith',     shared: ['u1']       },
  { fid: 'f3', name: 'HR_Policy.docx',    owner: 'Alice Johnson', shared: []            },
  { fid: 'f4', name: 'Meeting_Notes.txt', owner: 'Carol White',   shared: ['u1', 'u2'] },
];

export default function AccessControl() {
  const [activeTab, setActiveTab]   = useState('user-access'); // 'user-access' | 'file-access'
  const [selectedUser, setSelectedUser] = useState(null);
  const [grantMsg, setGrantMsg]     = useState(null);

  const notify = (msg) => {
    setGrantMsg(msg);
    setTimeout(() => setGrantMsg(null), 3000);
  };

  const handleGrant  = (fileId, userId) =>
    notify(`✅ Access granted to ${MOCK_USERS.find(u => u.uid === userId)?.name}`);

  const handleRevoke = (fileId, userId) =>
    notify(`🚫 Access revoked for ${MOCK_USERS.find(u => u.uid === userId)?.name}`);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content admin-main">

        {/* Header */}
        <div className="admin-banner">
          <div className="admin-banner-left">
            <div className="admin-banner-badge">
              <span>🛡️</span><span>Access Control</span>
            </div>
            <h1 className="admin-banner-title">Access Control</h1>
            <p className="admin-banner-sub">Grant or revoke file access — control what each user can see</p>
          </div>
          <div className="admin-banner-right">
            <div className="view-toggle" style={{ background: '#f3f4f6', borderRadius: 8, padding: 4 }}>
              <button
                className={`vt-btn ${activeTab === 'user-access' ? 'active' : ''}`}
                onClick={() => setActiveTab('user-access')}
              >
                👥 User Access
              </button>
              <button
                className={`vt-btn ${activeTab === 'file-access' ? 'active' : ''}`}
                onClick={() => setActiveTab('file-access')}
              >
                📁 File Access
              </button>
            </div>
          </div>
        </div>

        {/* Toast */}
        {grantMsg && <div className="admin-toast">{grantMsg}</div>}

        {/* Stats */}
        <div className="user-mini-stats">
          {[
            { label: 'Total Users',  val: MOCK_USERS.length,                             color: '#4f46e5' },
            { label: 'Active Users', val: MOCK_USERS.filter(u => u.active).length,       color: '#059669' },
            { label: 'Total Files',  val: MOCK_FILES.length,                             color: '#2563eb' },
            { label: 'Shared Files', val: MOCK_FILES.filter(f => f.shared.length > 0).length, color: '#7c3aed' },
          ].map((s, i) => (
            <div key={i} className="ums-card" style={{ borderTop: `3px solid ${s.color}` }}>
              <div className="ums-num" style={{ color: s.color }}>{s.val}</div>
              <div className="ums-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {activeTab === 'user-access' ? (
          <div className="ac-grid">
            {/* User list */}
            <div className="glass-card-admin" style={{ minWidth: 240 }}>
              <div className="card-header-admin">
                <div>
                  <h2 className="card-title-admin">Users</h2>
                  <p className="card-sub-admin">Select a user to manage access</p>
                </div>
              </div>
              <div className="ac-user-list">
                {MOCK_USERS.map(u => {
                  const m = ROLE_META[u.role] || ROLE_META.employee;
                  const isSelected = selectedUser?.uid === u.uid;
                  return (
                    <div
                      key={u.uid}
                      className={`ac-user-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedUser(u)}
                      style={isSelected ? { borderColor: m.color, background: m.bg } : {}}
                    >
                      <div className={`user-avatar-sm ${u.role}-avatar`}>{u.name[0]}</div>
                      <div className="ac-user-info">
                        <div className="ac-user-name">{u.name}</div>
                        <div className="ac-user-meta">
                          <span
                            className="admin-role-badge"
                            style={{ background: m.bg, color: m.color, fontSize: '.65rem', padding: '2px 8px' }}
                          >
                            {m.icon} {m.label}
                          </span>
                          <span
                            className={`admin-status-badge ${u.active ? 'active' : 'inactive'}`}
                            style={{ fontSize: '.65rem', padding: '2px 8px' }}
                          >
                            {u.active ? '● Active' : '○ Inactive'}
                          </span>
                        </div>
                      </div>
                      {isSelected && <span style={{ color: m.color, fontWeight: 700 }}>→</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* File access panel */}
            <div className="glass-card-admin" style={{ flex: 2 }}>
              {!selectedUser ? (
                <div className="empty-state">
                  <div className="empty-icon">👈</div>
                  <p>Select a user to manage their file access</p>
                </div>
              ) : (
                <>
                  <div className="card-header-admin">
                    <div>
                      <h2 className="card-title-admin">File Access — {selectedUser.name}</h2>
                      <p className="card-sub-admin">Grant or revoke file permissions for this user</p>
                    </div>
                  </div>
                  <div className="ac-file-list">
                    {MOCK_FILES.map(file => {
                      const hasAccess = file.shared.includes(selectedUser.uid);
                      const isOwner   = file.owner === selectedUser.name;
                      return (
                        <div key={file.fid} className="ac-file-item">
                          <span style={{ fontSize: '1.4rem' }}>📄</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{file.name}</div>
                            <div style={{ fontSize: '.75rem', color: 'var(--fg4)' }}>Owner: {file.owner}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {isOwner ? (
                              <span className="access-badge owner">👑 Owner</span>
                            ) : hasAccess ? (
                              <>
                                <span className="access-badge granted">✓ Has Access</span>
                                <button
                                  className="admin-action-btn danger"
                                  title="Revoke access"
                                  onClick={() => handleRevoke(file.fid, selectedUser.uid)}
                                >
                                  🚫
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="access-badge denied">✗ No Access</span>
                                <button
                                  className="admin-action-btn primary"
                                  title="Grant access"
                                  onClick={() => handleGrant(file.fid, selectedUser.uid)}
                                >
                                  ✅
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* ── File Access tab — interactive matrix ── */
          <div className="glass-card-admin">
            <div className="card-header-admin">
              <div>
                <h2 className="card-title-admin">File Access Matrix</h2>
                <p className="card-sub-admin">
                  Click ✓ / ✗ to grant or revoke access for each user per file
                </p>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', minWidth: 180 }}>File</th>
                    <th style={{ minWidth: 100 }}>Owner</th>
                    {MOCK_USERS.map(u => {
                      const m = ROLE_META[u.role] || ROLE_META.employee;
                      return (
                        <th key={u.uid} style={{ textAlign: 'center', minWidth: 110 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <div
                              className={`user-avatar-sm ${u.role}-avatar`}
                              style={{ width: 26, height: 26, fontSize: '.65rem', margin: '0 auto' }}
                            >
                              {u.name[0]}
                            </div>
                            <span style={{ fontSize: '.7rem', fontWeight: 600 }}>{u.name.split(' ')[0]}</span>
                            <span style={{ fontSize: '.6rem', color: m.color }}>{m.label}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_FILES.map(file => (
                    <tr key={file.fid}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>📄</span>
                          <span style={{ fontWeight: 600, fontSize: '.875rem' }}>{file.name}</span>
                        </div>
                      </td>
                      <td className="text-secondary text-sm">{file.owner}</td>
                      {MOCK_USERS.map(u => {
                        const isOwner   = file.owner === u.name;
                        const hasAccess = file.shared.includes(u.uid);
                        return (
                          <td key={u.uid} style={{ textAlign: 'center' }}>
                            {isOwner ? (
                              <span
                                style={{
                                  background: '#fef9c3', color: '#ca8a04',
                                  border: '1px solid #fde68a', borderRadius: 100,
                                  padding: '3px 8px', fontSize: '.65rem', fontWeight: 700,
                                }}
                              >
                                Own
                              </span>
                            ) : (
                              <button
                                className={`matrix-toggle ${hasAccess ? 'on' : 'off'}`}
                                title={hasAccess ? 'Click to revoke' : 'Click to grant'}
                                onClick={() =>
                                  hasAccess
                                    ? handleRevoke(file.fid, u.uid)
                                    : handleGrant(file.fid, u.uid)
                                }
                              >
                                {hasAccess ? '✓' : '✗'}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
