import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Paperclip } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  acceptComplaint,
  closeComplaint,
  formatComplaintType,
  formatDateTime,
  getAdminComplaints,
  getComplaintAttachments,
  rejectComplaint,
  startComplaintReview,
  type AdminComplaintSummary,
  type ComplaintAttachment,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

export default function AdminClaims() {
  const {
    state: { currentUser },
  } = useAppStateContext();
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState<AdminComplaintSummary[]>([]);
  const [busyComplaintId, setBusyComplaintId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedAttachments, setExpandedAttachments] = useState<Set<string>>(new Set());
  const [attachmentsMap, setAttachmentsMap] = useState<Map<string, ComplaintAttachment[]>>(new Map());
  const [loadingAttachments, setLoadingAttachments] = useState<Set<string>>(new Set());

  const loadComplaints = useCallback(async () => {
    if (!currentUser?.email) {
      setComplaints([]);
      return;
    }

    try {
      setComplaints(await getAdminComplaints(currentUser.email));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udało się pobrać reklamacji.');
    }
  }, [currentUser?.email]);

  useEffect(() => {
    void loadComplaints();
  }, [loadComplaints]);

  async function toggleAttachments(complaintId: string) {
    if (expandedAttachments.has(complaintId)) {
      setExpandedAttachments((prev) => { const s = new Set(prev); s.delete(complaintId); return s; });
      return;
    }
    setExpandedAttachments((prev) => new Set(prev).add(complaintId));
    if (attachmentsMap.has(complaintId) || !currentUser?.email) return;
    setLoadingAttachments((prev) => new Set(prev).add(complaintId));
    try {
      const data = await getComplaintAttachments(currentUser.email, complaintId);
      setAttachmentsMap((prev) => new Map(prev).set(complaintId, data));
    } catch {
      setAttachmentsMap((prev) => new Map(prev).set(complaintId, []));
    } finally {
      setLoadingAttachments((prev) => { const s = new Set(prev); s.delete(complaintId); return s; });
    }
  }

  async function runComplaintAction(complaintId: string, action: () => Promise<unknown>) {
    setBusyComplaintId(complaintId);
    setError(null);
    try {
      await action();
      await loadComplaints();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Operacja reklamacyjna nie powiodła się.');
    } finally {
      setBusyComplaintId(null);
    }
  }

  return (
    <DashboardShell role="admin" title="Reklamacje">
      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}

      <div className="grid gap-4">
        {complaints.map((complaint) => {
          const isBusy = busyComplaintId === complaint.complaintId;
          const canStartReview = complaint.status === 'SUBMITTED';
          const canAcceptOrReject = complaint.status === 'IN_REVIEW';
          const canClose = complaint.status === 'ACCEPTED' || complaint.status === 'REJECTED';

          return (
            <div key={complaint.complaintId} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div>{complaint.complaintNumber}</div>
                  <div className="text-sm text-muted-foreground">
                    {complaint.trackingNumber} • {complaint.clientEmail ?? 'brak klienta'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatComplaintType(complaint.type)} • {formatDateTime(complaint.submittedAt)}
                  </div>
                </div>
                <StatusBadge status={complaint.status} type="complaint" />
              </div>

              <div className="mb-4 text-sm text-muted-foreground">
                {complaint.resolutionNote ?? 'Brak resolution note w tym rekordzie.'}
              </div>

              <div className="flex flex-wrap gap-2">
                {canStartReview ? (
                  <button
                    type="button"
                    disabled={isBusy || !currentUser?.email}
                    onClick={() =>
                      currentUser?.email &&
                      runComplaintAction(complaint.complaintId, () => startComplaintReview(currentUser.email, complaint.complaintId))
                    }
                    className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                  >
                    {t('complaints.startReview')}
                  </button>
                ) : null}
                {canAcceptOrReject ? (
                  <>
                    <button
                      type="button"
                      disabled={isBusy || !currentUser?.email}
                      onClick={() =>
                        currentUser?.email &&
                        runComplaintAction(complaint.complaintId, () =>
                          acceptComplaint(currentUser.email, complaint.complaintId, 'Accepted from live admin panel'),
                        )
                      }
                      className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                    >
                      {t('complaints.accept')}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy || !currentUser?.email}
                      onClick={() =>
                        currentUser?.email &&
                        runComplaintAction(complaint.complaintId, () =>
                          rejectComplaint(currentUser.email, complaint.complaintId, 'Rejected from live admin panel'),
                        )
                      }
                      className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                    >
                      {t('complaints.reject')}
                    </button>
                  </>
                ) : null}
                {canClose ? (
                  <button
                    type="button"
                    disabled={isBusy || !currentUser?.email}
                    onClick={() =>
                      currentUser?.email &&
                      runComplaintAction(complaint.complaintId, () => closeComplaint(currentUser.email, complaint.complaintId))
                    }
                    className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                  >
                    {t('complaints.close')}
                  </button>
                ) : null}
                {!canStartReview && !canAcceptOrReject && !canClose ? (
                  <div className="rounded-lg bg-secondary px-4 py-2 text-sm text-muted-foreground">
                    Ta reklamacja nie ma już dostępnych akcji operacyjnych.
                  </div>
                ) : null}
              </div>

              {/* Attachments section */}
              <div className="mt-4 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => void toggleAttachments(complaint.complaintId)}
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Paperclip className="h-4 w-4" />
                  <span>Załączniki</span>
                  {expandedAttachments.has(complaint.complaintId)
                    ? <ChevronUp className="h-3.5 w-3.5" />
                    : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {expandedAttachments.has(complaint.complaintId) ? (
                  <div className="mt-2">
                    {loadingAttachments.has(complaint.complaintId) ? (
                      <p className="text-sm text-muted-foreground">Ładowanie załączników…</p>
                    ) : (attachmentsMap.get(complaint.complaintId) ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Brak załączników do tej reklamacji.</p>
                    ) : (
                      <ul className="space-y-1">
                        {(attachmentsMap.get(complaint.complaintId) ?? []).map((att) => (
                          <li key={att.attachmentId} className="flex items-center gap-2 text-sm">
                            <Paperclip className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                            <span className="font-medium">{att.fileName}</span>
                            <span className="text-muted-foreground">• {formatDateTime(att.uploadedAt)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
