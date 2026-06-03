import type { ReactNode } from 'react';
import type { UserRole } from '../types';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { usePageTitle } from '../hooks/usePageTitle';

interface DashboardShellProps {
  role: UserRole;
  title: string;
  children: ReactNode;
}

export function DashboardShell({ role, title, children }: DashboardShellProps) {
  usePageTitle(title);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar role={role} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
