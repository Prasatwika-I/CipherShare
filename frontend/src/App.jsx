import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Landing page
import LandingPage from './pages/LandingPage';

// Auth pages
import Login    from './pages/Login';
import Register from './pages/Register';

// Admin pages
import AdminDashboard  from './pages/admin/Dashboard';
import ManageUsers     from './pages/admin/ManageUsers';
import ManageFiles     from './pages/admin/ManageFiles';
import ViewLogs        from './pages/admin/ViewLogs';
import RoleManagement  from './pages/admin/RoleManagement';
import AccessControl   from './pages/admin/AccessControl';
import SystemSettings  from './pages/admin/SystemSettings';

// Manager pages
import ManagerDashboard from './pages/manager/Dashboard';
import MyFiles          from './pages/manager/MyFiles';
import UploadFile       from './pages/manager/UploadFile';
import ShareFile        from './pages/manager/ShareFile';
import ManagerSharedFiles from './pages/manager/SharedFiles';
import FileStatus       from './pages/manager/FileStatus';
import ManagerActivity  from './pages/manager/RecentActivity';
import ManagerProfile   from './pages/manager/Profile';
import ManagerUsers     from './pages/manager/Users';

// User pages
import UserDashboard    from './pages/user/Dashboard';
import SharedFiles      from './pages/user/SharedFiles';
import UserNotifications from './pages/user/Notifications';
import RecentDownloads  from './pages/user/RecentDownloads';
import Profile          from './pages/user/Profile';
import SecureViewer     from './pages/user/SecureViewer';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin routes */}
          <Route path="/admin/dashboard"       element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/manage-users"    element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
          <Route path="/admin/manage-files"    element={<ProtectedRoute allowedRoles={['admin']}><ManageFiles /></ProtectedRoute>} />
          <Route path="/admin/view-logs"       element={<ProtectedRoute allowedRoles={['admin']}><ViewLogs /></ProtectedRoute>} />
          <Route path="/admin/role-management" element={<ProtectedRoute allowedRoles={['admin']}><RoleManagement /></ProtectedRoute>} />
          <Route path="/admin/access-control"  element={<ProtectedRoute allowedRoles={['admin']}><AccessControl /></ProtectedRoute>} />
          <Route path="/admin/system-settings" element={<ProtectedRoute allowedRoles={['admin']}><SystemSettings /></ProtectedRoute>} />

          {/* Manager routes */}
          <Route path="/manager/dashboard"       element={<ProtectedRoute allowedRoles={['manager','admin']}><ManagerDashboard /></ProtectedRoute>} />
          <Route path="/manager/my-files"        element={<ProtectedRoute allowedRoles={['manager','admin']}><MyFiles /></ProtectedRoute>} />
          <Route path="/manager/upload-file"     element={<ProtectedRoute allowedRoles={['manager','admin']}><UploadFile /></ProtectedRoute>} />
          <Route path="/manager/share-file"      element={<ProtectedRoute allowedRoles={['manager','admin']}><ShareFile /></ProtectedRoute>} />
          <Route path="/manager/shared-files"    element={<ProtectedRoute allowedRoles={['manager','admin']}><ManagerSharedFiles /></ProtectedRoute>} />
          <Route path="/manager/file-status"     element={<ProtectedRoute allowedRoles={['manager','admin']}><FileStatus /></ProtectedRoute>} />
          <Route path="/manager/recent-activity" element={<ProtectedRoute allowedRoles={['manager','admin']}><ManagerActivity /></ProtectedRoute>} />
          <Route path="/manager/profile"         element={<ProtectedRoute allowedRoles={['manager','admin']}><ManagerProfile /></ProtectedRoute>} />
          <Route path="/manager/users"           element={<ProtectedRoute allowedRoles={['manager','admin']}><ManagerUsers /></ProtectedRoute>} />
          {/* Legacy team-files redirect */}
          <Route path="/manager/team-files" element={<ProtectedRoute allowedRoles={['manager','admin']}><ManagerDashboard /></ProtectedRoute>} />

          {/* Employee routes */}
          <Route path="/user/dashboard"        element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="/user/shared-files"     element={<ProtectedRoute><SharedFiles /></ProtectedRoute>} />
          <Route path="/user/notifications"    element={<ProtectedRoute><UserNotifications /></ProtectedRoute>} />
          <Route path="/user/recent-downloads" element={<ProtectedRoute><RecentDownloads /></ProtectedRoute>} />
          <Route path="/user/profile"          element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/preview/:fileId"       element={<ProtectedRoute><SecureViewer /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
