import { useForm } from 'react-hook-form';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

interface ClaimFormValues {
  shipmentId: string;
  subject: string;
  description: string;
}

export default function ClientClaims() {
  const {
    state: { currentUser, claims, shipments },
    createClaim,
  } = useAppStateContext();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClaimFormValues>();

  const clientClaims = claims.filter((claim) => claim.clientId === currentUser?.id);
  const clientShipments = shipments.filter((shipment) => shipment.clientId === currentUser?.id);

  const onSubmit = handleSubmit((values) => {
    createClaim(values.shipmentId, values.subject, values.description);
    reset();
  });

  return (
    <DashboardShell role="client" title="Reklamacje">
      <div className="grid xl:grid-cols-[1.2fr,0.8fr] gap-6">
        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl">Zgłoszone reklamacje</h2>
          </div>
          <div className="p-6 space-y-4">
            {clientClaims.map((claim) => (
              <div key={claim.id} className="p-4 rounded-xl bg-secondary">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="text-sm text-muted-foreground">{claim.id}</div>
                  <span className="text-sm">{claim.status}</span>
                </div>
                <div className="mb-1">{claim.subject}</div>
                <div className="text-sm text-muted-foreground mb-2">Przesyłka: {claim.shipmentId}</div>
                <div className="text-sm text-muted-foreground">{claim.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-xl mb-6">Nowa reklamacja</h2>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block mb-2 text-sm">Przesyłka</label>
              <select
                {...register('shipmentId', { required: 'Wybierz przesyłkę.' })}
                className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Wybierz numer przesyłki</option>
                {clientShipments.map((shipment) => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.id}
                  </option>
                ))}
              </select>
              {errors.shipmentId ? (
                <p className="text-sm text-destructive mt-1">{errors.shipmentId.message}</p>
              ) : null}
            </div>

            <div>
              <label className="block mb-2 text-sm">Temat</label>
              <input
                {...register('subject', { required: 'Podaj temat reklamacji.' })}
                type="text"
                className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Np. uszkodzona paczka"
              />
              {errors.subject ? (
                <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>
              ) : null}
            </div>

            <div>
              <label className="block mb-2 text-sm">Opis</label>
              <textarea
                {...register('description', {
                  required: 'Podaj opis reklamacji.',
                  minLength: {
                    value: 10,
                    message: 'Opis powinien mieć co najmniej 10 znaków.',
                  },
                })}
                rows={5}
                className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                placeholder="Opisz problem z przesyłką"
              />
              {errors.description ? (
                <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
              ) : null}
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Wyślij reklamację
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
