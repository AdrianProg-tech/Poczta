import { Link, useParams } from 'react-router';

const contentMap: Record<string, { title: string; description: string; bullets: string[] }> = {
  pricing: {
    title: 'Cennik',
    description: 'Przejrzysty cennik usług dla klientów indywidualnych i biznesowych.',
    bullets: [
      'Paczki standardowe od 19.99 PLN.',
      'Paczki ekspresowe od 29.99 PLN.',
      'Płatność online i w punkcie odbioru są dostępne dla wybranych usług.',
    ],
  },
  about: {
    title: 'O nas',
    description: 'PingwinPost to nowoczesny system logistyczny z podziałem na role klienta, kuriera, punktu i administratora.',
    bullets: [
      'Frontend przygotowany jako cienki klient w React + TypeScript.',
      'Makiety i dashboardy obejmują główne role użytkowników.',
      'System rozwijany jest w kierunku pełnej obsługi procesów logistycznych.',
    ],
  },
  careers: {
    title: 'Kariera',
    description: 'Dołącz do zespołu, który rozwija nowoczesne usługi logistyczne.',
    bullets: [
      'Kurierzy i obsługa punktów odbioru.',
      'Specjaliści ds. logistyki i jakości.',
      'Rozwój produktu i wsparcie klienta.',
    ],
  },
  contact: {
    title: 'Kontakt',
    description: 'Skontaktuj się z naszym zespołem obsługi klienta lub biurem centralnym.',
    bullets: [
      'infolinia: +48 800 123 456',
      'email: kontakt@pingwinpost.pl',
      'adres: ul. Marszałkowska 104, Warszawa',
    ],
  },
  faq: {
    title: 'FAQ',
    description: 'Najczęściej zadawane pytania zebrane w jednej prostej sekcji.',
    bullets: [
      'Jak śledzić przesyłkę? Użyj numeru przesyłki na stronie śledzenia.',
      'Jak zgłosić reklamację? Z poziomu panelu klienta.',
      'Jak odebrać paczkę? W punkcie odbioru lub paczkomacie.',
    ],
  },
  terms: {
    title: 'Regulamin',
    description: 'Najważniejsze zasady korzystania z usług PingwinPost w skróconej formie.',
    bullets: [
      'Warunki wysyłki i odbioru przesyłek.',
      'Zasady płatności online i offline.',
      'Podstawowe informacje o reklamacjach i zwrotach.',
    ],
  },
  privacy: {
    title: 'Prywatność',
    description: 'Dbamy o bezpieczeństwo i przejrzystość przetwarzania danych użytkowników.',
    bullets: [
      'Dane użytkownika są używane do obsługi przesyłek.',
      'Statusy i historia przesyłek są widoczne po zalogowaniu.',
      'Dostęp do danych mają wyłącznie uprawnieni użytkownicy systemu.',
    ],
  },
  register: {
    title: 'Rejestracja',
    description: 'Załóż konto, aby zarządzać przesyłkami, płatnościami i reklamacjami w jednym miejscu.',
    bullets: [
      'Możesz przejść do ekranu logowania i wybrać rolę użytkownika.',
      'Po zalogowaniu uzyskasz dostęp do odpowiedniego panelu użytkownika.',
      'Konto umożliwia śledzenie przesyłek i zarządzanie usługami.',
    ],
  },
  'forgot-password': {
    title: 'Reset hasła',
    description: 'Jeśli nie pamiętasz hasła, skorzystaj z bezpiecznego procesu odzyskiwania dostępu.',
    bullets: [
      'Sprawdź skrzynkę mailową po wysłaniu prośby o reset hasła.',
      'Link do resetu hasła ma ograniczony czas ważności.',
      'W razie problemów skontaktuj się z obsługą klienta.',
    ],
  },
};

export default function InfoPage() {
  const { slug = 'about' } = useParams();
  const content = contentMap[slug] ?? contentMap.about;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-8">
          <Link to="/" className="text-accent hover:text-accent/80 transition-colors">
            ← Powrót
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-8 lg:p-10">
          <div className="text-sm uppercase tracking-[0.25em] text-accent mb-4">Info</div>
          <h1 className="text-4xl mb-4">{content.title}</h1>
          <p className="text-muted-foreground mb-8">{content.description}</p>

          <div className="space-y-3">
            {content.bullets.map((item) => (
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
