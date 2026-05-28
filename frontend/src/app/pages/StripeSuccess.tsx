import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { verifyStripeSession } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function StripeSuccess() {
  const { t } = useTranslation();
  const { paymentId } = useParams();
  const [searchParams] = useSearchParams();
  const { state: { currentUser } } = useAppStateContext();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!paymentId || !sessionId || !currentUser?.email) {
      setStatus('success');
      return;
    }

    verifyStripeSession(currentUser.email, paymentId, sessionId)
      .then(({ status: payStatus }) => {
        setStatus(payStatus === 'PAID' ? 'success' : 'error');
      })
      .catch(() => {
        setStatus('success');
      });
  }, [paymentId, searchParams, currentUser?.email]);

  if (status === 'loading') {
    return (
      <DashboardShell role="client" title={t('stripeSuccess.title')}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-muted-foreground">{t('stripeSuccess.verifying')}</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="client" title={t('stripeSuccess.title')}>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {status === 'success' ? (
          <>
            <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
            <h2 className="mb-2 text-2xl">{t('stripeSuccess.successTitle')}</h2>
            <p className="mb-8 text-muted-foreground">{t('stripeSuccess.successDesc')}</p>
          </>
        ) : (
          <>
            <XCircle className="mb-4 h-16 w-16 text-destructive" />
            <h2 className="mb-2 text-2xl">{t('stripeSuccess.errorTitle')}</h2>
            <p className="mb-8 text-muted-foreground">{t('stripeSuccess.errorDesc')}</p>
          </>
        )}
        <Link
          to="/client/shipments"
          className="rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-accent/90"
        >
          {t('stripeSuccess.backToShipments')}
        </Link>
      </div>
    </DashboardShell>
  );
}
