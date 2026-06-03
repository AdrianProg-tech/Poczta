import { Link, useNavigate } from 'react-router';
import { Package, MapPin, Search, TrendingUp, Shield, Clock, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStateContext } from '../state/AppStateContext';
import { getDashboardPath } from '../navigation';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Home() {
  const { t } = useTranslation();
  usePageTitle(t('home.hero.title'));
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState('');
  const { state: { currentUser } } = useAppStateContext();

  return (
    <div className="min-h-screen">
      <header className="bg-primary text-white border-b border-primary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl">PingwinPost</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/tracking" className="hover:text-accent transition-colors">{t('publicNav.track')}</Link>
              <Link to="/points" className="hover:text-accent transition-colors">{t('publicNav.points')}</Link>
              {currentUser ? (
                <Link
                  to={getDashboardPath(currentUser.role)}
                  className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg hover:bg-accent/90 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {currentUser.name}
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

      <section className="bg-gradient-to-br from-primary to-primary/90 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl mb-6">{t('home.hero.title')}</h1>
            <p className="text-xl text-white/80 mb-10">{t('home.hero.subtitle')}</p>

            <div className="bg-white rounded-xl p-6 shadow-xl">
              <h3 className="text-primary text-xl mb-4">{t('home.trackForm.title')}</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={t('home.trackForm.placeholder')}
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
                />
                <button
                  type="button"
                  onClick={() => navigate(`/tracking?number=${encodeURIComponent(trackingNumber)}`)}
                  className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  <span className="hidden sm:inline">{t('home.trackForm.button')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-center mb-12">{t('home.features.title')}</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl mb-3">{t('home.features.fast')}</h3>
              <p className="text-muted-foreground">{t('home.features.fastDesc')}</p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl mb-3">{t('home.features.secure')}</h3>
              <p className="text-muted-foreground">{t('home.features.secureDesc')}</p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl mb-3">{t('home.features.network')}</h3>
              <p className="text-muted-foreground">{t('home.features.networkDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl text-primary mb-2">5000+</div>
              <div className="text-muted-foreground">{t('home.stats.pickupPoints')}</div>
            </div>
            <div>
              <div className="text-4xl text-primary mb-2">1M+</div>
              <div className="text-muted-foreground">{t('home.stats.shipmentsPerMonth')}</div>
            </div>
            <div>
              <div className="text-4xl text-primary mb-2">98%</div>
              <div className="text-muted-foreground">{t('home.stats.happyClients')}</div>
            </div>
            <div>
              <div className="text-4xl text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">{t('home.stats.support')}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl mb-6">{t('home.cta.title')}</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">{t('home.cta.subtitle')}</p>
          {currentUser ? (
            <Link
              to={getDashboardPath(currentUser.role)}
              className="inline-block px-8 py-4 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              {t('home.cta.goToDashboard')}
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-block px-8 py-4 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              {t('home.cta.start')}
            </Link>
          )}
        </div>
      </section>

      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl">PingwinPost</span>
              </div>
              <p className="text-muted-foreground text-sm">{t('home.footer.tagline')}</p>
            </div>

            <div>
              <h4 className="mb-4">{t('home.footer.forClients')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/tracking" className="hover:text-accent">{t('publicNav.track')}</Link></li>
                <li><Link to="/points" className="hover:text-accent">{t('publicNav.points')}</Link></li>
                <li><Link to="/info/pricing" className="hover:text-accent">{t('home.footer.pricing')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4">{t('home.footer.company')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/info/about" className="hover:text-accent">{t('home.footer.about')}</Link></li>
                <li><Link to="/info/careers" className="hover:text-accent">{t('home.footer.careers')}</Link></li>
                <li><Link to="/info/contact" className="hover:text-accent">{t('home.footer.contact')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4">{t('home.footer.help')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/info/faq" className="hover:text-accent">{t('home.footer.faq')}</Link></li>
                <li><Link to="/info/terms" className="hover:text-accent">{t('home.footer.terms')}</Link></li>
                <li><Link to="/info/privacy" className="hover:text-accent">{t('home.footer.privacy')}</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            {t('home.footer.copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}
