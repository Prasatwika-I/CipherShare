import { useState } from 'react';
import Sidebar from '../../components/Sidebar';

// 3 roles only: Admin, Manager, User (stored as 'employee' in backend)
const ROLES_CONFIG = [
  {
    id: 'admin',
    name: 'Admin',
    icon: '👑',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    users: 1,
    description: 'Full system access and control',
    permissions: [
      'Add / Edit / Delete users',
      'Activate & deactivate users',
      'Assign & change roles',
      'View all files in the system',
      'Delete any file',
      'Grant & revoke permissions',
      'View full activity logs',
      'Monitor storage usage',
      'System settings',
    ],
  },
  {
    id: 'manager',
    name: 'Manager',
    icon: '🎯',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    users: 3,
    description: 'File management and sharing',
    permissions: [
      'Upload files',
      'Edit own files',
      'Delete own files',
      'Share files with users',
      'View shared files',
      'Search files',
      'Download authorized files',
      'Track shared file status',
    ],
    restricted: [
      'Cannot manage other users',
      'Cannot delete other users\' files',
      'Cannot view audit logs',
      'Cannot change system settings',
    ],
  },
  {
    id: 'employee',
    name: 'User',
    icon: '👤',
    color: '#059669',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    users: 8,
    description: 'View and download authorized files',
    permissions: [
      'View authorized files',
      'Download authorized files',
      'Upload files (if permitted)',
      'View files shared with them',
      'Search files',
    ],
    restricted: [
      'Cannot share files',
      'Cannot delete files',
      'Cannot manage users',
      'Cannot access admin area',
    ],
  },
];

// 3 columns only — matches the 3 real roles
const PERMISSION_MATRIX = [
  { perm: 'View Dashboard',            admin: true,  manager: true,  employee: true  },
  { perm: 'Upload Files',              admin: true,  manager: true,  employee: false },
  { perm: 'Upload Files (if allowed)', admin: true,  manager: true,  employee: true  },
  { perm: 'Download Authorized Files', admin: true,  manager: true,  employee: true  },
  { perm: 'Share Files',               admin: true,  manager: true,  employee: false },
  { perm: 'Edit Own Files',            admin: true,  manager: true,  employee: false },
  { perm: 'Delete Own Files',          admin: true,  manager: true,  employee: false },
  { perm: 'Delete Any File',           admin: true,  manager: false, employee: false },
  { perm: 'Search Files',              admin: true,  manager: true,  employee: true  },
  { perm: 'View Shared Files',         admin: true,  manager: true,  employee: true  },
  { perm: 'Track Shared File Status',  admin: true,  manager: true,  employee: false },
  { perm: 'View All Users',            admin: true,  manager: false, employee: false },
  { perm: 'Add / Edit / Delete Users', admin: true,  manager: false, employee: false },
  { perm: 'Assign Roles',              admin: true,  manager: false, employee: false },
  { perm: 'Grant / Revoke Permissions',admin: true,  manager: false, employee: false },
  { perm: 'View Audit Logs',           admin: true,  manager: false, employee: false },
  { perm: 'Monitor Storage',           admin: true,  manager: false, employee: false },
  { perm: 'System Settings',           admin: true,  manager: false, employee: false },
];

export default function RoleManagement() {
  const [activeTab, setActiveTab] = useState('cards'); // 'cards' | 'matrix'

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content admin-main">

        {/* Header */}
        <div className="admin-banner">
          <div className="admin-banner-left">
            <div className="admin-banner-badge">
              <span>🔑</span><span>Role Management</span>
            </div>
            <h1 className="admin-banner-title">Role Management</h1>
            <p className="admin-banner-sub">
              3 roles: Admin · Manager · User — control what each role can access
            </p>
          </div>
          <div className="admin-banner-right">
            <div className="view-toggle" style={{ background: '#f3f4f6', borderRadius: 8, padding: 4 }}>
              <button
                className={`vt-btn ${activeTab === 'cards' ? 'active' : ''}`}
                onClick={() => setActiveTab('cards')}
              >
                ⊞ Role Cards
              </button>
              <button
                className={`vt-btn ${activeTab === 'matrix' ? 'active' : ''}`}
                onClick={() => setActiveTab('matrix')}
              >
                📊 Permission Matrix
              </button>
            </div>
          </div>
        </div>

        {/* Role summary strip */}
        <div className="user-mini-stats" style={{ marginBottom: 24 }}>
          {ROLES_CONFIG.map(r => (
            <div key={r.id} className="ums-card" style={{ borderTop: `3px solid ${r.color}` }}>
              <div className="ums-num" style={{ color: r.color }}>{r.users}</div>
              <div className="ums-lbl">{r.name}{r.users !== 1 ? 's' : ''}</div>
            </div>
          ))}
          <div className="ums-card" style={{ borderTop: '3px solid #4f46e5' }}>
            <div className="ums-num" style={{ color: '#4f46e5' }}>
              {ROLES_CONFIG.reduce((s, r) => s + r.users, 0)}
            </div>
            <div className="ums-lbl">Total Users</div>
          </div>
        </div>

        {activeTab === 'cards' ? (
          <div className="role-cards-grid">
            {ROLES_CONFIG.map(role => (
              <div
                key={role.id}
                className="role-card"
                style={{ '--rc': role.color, '--rcbg': role.bg, '--rcborder': role.border }}
              >
                {/* Card header */}
                <div
                  className="rc-header"
                  style={{ background: `linear-gradient(135deg, ${role.bg}, ${role.color}12)` }}
                >
                  <div
                    className="rc-icon-wrap"
                    style={{ background: role.bg, border: `2px solid ${role.border}` }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{role.icon}</span>
                  </div>
                  <div className="rc-meta">
                    <h3 className="rc-name" style={{ color: role.color }}>{role.name}</h3>
                    <p className="rc-desc">{role.description}</p>
                  </div>
                  <div
                    className="rc-user-count"
                    style={{ background: role.bg, color: role.color, border: `1px solid ${role.border}` }}
                  >
                    {role.users} user{role.users !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Permissions */}
                <div className="rc-body">
                  <div className="rc-perms-title">✅ Allowed</div>
                  <div className="rc-perms-list">
                    {role.permissions.map((p, i) => (
                      <div key={i} className="rc-perm-item allowed">
                        <span className="rcp-check" style={{ color: role.color }}>✓</span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                  {role.restricted && role.restricted.length > 0 && (
                    <>
                      <div className="rc-perms-title" style={{ marginTop: 12 }}>🚫 Restricted</div>
                      <div className="rc-perms-list">
                        {role.restricted.map((p, i) => (
                          <div key={i} className="rc-perm-item restricted">
                            <span className="rcp-check" style={{ color: '#dc2626' }}>✗</span>
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="rc-footer">
                  <button
                    className="btn btn-outline-indigo btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => alert('Role editing — connect to backend')}
                  >
                    ✏️ Edit Permissions
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{
                      flex: 1,
                      background: role.bg,
                      color: role.color,
                      border: `1px solid ${role.border}`,
                    }}
                    onClick={() => alert('Assign users — connect to backend')}
                  >
                    👥 Assign Users
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Permission Matrix ── */
          <div className="glass-card-admin">
            <div className="card-header-admin">
              <div>
                <h2 className="card-title-admin">Permission Matrix</h2>
                <p className="card-sub-admin">
                  Full breakdown of what each role can do in CipherShare
                </p>
              </div>
            </div>
            <div className="table-container">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 220, textAlign: 'left' }}>Permission</th>
                    {ROLES_CONFIG.map(r => (
                      <th key={r.id} style={{ textAlign: 'center', minWidth: 120 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: '1.2rem' }}>{r.icon}</span>
                          <span style={{ color: r.color, fontWeight: 700 }}>{r.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_MATRIX.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, fontSize: '.875rem' }}>{row.perm}</td>
                      {ROLES_CONFIG.map(r => (
                        <td key={r.id} style={{ textAlign: 'center' }}>
                          {row[r.id] ? (
                            <span
                              className="matrix-check yes"
                              style={{
                                background: r.bg,
                                color: r.color,
                                border: `1px solid ${r.border}`,
                                borderRadius: 100,
                                padding: '3px 10px',
                                fontSize: '.72rem',
                                fontWeight: 700,
                              }}
                            >
                              ✓
                            </span>
                          ) : (
                            <span className="matrix-check no">✗</span>
                          )}
                        </td>
                      ))}
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
