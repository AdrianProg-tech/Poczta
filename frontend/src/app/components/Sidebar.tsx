import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  MapPin, 
  Users, 
  CreditCard, 
  AlertCircle, 
  BarChart3,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  role: 'client' | 'courier' | 'point' | 'admin';
}

export function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const getMenuItems = () => {
    switch (role) {
      case 'client':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/client' },
          { icon: Package, label: 'Przesyłki', path: '/client/shipments' },
          { icon: AlertCircle, label: 'Reklamacje', path: '/client/claims' },
        ];
      case 'courier':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/courier' },
          { icon: Package, label: 'Zadania', path: '/courier/tasks' },
        ];
      case 'point':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/point' },
          { icon: Package, label: 'Przesyłki', path: '/point/shipments' },
        ];
      case 'admin':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
          { icon: Users, label: 'Użytkownicy', path: '/admin/users' },
          { icon: MapPin, label: 'Punkty', path: '/admin/points' },
          { icon: Package, label: 'Przesyłki', path: '/admin/shipments' },
          { icon: CreditCard, label: 'Płatności', path: '/admin/payments' },
          { icon: AlertCircle, label: 'Reklamacje', path: '/admin/claims' },
          { icon: BarChart3, label: 'Raporty', path: '/admin/reports' },
        ];
    }
  };

  const menuItems = getMenuItems();

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl text-sidebar-foreground">PingwinPost</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors w-full">
          <LogOut className="w-5 h-5" />
          <span>Wyloguj</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar rounded-lg text-sidebar-foreground"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar flex flex-col transition-transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
