import { useState } from 'react';
import { useParams } from 'react-router';
import { DashboardShell } from '../components/DashboardShell';

export default function ShipmentRedirect() {
  const { id } = useParams();
  const [submitted, setSubmitted] = useState(false);

  return (
    <DashboardShell role="client" title="Przekierowanie przesyłki">
      <div className="max-w-2xl">
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-xl mb-2">Przekieruj przesyłkę {id}</h2>
          <p className="text-muted-foreground mb-6">
            Wybierz nowy punkt odbioru i zapisz zmianę, aby zaktualizować preferencje doręczenia.
          </p>

          {!submitted ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <div>
                <label className="block mb-2 text-sm">Nowy punkt odbioru</label>
                <input
                  type="text"
                  defaultValue="PingwinPost - Warszawa Centrum"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm">Powód zmiany</label>
                <textarea
                  rows={4}
                  placeholder="Np. odbiorca prosi o zmianę punktu odbioru"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Zapisz zmianę
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-success/10 text-success border border-success/20">
              Zmiana została zapisana pomyślnie.
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
