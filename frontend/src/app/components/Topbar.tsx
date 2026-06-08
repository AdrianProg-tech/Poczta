import { Globe, Moon, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { useAppStateContext } from '../state/AppStateContext';

interface TopbarProps {
  title: string;
  userName?: string;
}

export function Topbar({ title, userName = 'Jan Kowalski' }: TopbarProps) {
  const {
    state: { currentUser },
  } = useAppStateContext();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const displayName = currentUser?.name ?? userName;
  const displayRole = currentUser ? t(`roles.${currentUser.role}`) : t('roles.guest', { defaultValue: 'Gość' });

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const toggleLanguage = () => void i18n.changeLanguage(i18n.language === 'pl' ? 'en' : 'pl');

  return (
    <header className="bg-card border-b border-border px-6 py-4 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-foreground">{title}</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            title={t('language.toggle')}
            className="flex items-center gap-1 p-2 hover:bg-muted rounded-lg transition-colors text-foreground"
          >
            <Globe className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">{i18n.language === 'pl' ? 'PL' : 'EN'}</span>
          </button>

          <button
            onClick={toggleTheme}
            title={t('theme.toggle')}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-foreground"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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
