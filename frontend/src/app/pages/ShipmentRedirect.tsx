import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { getPublicPoints, requestClientShipmentRedirect, type PublicPoint } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

interface RedirectFormValues {
  targetPointCode: string;
  reason: string;
}

export default function ShipmentRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [points, setPoints] = useState<PublicPoint[]>([]);
  const [submitState, setSubmitState] = useState<'idle' | 'success'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RedirectFormValues>();

  useEffect(() => {
    let active = true;

    async function loadPoints() {
      try {
        const data = await getPublicPoints();
        if (!active) {
          return;
        }

        const activePoints = data.filter((point) => point.active && point.type === 'PICKUP_POINT');
        setPoints(activePoints);
        if (activePoints[0]) {
          setValue('targetPointCode', activePoints[0].pointCode);
        }
      } catch {
        if (active) {
          setPoints([]);
        }
      }
    }

    void loadPoints();

    return () => {
      active = false;
    };
  }, [setValue]);

  const onSubmit = handleSubmit(async (values) => {
    if (!currentUser?.email || !id) {
      return;
    }

    setSubmitError(null);

    try {
      await requestClientShipmentRedirect(currentUser.email, id, values);
      setSubmitState('success');
    } catch (requestError) {
      setSubmitError(requestError instanceof Error ? requestError.message : 'Nie udało się wysłać przekierowania.');
    }
  });

  return (
    <DashboardShell role="client" title="Przekierowanie przesyłki">
      <div className="max-w-2xl rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-2 text-xl">Przekieruj przesyłkę {id}</h2>
        <p className="mb-6 text-muted-foreground">
          Ten formularz korzysta już z prawdziwego endpointu klienta i zapisuje redirect request po stronie backendu.
        </p>

        {submitState === 'success' ? (
          <div className="rounded-xl border border-success/20 bg-success/10 p-4">
            <div className="mb-2 text-success">Przekierowanie zostało zapisane.</div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(`/client/shipments/${id}`)}
                className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90"
              >
                Wróć do przesyłki
              </button>
              <Link to="/client/shipments" className="rounded-lg border border-border px-4 py-2 transition-colors hover:bg-muted">
                Lista przesyłek
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm">Nowy punkt odbioru</label>
              <select
                {...register('targetPointCode', { required: 'Wybierz punkt docelowy.' })}
                className="w-full rounded-lg border border-border bg-input-background px-4 py-3"
              >
                {points.map((point) => (
                  <option key={point.pointCode} value={point.pointCode}>
                    {point.name} ({point.pointCode})
                  </option>
                ))}
              </select>
              {errors.targetPointCode ? <p className="mt-1 text-sm text-destructive">{errors.targetPointCode.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm">Powód zmiany</label>
              <textarea
                {...register('reason')}
                rows={4}
                placeholder="Np. odbiorca woli odbiór w punkcie"
                className="w-full resize-none rounded-lg border border-border bg-input-background px-4 py-3"
              />
            </div>

            {submitError ? <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{submitError}</div> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
            >
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmianę'}
            </button>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}
