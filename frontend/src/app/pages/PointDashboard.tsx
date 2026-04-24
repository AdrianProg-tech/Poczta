import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { Package, CheckCircle, Clock, Download, Upload, Search, Scan } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

export default function PointDashboard() {
  const {
    state: { currentUser, shipments },
  } = useAppStateContext();
  const pointShipments = shipments.filter((shipment) => shipment.pointId === currentUser?.id);

  const stats = [
    {
      label: 'Do wydania',
      value: String(pointShipments.filter((shipment) => shipment.status === 'Oczekuje na odbiór').length),
      icon: Download,
      color: 'text-accent',
    },
    {
      label: 'Do nadania',
      value: String(pointShipments.filter((shipment) => shipment.status === 'Nadana').length),
      icon: Upload,
      color: 'text-info',
    },
    { label: 'Wydane dzisiaj', value: '2', icon: CheckCircle, color: 'text-success' },
    { label: 'Oczekujące', value: String(pointShipments.length), icon: Clock, color: 'text-warning' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar role="point" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Dashboard punktu" userName="Punkt Warszawa Centrum" />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-2xl mb-2">Panel punktu odbioru</h2>
            <p className="text-muted-foreground">{currentUser?.location}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-accent to-accent/90 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl mb-2">Wydaj przesyłkę</h3>
                  <p className="text-white/80">Zeskanuj kod lub wpisz numer</p>
                </div>
                <button className="px-6 py-3 bg-white text-accent rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  <span>Wydaj</span>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-success to-success/90 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl mb-2">Przyjmij przesyłkę</h3>
                  <p className="text-white/80">Nadaj nową przesyłkę</p>
                </div>
                <button className="px-6 py-3 bg-white text-success rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  <span>Przyjmij</span>
                </button>
              </div>
            </div>
          </div>

          {/* Shipments List */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="p-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl">Przesyłki w punkcie</h3>
                
                <div className="flex gap-3">
                  <div className="relative flex-1 sm:flex-initial sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Szukaj..."
                      className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background text-sm"
                    />
                  </div>
                  <button className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
                    <Scan className="w-4 h-4" />
                    <span className="hidden sm:inline">Skan</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                      Numer
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                      Typ
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                      Klient
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                      Płatność
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                      Przyjęto
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                      Wygasa
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pointShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-accent">{shipment.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs ${
                          shipment.status === 'Oczekuje na odbiór' 
                            ? 'bg-accent/10 text-accent border border-accent/20' 
                            : 'bg-info/10 text-info border border-info/20'
                        }`}>
                          {shipment.status === 'Oczekuje na odbiór' ? 'Do wydania' : 'Do nadania'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{shipment.recipient.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={shipment.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={shipment.payment.status} type="payment" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {shipment.created}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {shipment.estimatedDelivery}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-accent hover:text-accent/80 transition-colors text-sm">
                          {shipment.status === 'Oczekuje na odbiór' ? 'Wydaj' : 'Potwierdź'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
