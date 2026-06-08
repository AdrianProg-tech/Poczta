import { Building2, Globe, Moon, Package, ShieldCheck, Sun, Truck, User } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { usePageTitle } from '../hooks/usePageTitle';

const SCENARIO_COUNT = 4;
const SCENARIO_STEP_COUNTS = [5, 5, 3, 3];
const SCENARIO_STATUSES = [
  ['READY_FOR_HANDOVER', 'ACCEPTED_AT_SOURCE', 'POSTED', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED'],
  ['READY_FOR_HANDOVER', 'ACCEPTED_AT_SOURCE', 'POSTED', 'IN_TRANSIT_TO_TARGET_POINT', 'AWAITING_PICKUP', 'DELIVERED'],
  ['READY_FOR_HANDOVER', 'ACCEPTED_AT_SOURCE', 'POSTED'],
  ['OUT_FOR_DELIVERY', 'RETURN_IN_TRANSIT', 'IN_TRANSIT_TO_TARGET_POINT', 'AWAITING_PICKUP', 'DELIVERED'],
];
const SCENARIO_NEXT_SCREENS = [
  '/point/accept -> /admin/demo/transit -> /admin/shipments -> /courier/tasks',
  '/point/accept -> /admin/demo/transit -> /admin/shipments -> /point/release',
  '/point/walk-in -> /point/accept -> /admin/demo/transit',
  '/courier/tasks -> /admin/shipments -> /point/accept -> /point/release',
];

const ROLE_ROUTES = [
  ['/client', '/client/shipments', '/client/shipments/create'],
  ['/point/accept', '/point/release', '/point/walk-in'],
  ['/admin/demo/transit', '/admin/shipments', '/admin/demo-lab'],
  ['/courier/tasks', '/courier'],
];

const GLOSSARY_ENTRIES: Array<{ code: string; key: string }> = [
  { code: 'READY_FOR_HANDOVER', key: 'glossaryReadyForHandover' },
  { code: 'ACCEPTED_AT_SOURCE', key: 'glossaryAcceptedAtSource' },
  { code: 'POSTED', key: 'glossaryPosted' },
  { code: 'AWAITING_PICKUP', key: 'glossaryAwaitingPickup' },
  { code: 'DELIVERED', key: 'glossaryDelivered' },
];

const ROLE_KEYS = ['client', 'point', 'admin', 'courier'] as const;
const ROLE_DESC_KEYS = ['roleClientDesc', 'rolePointDesc', 'roleAdminDesc', 'roleCourierDesc'] as const;
const ROLE_ICONS = [User, Building2, ShieldCheck, Truck];

export default function DemoHelp() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  usePageTitle(t('demoHelp.pageTitle'));

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const toggleLanguage = () => void i18n.changeLanguage(i18n.language === 'pl' ? 'en' : 'pl');

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-[0.25em] text-accent">{t('demoHelp.guideLabel')}</div>
            <h1 className="mt-3 text-4xl">{t('demoHelp.introTitle')}</h1>
            <p className="mt-3 max-w-4xl text-muted-foreground">{t('demoHelp.introBody')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={toggleLanguage}
              title={t('language.toggle')}
              className="flex items-center gap-1 p-2 hover:bg-muted rounded-lg transition-colors text-foreground border border-border"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">{i18n.language === 'pl' ? 'PL' : 'EN'}</span>
            </button>
            <button
              onClick={toggleTheme}
              title={t('theme.toggle')}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-foreground border border-border"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/login-demo" className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90">
              {t('demoHelp.openLoginDemo')}
            </Link>
            <Link to="/login" className="rounded-lg border border-border px-4 py-2 transition-colors hover:bg-muted">
              {t('demoHelp.classicLogin')}
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: SCENARIO_COUNT }, (_, i) => {
            const steps = Array.from({ length: SCENARIO_STEP_COUNTS[i] }, (__, j) =>
              t(`demoHelp.scenario${i}Step${j}`),
            );
            return (
              <section key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl">{t(`demoHelp.scenario${i}Title`)}</h2>
                    <div className="text-sm text-muted-foreground">{t(`demoHelp.scenario${i}StartingRole`)}</div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="rounded-xl bg-secondary p-4">
                    <div className="font-medium">{t('demoHelp.accountHintLabel')}</div>
                    <div className="mt-1 text-muted-foreground">{t(`demoHelp.scenario${i}AccountHint`)}</div>
                  </div>
                  <div className="rounded-xl bg-secondary p-4">
                    <div className="font-medium">{t('demoHelp.whereNextLabel')}</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">{SCENARIO_NEXT_SCREENS[i]}</div>
                  </div>
                  <div className="rounded-xl bg-secondary p-4">
                    <div className="font-medium">{t('demoHelp.nextOwnerLabel')}</div>
                    <div className="mt-1 text-muted-foreground">{t(`demoHelp.scenario${i}NextOwner`)}</div>
                  </div>

                  <div>
                    <div className="mb-2 font-medium">{t('demoHelp.statusPathLabel')}</div>
                    <div className="flex flex-wrap gap-2">
                      {SCENARIO_STATUSES[i].map((status) => (
                        <span key={status} className="rounded-full border border-border px-3 py-1 font-mono text-xs">
                          {status}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 font-medium">{t('demoHelp.stepsLabel')}</div>
                    <ol className="space-y-2 text-muted-foreground">
                      {steps.map((step, index) => (
                        <li key={step} className="flex gap-3">
                          <span className="text-accent">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <h2 className="text-2xl">{t('demoHelp.roleMapTitle')}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {ROLE_KEYS.map((roleKey, index) => {
                const Icon = ROLE_ICONS[index];
                return (
                  <div key={roleKey} className="rounded-xl bg-secondary p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent" />
                      <div className="font-medium">{t(`roles.${roleKey}`)}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{t(`demoHelp.${ROLE_DESC_KEYS[index]}`)}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ROLE_ROUTES[index].map((route) => (
                        <span key={route} className="rounded-full border border-border px-3 py-1 font-mono text-xs">
                          {route}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Package className="h-5 w-5 text-accent" />
              <h2 className="text-2xl">{t('demoHelp.glossaryTitle')}</h2>
            </div>

            <div className="space-y-3">
              {GLOSSARY_ENTRIES.map((item) => (
                <div key={item.code} className="rounded-xl bg-secondary p-4">
                  <div className="font-mono text-xs text-accent">{item.code}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{t(`demoHelp.${item.key}`)}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
