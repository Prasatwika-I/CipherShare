import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading CipherShare...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirect = user.role === 'admin' ? '/admin/dashboard'
                   : user.role === 'manager' ? '/manager/dashboard'
                   : '/user/dashboard';
    return <Navigate to={redirect} replace />;
  }

  return children;
}
