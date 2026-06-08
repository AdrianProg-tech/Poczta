import { Globe, LayoutDashboard, Moon, Package, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getDashboardPath } from '../navigation';
import { useAppStateContext } from '../state/AppStateContext';

export function PublicHeader() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { state: { currentUser } } = useAppStateContext();

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const toggleLanguage = () => void i18n.changeLanguage(i18n.language === 'pl' ? 'en' : 'pl');

  return (
    <header className="bg-primary text-white border-b border-primary">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl">PingwinPost</span>
          </Link>

          <nav className="flex items-center gap-2 md:gap-4">
            <Link to="/tracking" className="hidden md:inline hover:text-accent transition-colors">
              {t('publicNav.track')}
            </Link>
            <Link to="/points" className="hidden md:inline hover:text-accent transition-colors">
              {t('publicNav.points')}
            </Link>

            <button
              onClick={toggleLanguage}
              title={t('language.toggle')}
              className="flex items-center gap-1 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">{i18n.language === 'pl' ? 'PL' : 'EN'}</span>
            </button>

            <button
              onClick={toggleTheme}
              title={t('theme.toggle')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {currentUser ? (
              <Link
                to={getDashboardPath(currentUser.role)}
                className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg hover:bg-accent/90 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">{currentUser.name}</span>
              </Link>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-accent rounded-lg hover:bg-accent/90 transition-colors">
                {t('publicNav.login')}
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
