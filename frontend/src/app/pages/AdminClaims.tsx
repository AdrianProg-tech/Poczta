import { useCallback, useEffect, useState } from 'react';
import {
  acceptComplaint,
  closeComplaint,
  formatComplaintType,
  formatDateTime,
  getAdminComplaints,
  rejectComplaint,
  startComplaintReview,
  type AdminComplaintSummary,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';

export default function AdminClaims() {
  const [complaints, setComplaints] = useState<AdminComplaintSummary[]>([]);
  const [busyComplaintId, setBusyComplaintId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadComplaints = useCallback(async () => {
    try {
      setComplaints(await getAdminComplaints());
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udało się pobrać reklamacji.');
    }
  }, []);

  useEffect(() => {
    void loadComplaints();
  }, [loadComplaints]);

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
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => runComplaintAction(complaint.complaintId, () => startComplaintReview(complaint.complaintId))}
                  className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                >
                  Start review
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    runComplaintAction(complaint.complaintId, () =>
                      acceptComplaint(complaint.complaintId, 'Accepted from live admin panel'),
                    )
                  }
                  className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    runComplaintAction(complaint.complaintId, () =>
                      rejectComplaint(complaint.complaintId, 'Rejected from live admin panel'),
                    )
                  }
                  className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => runComplaintAction(complaint.complaintId, () => closeComplaint(complaint.complaintId))}
                  className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                >
                  Close
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
