import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  AlertCircle,
  BarChart3,
  CreditCard,
  Download,
  FlaskConical,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Menu,
  Package,
  Truck,
  Upload,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStateContext } from '../state/AppStateContext';

interface SidebarProps {
  role: 'client' | 'courier' | 'point' | 'admin';
}

export function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const {
    state: { currentUser },
    logout,
  } = useAppStateContext();

  const getMenuItems = () => {
    switch (role) {
      case 'client':
        return [
          { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/client' },
          { icon: Package, label: t('nav.shipments'), path: '/client/shipments' },
          { icon: AlertCircle, label: t('nav.claims'), path: '/client/claims' },
          { icon: User, label: t('nav.profile'), path: '/client/profile' },
        ];
      case 'courier':
        return [
          { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/courier' },
          { icon: Package, label: t('nav.tasks'), path: '/courier/tasks' },
          { icon: User, label: t('nav.profile'), path: '/courier/profile' },
        ];
      case 'point':
        return [
          { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/point' },
          { icon: Package, label: t('nav.shipments'), path: '/point/shipments' },
          { icon: Upload, label: t('point.accept'), path: '/point/accept' },
          { icon: Download, label: t('point.release'), path: '/point/release' },
          { icon: CreditCard, label: t('point.confirmOffline'), path: '/point/payment-verification' },
          { icon: UserPlus, label: t('point.walkIn'), path: '/point/walk-in' },
          { icon: User, label: t('nav.profile'), path: '/point/profile' },
        ];
      case 'admin':
        if (currentUser?.adminScope === 'DISPATCHER') {
          return [
            { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/admin' },
            { icon: Package, label: t('nav.shipments'), path: '/admin/shipments' },
          ];
        }
        return [
          { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/admin' },
          { icon: Users, label: t('nav.users'), path: '/admin/users' },
          { icon: MapPin, label: t('nav.points'), path: '/admin/points' },
          { icon: Package, label: t('nav.shipments'), path: '/admin/shipments' },
          { icon: CreditCard, label: t('nav.payments'), path: '/admin/payments' },
          { icon: AlertCircle, label: t('nav.claims'), path: '/admin/claims' },
          { icon: BarChart3, label: t('nav.reports'), path: '/admin/reports' },
        ];
    }
  };

  const menuItems = getMenuItems();

  const demoItems =
    role === 'admin' && currentUser?.adminScope !== 'DISPATCHER'
      ? [
          { icon: FlaskConical, label: 'Laboratorium demo', path: '/admin/demo-lab' },
          { icon: Lock, label: 'Symulacja skrytek', path: '/admin/demo/locker' },
          { icon: Truck, label: 'Centrum sortowania', path: '/admin/demo/transit' },
          { icon: Package, label: 'Przekazania operacyjne', path: '/admin/demo/handover' },
        ]
      : [];

  const SidebarContent = () => (
    <>
      <div className="border-b border-sidebar-border p-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl text-sidebar-foreground">PingwinPost</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {demoItems.length > 0 ? (
          <div className="mt-4">
            <div className="mb-1 flex items-center gap-2 px-4 py-1">
              <FlaskConical className="h-3.5 w-3.5 text-sidebar-foreground/40" />
              <span className="text-xs uppercase tracking-wider text-sidebar-foreground/40">Narzędzia demo</span>
            </div>
            {demoItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <button
          onClick={() => {
            logout();
            setIsOpen(false);
            navigate('/login');
          }}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
        >
          <LogOut className="h-5 w-5" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-sidebar p-2 text-sidebar-foreground lg:hidden"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen ? <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsOpen(false)} /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar transition-transform lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
