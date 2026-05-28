import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const prefilledTrackingNumber = searchParams.get('tracking');
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
    setValue,
    formState: { errors },
  } = useForm<ClaimFormValues>({
    defaultValues: { type: 'DELAYED' },
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

  useEffect(() => {
    if (!prefilledTrackingNumber) return;
    const match = shipments.find((s) => s.trackingNumber === prefilledTrackingNumber);
    if (match) setValue('trackingNumber', match.trackingNumber);
  }, [prefilledTrackingNumber, setValue, shipments]);

  const onSubmit = handleSubmit(async (values) => {
    if (!currentUser?.email) return;
    setSubmitError(null);
    try {
      await createClientComplaint(currentUser.email, {
        trackingNumber: values.trackingNumber,
        type: values.type,
        subject: values.subject,
        description: values.description,
      });
      reset({ trackingNumber: '', type: 'DELAYED', subject: '', description: '' });
      await loadData();
    } catch (requestError) {
      setSubmitError(requestError instanceof Error ? requestError.message : t('clientClaims.submitError'));
    }
  });

  return (
    <DashboardShell role="client" title={t('clientClaims.title')}>
      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h2 className="text-xl">{t('clientClaims.listTitle')}</h2>
          </div>
          <div className="space-y-4 p-6">
            {isLoading ? <div>{t('clientClaims.loading')}</div> : null}

            {!isLoading && complaints.length === 0 ? (
              <div className="text-muted-foreground">{t('clientClaims.empty')}</div>
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
                <div className="mb-1 text-sm text-muted-foreground">
                  {t('clientClaims.shipmentLabel', { tracking: complaint.trackingNumber })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {complaint.subject ?? t('clientClaims.noSubject')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-xl">{t('clientClaims.formTitle')}</h2>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm">{t('clientClaims.fieldShipment')}</label>
              <select
                {...register('trackingNumber', { required: t('clientClaims.fieldShipmentRequired') })}
                className="w-full rounded-lg border border-border bg-input-background px-4 py-3"
              >
                <option value="">{t('clientClaims.shipmentPlaceholder')}</option>
                {shipments.map((s) => (
                  <option key={s.trackingNumber} value={s.trackingNumber}>
                    {s.trackingNumber}
                  </option>
                ))}
              </select>
              {errors.trackingNumber ? <p className="mt-1 text-sm text-destructive">{errors.trackingNumber.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm">{t('clientClaims.fieldType')}</label>
              <select {...register('type')} className="w-full rounded-lg border border-border bg-input-background px-4 py-3">
                <option value="DELAYED">{t('clientClaims.typeDelayed')}</option>
                <option value="DAMAGED">{t('clientClaims.typeDamaged')}</option>
                <option value="LOST">{t('clientClaims.typeLost')}</option>
                <option value="OTHER">{t('clientClaims.typeOther')}</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm">{t('clientClaims.fieldSubject')}</label>
              <input
                {...register('subject', { required: t('clientClaims.subjectRequired') })}
                className="w-full rounded-lg border border-border bg-input-background px-4 py-3"
                placeholder={t('clientClaims.subjectPlaceholder')}
              />
              {errors.subject ? <p className="mt-1 text-sm text-destructive">{errors.subject.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm">{t('clientClaims.fieldDescription')}</label>
              <textarea
                {...register('description', {
                  required: t('clientClaims.descRequired'),
                  minLength: { value: 10, message: t('clientClaims.descMinLength') },
                })}
                rows={5}
                className="w-full resize-none rounded-lg border border-border bg-input-background px-4 py-3"
                placeholder={t('clientClaims.descPlaceholder')}
              />
              {errors.description ? <p className="mt-1 text-sm text-destructive">{errors.description.message}</p> : null}
            </div>

            {submitError ? <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{submitError}</div> : null}

            <button type="submit" className="w-full rounded-lg bg-accent px-4 py-3 text-white transition-colors hover:bg-accent/90">
              {t('clientClaims.submit')}
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
