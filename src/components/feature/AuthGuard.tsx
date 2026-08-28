import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

export default function AuthGuard({ children, allowedRoles, requireAuth = true }: AuthGuardProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fafaf9]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-stone-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!requireAuth && user) {
    if (profile?.role === 'pending_freelancer') {
      return <Navigate to="/portal" replace />;
    }
    if (profile?.role === 'freelancer' || profile?.role === 'super_admin' || profile?.role === 'dfp_admin' || profile?.role === 'project_manager' || profile?.role === 'finance') {
      return <Navigate to={profile.role === 'freelancer' ? '/portal' : '/admin'} replace />;
    }
    return <Navigate to="/portal" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorised" replace />;
  }

  if (profile?.account_status === 'suspended') {
    return <Navigate to="/account-suspended" replace />;
  }

  return <>{children}</>;
}