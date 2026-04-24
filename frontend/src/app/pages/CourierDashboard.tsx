import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { Package, CheckCircle, Clock, MapPin, Navigation, Phone } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

export default function CourierDashboard() {
  const {
    state: { currentUser, shipments },
  } = useAppStateContext();
  const tasks = shipments.filter(
    (shipment) =>
      shipment.assignedCourierId === currentUser?.id &&
      shipment.status !== 'Doręczona' &&
      shipment.status !== 'Zwrócona',
  );

  const stats = [
    { label: 'Dzisiejsze zadania', value: String(tasks.length), icon: Package, color: 'text-accent' },
    {
      label: 'Zrealizowane',
      value: String(shipments.filter((shipment) => shipment.status === 'Doręczona').length),
      icon: CheckCircle,
      color: 'text-success',
    },
    {
      label: 'Oczekujące',
      value: String(tasks.filter((shipment) => shipment.status === 'Oczekuje na odbiór').length),
      icon: Clock,
      color: 'text-warning',
    },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar role="courier" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Dashboard kuriera" userName="Marek Nowak" />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-2xl mb-2">Dzień dobry, {currentUser?.name.split(' ')[0]}!</h2>
            <p className="text-muted-foreground">Masz {tasks.length} aktywnych zadań do obsłużenia</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <div className="text-3xl">{stat.value}</div>
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Route Overview */}
          <div className="bg-gradient-to-br from-accent to-accent/90 rounded-xl p-6 mb-8 text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl mb-2">Zaplanowana trasa</h3>
                <p className="text-white/80">{tasks.length} punktów do odwiedzenia • zoptymalizowana trasa dnia</p>
              </div>
              <button className="px-6 py-3 bg-white text-accent rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                <span>Rozpocznij trasę</span>
              </button>
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl">Lista zadań</h3>
            </div>

            <div className="divide-y divide-border">
              {tasks.map((task) => (
                <div key={task.id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-md text-xs ${
                          task.status === 'Oczekuje na odbiór' 
                            ? 'bg-info/10 text-info border border-info/20' 
                            : 'bg-success/10 text-success border border-success/20'
                        }`}>
                          {task.status === 'Oczekuje na odbiór' ? 'Odbiór' : 'Dostawa'}
                        </span>
                        {task.status === 'W transporcie' && (
                          <span className="px-3 py-1 rounded-md text-xs bg-warning/10 text-warning border border-warning/20">
                            Priorytet
                          </span>
                        )}
                        <StatusBadge status={task.status} />
                      </div>

                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Numer przesyłki</div>
                            <div>{task.id}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Klient</div>
                            <div>{task.recipient.name}</div>
                          </div>
                        </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{task.recipient.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Plan: {task.estimatedDelivery}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">{task.recipient.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:w-48">
                      <button className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">
                        Szczegóły
                      </button>
                      <button className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2">
                        <Navigation className="w-4 h-4" />
                        Nawiguj
                      </button>
                      <button className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {task.status === 'Oczekuje na odbiór' ? 'Odbierz' : 'Dostarcz'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
