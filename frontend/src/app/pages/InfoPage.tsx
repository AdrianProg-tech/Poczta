import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';

const KNOWN_SLUGS = ['pricing', 'about', 'careers', 'contact', 'faq', 'terms', 'privacy', 'register', 'forgot-password'] as const;
type InfoSlug = typeof KNOWN_SLUGS[number];

function isKnownSlug(slug: string): slug is InfoSlug {
  return KNOWN_SLUGS.includes(slug as InfoSlug);
}

export default function InfoPage() {
  const { t } = useTranslation();
  const { slug = 'about' } = useParams();
  const safeSlug: InfoSlug = isKnownSlug(slug) ? slug : 'about';

  const title = t(`infoPage.${safeSlug}.title`);
  const description = t(`infoPage.${safeSlug}.description`);
  const bullets = [
    t(`infoPage.${safeSlug}.b1`),
    t(`infoPage.${safeSlug}.b2`),
    t(`infoPage.${safeSlug}.b3`),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-8">
          <Link to="/" className="text-accent hover:text-accent/80 transition-colors">
            {t('infoPage.back')}
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-8 lg:p-10">
          <div className="text-sm uppercase tracking-[0.25em] text-accent mb-4">{t('infoPage.badge')}</div>
          <h1 className="text-4xl mb-4">{title}</h1>
          <p className="text-muted-foreground mb-8">{description}</p>

          <div className="space-y-3">
            {bullets.map((item) => (
              <div key={item} className="p-4 rounded-xl bg-secondary">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
