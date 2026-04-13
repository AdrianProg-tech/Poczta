import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { Package, CheckCircle, Clock, MapPin, Navigation, Phone } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export default function CourierDashboard() {
  const stats = [
    { label: 'Dzisiejsze zadania', value: '12', icon: Package, color: 'text-accent' },
    { label: 'Zrealizowane', value: '8', icon: CheckCircle, color: 'text-success' },
    { label: 'Oczekujące', value: '4', icon: Clock, color: 'text-warning' },
  ];

  const tasks = [
    { 
      id: 'PW123456789PL', 
      type: 'Odbiór', 
      address: 'ul. Marszałkowska 104, Warszawa',
      recipient: 'Jan Kowalski',
      phone: '+48 123 456 789',
      time: '10:00 - 12:00',
      status: 'Oczekuje na odbiór',
      priority: 'normal'
    },
    { 
      id: 'PW987654321PL', 
      type: 'Dostawa', 
      address: 'ul. Floriańska 15, Kraków',
      recipient: 'Anna Nowak',
      phone: '+48 987 654 321',
      time: '14:00 - 16:00',
      status: 'W transporcie',
      priority: 'high'
    },
    { 
      id: 'PW555444333PL', 
      type: 'Dostawa', 
      address: 'ul. Długa 72, Wrocław',
      recipient: 'Piotr Wiśniewski',
      phone: '+48 555 444 333',
      time: '16:00 - 18:00',
      status: 'W transporcie',
      priority: 'normal'
    },
    { 
      id: 'PW111222333PL', 
      type: 'Odbiór', 
      address: 'ul. Złota 44, Warszawa',
      recipient: 'Maria Kowalczyk',
      phone: '+48 111 222 333',
      time: '12:00 - 14:00',
      status: 'Oczekuje na odbiór',
      priority: 'normal'
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
            <h2 className="text-2xl mb-2">Dzień dobry, Marek!</h2>
            <p className="text-muted-foreground">Masz 12 zadań do wykonania dzisiaj</p>
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
                <p className="text-white/80">4 punkty do odwiedzenia • ~45 km • ~3h 30min</p>
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
                          task.type === 'Odbiór' 
                            ? 'bg-info/10 text-info border border-info/20' 
                            : 'bg-success/10 text-success border border-success/20'
                        }`}>
                          {task.type}
                        </span>
                        {task.priority === 'high' && (
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
                          <div>{task.recipient}</div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{task.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">{task.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">{task.phone}</span>
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
                        {task.type === 'Odbiór' ? 'Odbierz' : 'Dostarcz'}
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
