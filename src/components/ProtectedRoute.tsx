import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading, isAdmin, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && profile && !profile.is_approved && location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
};
