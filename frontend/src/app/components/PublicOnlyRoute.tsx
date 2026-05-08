import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { getDashboardPath } from '../navigation';
import { useAppStateContext } from '../state/AppStateContext';

interface PublicOnlyRouteProps {
  children?: ReactNode;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const {
    state: { currentUser, isLoading },
  } = useAppStateContext();

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (currentUser) {
    return <Navigate to={getDashboardPath(currentUser.role)} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
