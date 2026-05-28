import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultPath } from '../config/permissions';

export default function PermissionRoute({ permission, children }) {
  const { user, loading, can } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!can(permission)) {
    return <Navigate to={getDefaultPath(user?.role)} replace />;
  }

  return children;
}
