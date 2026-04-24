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
    state: { currentUser },
  } = useAppStateContext();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={getDashboardPath(currentUser.role)} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
