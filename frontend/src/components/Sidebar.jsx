import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/ciphershare-logo.png.png';

const navItems = {
  admin: [
    { to: '/admin/dashboard',       icon: '📊', label: 'Dashboard'        },
    { to: '/admin/manage-users',    icon: '👥', label: 'User Management'  },
    { to: '/admin/role-management', icon: '🔑', label: 'Role Management'  },
    { to: '/admin/manage-files',    icon: '📁', label: 'File Management'  },
    { to: '/admin/access-control',  icon: '🛡️', label: 'Access Control'   },
    { to: '/admin/view-logs',       icon: '📋', label: 'Activity Logs'    },
    { to: '/admin/system-settings', icon: '⚙️', label: 'System Settings'  },
  ],
  manager: [
    { to: '/manager/dashboard',       icon: '📊', label: 'Dashboard'       },
    { to: '/manager/my-files',        icon: '📁', label: 'My Files'        },
    { to: '/manager/users',           icon: '👥', label: 'Users'           },
    { to: '/manager/upload-file',     icon: '⬆️', label: 'Upload File'    },
    { to: '/manager/share-file',      icon: '🔗', label: 'Share File'      },
    { to: '/manager/shared-files',    icon: '📤', label: 'Shared Files'    },
    { to: '/manager/file-status',     icon: '📊', label: 'File Status'     },
    { to: '/manager/recent-activity', icon: '🕐', label: 'Recent Activity' },
    { to: '/manager/profile',         icon: '👤', label: 'Profile'         },
  ],
  employee: [
    { to: '/user/dashboard',         icon: '📊', label: 'Dashboard'          },
    { to: '/user/shared-files',      icon: '📁', label: 'Files Shared With Me' },
    { to: '/user/recent-downloads',  icon: '⬇️', label: 'Recent Downloads'   },
    { to: '/user/notifications',     icon: '🔔', label: 'Notifications'      },
    { to: '/user/profile',           icon: '👤', label: 'Profile'            },
  ],
};

const roleColors = {
  admin:    { border: '#fecaca', dot: '#dc2626' },
  manager:  { border: '#bfdbfe', dot: '#2563eb' },
  employee: { border: '#bbf7d0', dot: '#059669' },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role   = user?.role || 'employee';
  const items  = navItems[role] || navItems.employee;
  const colors = roleColors[role] || roleColors.employee;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-2)' }}>
        <img src={logoImg} alt="CipherShare Logo" style={{ width: '100%', maxWidth: '170px', height: 'auto', objectFit: 'contain' }} />
      </div>

      {/* Role badge — "employee" stored in backend, displayed as "User" */}
      <div className={`sidebar-role-badge badge-${role}`}
        style={{ borderLeft: `3px solid ${colors.dot}` }}>
        <span style={{ color: colors.dot, marginRight: 4 }}>●</span>
        {role === 'admin'
          ? '👑 Admin'
          : role === 'manager'
          ? '🎯 Manager'
          : '👤 User'}
        {role === 'admin' && <span style={{ fontSize: '.6rem', marginLeft: 4, opacity: .7 }}>· Full Access</span>}
      </div>

      {/* Back button */}
      <button onClick={() => navigate(-1)} className="sidebar-home-link" style={{ width: 'calc(100% - 24px)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Go Back
      </button>

      {/* Nav Section Label */}
      {role === 'admin' && (
        <div className="sidebar-section-label">ADMIN CONTROLS</div>
      )}

      {/* Nav links */}
      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', margin: '0 16px 8px' }} />

      {/* Logout nav item */}
      <nav className="sidebar-nav" style={{ paddingTop: 0, paddingBottom: 4 }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px',
            borderRadius: 'var(--r-sm)', color: '#dc2626', fontSize: '.875rem',
            fontWeight: 500, background: 'transparent', border: 'none',
            cursor: 'pointer', width: '100%', textAlign: 'left',
            transition: 'var(--t)', marginBottom: 2,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <span className="nav-icon">🚪</span>
          Logout
        </button>
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className={`user-avatar ${role}-avatar`} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.profilePictureUrl ? (
              <img src={user.profilePictureUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.name}
            </div>
            <div className="user-role-text">{user?.department || user?.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
