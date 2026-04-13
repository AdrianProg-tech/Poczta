import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { Package, TrendingUp, Clock, CheckCircle, Plus, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router';

export default function ClientDashboard() {
  const stats = [
    { label: 'Aktywne przesyłki', value: '5', icon: Package, color: 'text-accent' },
    { label: 'W tym miesiącu', value: '12', icon: TrendingUp, color: 'text-success' },
    { label: 'Oczekujące', value: '2', icon: Clock, color: 'text-warning' },
    { label: 'Doręczone', value: '47', icon: CheckCircle, color: 'text-success' },
  ];

  const recentShipments = [
    { id: 'PW123456789PL', status: 'W transporcie', recipient: 'Anna Nowak', date: '25.03.2026', destination: 'Kraków' },
    { id: 'PW987654321PL', status: 'Oczekuje na odbiór', recipient: 'Piotr Wiśniewski', date: '24.03.2026', destination: 'Warszawa' },
    { id: 'PW555444333PL', status: 'Doręczona', recipient: 'Maria Kowalczyk', date: '23.03.2026', destination: 'Gdańsk' },
    { id: 'PW111222333PL', status: 'Nadana', recipient: 'Tomasz Lewandowski', date: '25.03.2026', destination: 'Wrocław' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar role="client" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Dashboard" />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl mb-2">Witaj ponownie, Jan!</h2>
            <p className="text-muted-foreground">Oto podsumowanie Twoich przesyłek</p>
          </div>

          {/* Stats Grid */}
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
          <div className="bg-gradient-to-br from-accent to-accent/90 rounded-xl p-6 mb-8 text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl mb-2">Wyślij nową przesyłkę</h3>
                <p className="text-white/80">Szybko i wygodnie utwórz nową przesyłkę</p>
              </div>
              <Link
                to="/client/shipments/create"
                className="px-6 py-3 bg-white text-accent rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Nowa przesyłka</span>
              </Link>
            </div>
          </div>

          {/* Recent Shipments */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xl">Ostatnie przesyłki</h3>
                <Link
                  to="/client/shipments"
                  className="text-accent hover:text-accent/80 transition-colors flex items-center gap-1 text-sm"
                >
                  Zobacz wszystkie
                  <ArrowRight className="w-4 h-4" />
                </Link>
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                      Odbiorca
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                      Miejsce docelowe
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/client/shipments/${shipment.id}`} className="text-accent hover:underline">
                          {shipment.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={shipment.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{shipment.recipient}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{shipment.destination}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{shipment.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/client/shipments/${shipment.id}`}
                          className="text-accent hover:text-accent/80 transition-colors text-sm"
                        >
                          Szczegóły
                        </Link>
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
