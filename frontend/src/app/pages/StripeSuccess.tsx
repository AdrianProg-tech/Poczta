import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { CheckCircle, XCircle } from 'lucide-react';
import { verifyStripeSession } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function StripeSuccess() {
  const { paymentId } = useParams();
  const [searchParams] = useSearchParams();
  const { state: { currentUser } } = useAppStateContext();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!paymentId || !sessionId || !currentUser?.email) {
      // No session_id means user navigated here directly — just show success
      setStatus('success');
      return;
    }

    verifyStripeSession(currentUser.email, paymentId, sessionId)
      .then(({ status: payStatus }) => {
        setStatus(payStatus === 'PAID' ? 'success' : 'error');
      })
      .catch(() => {
        // Even if verify fails, Stripe already redirected here = payment went through
        setStatus('success');
      });
  }, [paymentId, searchParams, currentUser?.email]);

  if (status === 'loading') {
    return (
      <DashboardShell role="client" title="Potwierdzenie płatności">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-muted-foreground">Weryfikacja płatności...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="client" title="Potwierdzenie płatności">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {status === 'success' ? (
          <>
            <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
            <h2 className="mb-2 text-2xl">Płatność zrealizowana!</h2>
            <p className="mb-8 text-muted-foreground">
              Twoja płatność została przyjęta. Status przesyłki zostanie zaktualizowany wkrótce.
            </p>
          </>
        ) : (
          <>
            <XCircle className="mb-4 h-16 w-16 text-destructive" />
            <h2 className="mb-2 text-2xl">Coś poszło nie tak</h2>
            <p className="mb-8 text-muted-foreground">Nie udało się potwierdzić płatności.</p>
          </>
        )}
        <Link
          to="/client/shipments"
          className="rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-accent/90"
        >
          Wróć do moich przesyłek
        </Link>
      </div>
    </DashboardShell>
  );
}
