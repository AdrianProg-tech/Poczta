import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  createClientComplaint,
  formatComplaintType,
  getClientComplaints,
  getClientShipments,
  type ClientShipmentListItem,
  type ComplaintSummary,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

interface ClaimFormValues {
  trackingNumber: string;
  type: 'DELAYED' | 'DAMAGED' | 'LOST' | 'OTHER';
  subject: string;
  description: string;
}

export default function ClientClaims() {
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [complaints, setComplaints] = useState<ComplaintSummary[]>([]);
  const [shipments, setShipments] = useState<ClientShipmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClaimFormValues>({
    defaultValues: {
      type: 'DELAYED',
    },
  });

  const loadData = useCallback(async () => {
    if (!currentUser?.email) {
      setComplaints([]);
      setShipments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [complaintsData, shipmentsData] = await Promise.all([
        getClientComplaints(currentUser.email),
        getClientShipments(currentUser.email),
      ]);
      setComplaints(complaintsData);
      setShipments(shipmentsData);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onSubmit = handleSubmit(async (values) => {
    if (!currentUser?.email) {
      return;
    }

    setSubmitError(null);

    try {
      await createClientComplaint(currentUser.email, {
        trackingNumber: values.trackingNumber,
        type: values.type,
        subject: values.subject,
        description: values.description,
      });
      reset({
        trackingNumber: '',
        type: 'DELAYED',
        subject: '',
        description: '',
      });
      await loadData();
    } catch (requestError) {
      setSubmitError(requestError instanceof Error ? requestError.message : 'Nie udało się wysłać reklamacji.');
    }
  });

  return (
    <DashboardShell role="client" title="Reklamacje">
      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h2 className="text-xl">Zgłoszone reklamacje</h2>
          </div>
          <div className="space-y-4 p-6">
            {isLoading ? <div>Ładowanie reklamacji...</div> : null}

            {!isLoading && complaints.length === 0 ? (
              <div className="text-muted-foreground">Ten klient nie ma jeszcze żadnych reklamacji.</div>
            ) : null}

            {complaints.map((complaint) => (
              <div key={complaint.complaintId} className="rounded-xl bg-secondary p-4">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">{complaint.complaintNumber}</div>
                    <div>{formatComplaintType(complaint.type)}</div>
                  </div>
                  <StatusBadge status={complaint.status} type="complaint" />
                </div>
                <div className="mb-1 text-sm text-muted-foreground">Przesyłka: {complaint.trackingNumber}</div>
                <div className="text-sm text-muted-foreground">
                  {complaint.subject ?? 'Brak osobnego tematu w aktualnym kontrakcie klienta.'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-xl">Nowa reklamacja</h2>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm">Przesyłka</label>
              <select
                {...register('trackingNumber', { required: 'Wybierz przesyłkę.' })}
                className="w-full rounded-lg border border-border bg-input-background px-4 py-3"
              >
                <option value="">Wybierz numer przesyłki</option>
                {shipments.map((shipment) => (
                  <option key={shipment.trackingNumber} value={shipment.trackingNumber}>
                    {shipment.trackingNumber}
                  </option>
                ))}
              </select>
              {errors.trackingNumber ? <p className="mt-1 text-sm text-destructive">{errors.trackingNumber.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm">Typ reklamacji</label>
              <select {...register('type')} className="w-full rounded-lg border border-border bg-input-background px-4 py-3">
                <option value="DELAYED">Opóźnienie</option>
                <option value="DAMAGED">Uszkodzenie</option>
                <option value="LOST">Zaginięcie</option>
                <option value="OTHER">Inne</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm">Temat</label>
              <input
                {...register('subject', { required: 'Podaj temat reklamacji.' })}
                className="w-full rounded-lg border border-border bg-input-background px-4 py-3"
                placeholder="Np. uszkodzona paczka"
              />
              {errors.subject ? <p className="mt-1 text-sm text-destructive">{errors.subject.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm">Opis</label>
              <textarea
                {...register('description', {
                  required: 'Podaj opis reklamacji.',
                  minLength: { value: 10, message: 'Opis powinien mieć co najmniej 10 znaków.' },
                })}
                rows={5}
                className="w-full resize-none rounded-lg border border-border bg-input-background px-4 py-3"
                placeholder="Opisz problem z przesyłką"
              />
              {errors.description ? <p className="mt-1 text-sm text-destructive">{errors.description.message}</p> : null}
            </div>

            {submitError ? <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{submitError}</div> : null}

            <button type="submit" className="w-full rounded-lg bg-accent px-4 py-3 text-white transition-colors hover:bg-accent/90">
              Wyślij reklamację
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
