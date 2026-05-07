import { useState } from 'react';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';
import { updateBulkShipmentStatus } from '../api';
import { CheckSquare } from 'lucide-react';

export default function CourierTasks() {
  const {
    state: { currentUser, shipments },
  } = useAppStateContext();

  // KOSZYK KURIERA - tu trzymamy ID paczek zaznaczonych ptaszkiem 
  const [selectedTasksIds, setSelectedTasksIds] = useState<string[]>([]);

  const tasks = shipments.filter(
    (shipment) =>
      shipment.assignedCourierId === currentUser?.id &&
      shipment.status !== 'Doręczona' &&
      shipment.status !== 'Zwrócona',
  );

  // Tutaj zaznaczamy kwadraciki - dodajemy lub usuwamy ID paczki z koszyka
  const toggleTaskSelection = (id: string) => {
    setSelectedTasksIds((prev) => 
      prev.includes(id) ? prev.filter((taskId) => taskId !== id) : [...prev, id] 
    );
  };

  // Akcja po kliknięciu przycisku "Wydaj do doręczenia"
  const handleBulkUpdate = async () => {
    if (selectedTasksIds.length === 0) return;

    alert(`Wysyłam do Javy prośbę o zmianę statusu dla paczek: ${selectedTasksIds.join(', ')}`);
    
    const success = await updateBulkShipmentStatus(selectedTasksIds, 'OUT_FOR_DELIVERY');
    if (success) {
      alert('Status paczek został zaktualizowany w bazie danych!');
      setSelectedTasksIds([]); // czyścimy zaznaczenie po sukcesie
    } else {
      alert('Wystąpił błąd. Upewnij się, że serwer Java jest włączony w IntelliJ!');
    }
  }

  return (
    <DashboardShell role="courier" title="Zadania kuriera">
    
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl mb-2">Dzisiejsze zadania</h2>
          <p className="text-muted-foreground">Lista aktywnych przesyłek przypisanych do kuriera.</p>
        </div>

        <button
          onClick={handleBulkUpdate}
          disabled={selectedTasksIds.length === 0}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
            selectedTasksIds.length > 0
              ? 'bg-accent text-white hover:bg-accent/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          Wydaj do doręczenia ({selectedTasksIds.length})
        </button>
      </div>
    
      <div className="grid gap-4">
        {tasks.map((task) => (

          <div key={task.id} className="bg-card border border-border rounded-xl shadow-sm p-6 flex gap-4">
            
            <div className="pt-1">
              <input
                type="checkbox"
                className="w-5 h-5 cursor-pointer accent-accent"
                checked={selectedTasksIds.includes(task.id)}
                onChange={() => toggleTaskSelection(task.id)}
              />
            </div>
            
            <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-lg">{task.id}</div>
                  <StatusBadge status={task.status} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Odbiorca</div>
                    <div>{task.recipient.name}</div>
                    <div className="text-muted-foreground">{task.recipient.phone}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Adres dostawy</div>
                    <div>{task.recipient.address}</div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Planowana dostawa: {task.estimatedDelivery}
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}