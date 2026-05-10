import { useCallback, useEffect, useState } from 'react';
import {
  cancelPayment,
  failPayment,
  formatCurrency,
  formatDateTime,
  formatPaymentMethod,
  getAdminPayments,
  markPaymentPaid,
  type AdminPaymentSummary,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

export default function AdminPayments() {
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [payments, setPayments] = useState<AdminPaymentSummary[]>([]);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    if (!currentUser?.email) {
      setPayments([]);
      return;
    }

    try {
      setPayments(await getAdminPayments(currentUser.email));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udało się pobrać płatności.');
    }
  }, [currentUser?.email]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  async function runPaymentAction(paymentId: string, action: () => Promise<unknown>) {
    setBusyPaymentId(paymentId);
    setError(null);
    try {
      await action();
      await loadPayments();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Operacja na płatności nie powiodła się.');
    } finally {
      setBusyPaymentId(null);
    }
  }

  return (
    <DashboardShell role="admin" title="Płatności">
      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}

      <div className="grid gap-4">
        {payments.map((payment) => {
          const isBusy = busyPaymentId === payment.paymentId;
          return (
            <div key={payment.paymentId} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div>{payment.trackingNumber}</div>
                  <div className="text-sm text-muted-foreground">
                    {payment.clientEmail ?? 'brak klienta'} • {formatDateTime(payment.createdAt)}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {formatPaymentMethod(payment.method)} • {payment.externalReference ?? 'brak referencji'}
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:items-end">
                  <div className="flex items-center gap-4">
                    <div>{formatCurrency(payment.amount)}</div>
                    <StatusBadge status={payment.status} type="payment" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isBusy || !currentUser?.email}
                      onClick={() =>
                        currentUser?.email &&
                        runPaymentAction(payment.paymentId, () => markPaymentPaid(currentUser.email, payment.paymentId))
                      }
                      className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                    >
                      Mark paid
                    </button>
                    <button
                      type="button"
                      disabled={isBusy || !currentUser?.email}
                      onClick={() =>
                        currentUser?.email &&
                        runPaymentAction(payment.paymentId, () => failPayment(currentUser.email, payment.paymentId))
                      }
                      className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                    >
                      Fail
                    </button>
                    <button
                      type="button"
                      disabled={isBusy || !currentUser?.email}
                      onClick={() =>
                        currentUser?.email &&
                        runPaymentAction(payment.paymentId, () => cancelPayment(currentUser.email, payment.paymentId))
                      }
                      className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
