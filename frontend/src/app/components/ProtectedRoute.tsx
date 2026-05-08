import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { getDashboardPath } from '../navigation';
import type { UserRole } from '../types';
import { useAppStateContext } from '../state/AppStateContext';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children?: ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const {
    state: { currentUser, isLoading },
  } = useAppStateContext();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={getDashboardPath(currentUser.role)} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
