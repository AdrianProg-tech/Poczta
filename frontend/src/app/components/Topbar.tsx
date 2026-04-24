import { Bell, User } from 'lucide-react';
import { getRoleLabel } from '../navigation';
import { useAppStateContext } from '../state/AppStateContext';

interface TopbarProps {
  title: string;
  userName?: string;
}

export function Topbar({ title, userName = 'Jan Kowalski' }: TopbarProps) {
  const {
    state: { currentUser },
  } = useAppStateContext();

  const displayName = currentUser?.name ?? userName;
  const displayRole = currentUser ? getRoleLabel(currentUser.role) : 'Gość';

  return (
    <header className="bg-card border-b border-border px-6 py-4 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-foreground">{title}</h1>
        
        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm">{displayName}</div>
              <div className="text-xs text-muted-foreground">{displayRole}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
