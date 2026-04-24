import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-sm uppercase tracking-[0.3em] text-accent mb-4">404</div>
        <h1 className="text-4xl mb-4">Nie znaleziono strony</h1>
        <p className="text-muted-foreground mb-8">
          Wygląda na to, że ten adres nie istnieje albo został przeniesiony.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Wróć na stronę główną
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Przejdź do logowania
          </Link>
        </div>
      </div>
    </div>
  );
}
