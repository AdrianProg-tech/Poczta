import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { Users, Package, MapPin, CreditCard, TrendingUp, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAppStateContext } from '../state/AppStateContext';

export default function AdminDashboard() {
  const {
    state: { claims, points, shipments, users },
  } = useAppStateContext();

  const stats = [
    { label: 'Użytkownicy', value: String(users.length), change: '+12%', icon: Users, color: 'text-accent', trend: 'up' },
    { label: 'Przesyłki', value: String(shipments.length), change: '+8%', icon: Package, color: 'text-success', trend: 'up' },
    { label: 'Punkty odbioru', value: String(points.length), change: '+3%', icon: MapPin, color: 'text-info', trend: 'up' },
    {
      label: 'Reklamacje',
      value: String(claims.length),
      change: '-2%',
      icon: CreditCard,
      color: 'text-warning',
      trend: 'down',
    },
  ];

  const shipmentsData = [
    { name: 'Pon', przesyłki: 1200 },
    { name: 'Wt', przesyłki: 1350 },
    { name: 'Śr', przesyłki: 1100 },
    { name: 'Czw', przesyłki: 1450 },
    { name: 'Pt', przesyłki: 1600 },
    { name: 'Sob', przesyłki: 900 },
    { name: 'Ndz', przesyłki: 600 },
  ];

  const revenueData = [
    { name: 'Sty', przychód: 35000 },
    { name: 'Lut', przychód: 38000 },
    { name: 'Mar', przychód: 42000 },
    { name: 'Kwi', przychód: 45000 },
    { name: 'Maj', przychód: 48000 },
    { name: 'Cze', przychód: 52000 },
  ];

  const recentActivity = [
    { type: 'user', message: 'Nowy użytkownik: jan.kowalski@example.com', time: '5 min temu' },
    { type: 'shipment', message: 'Utworzono 15 nowych przesyłek', time: '12 min temu' },
    { type: 'payment', message: 'Płatność 1,234 PLN zweryfikowana', time: '18 min temu' },
    { type: 'claim', message: 'Nowa reklamacja #REK789', time: '23 min temu' },
    { type: 'point', message: 'Nowy punkt odbioru w Poznaniu', time: '35 min temu' },
  ];

  const topCouriers = [
    { name: 'Marek Nowak', deliveries: 142, rating: 4.9 },
    { name: 'Anna Kowalska', deliveries: 138, rating: 4.8 },
    { name: 'Piotr Wiśniewski', deliveries: 135, rating: 4.7 },
    { name: 'Maria Zielińska', deliveries: 128, rating: 4.9 },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar role="admin" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Panel administracyjny" userName="Administrator" />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-2xl mb-2">Panel administracyjny PingwinPost</h2>
            <p className="text-muted-foreground">Przegląd systemu i statystyki</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trend === 'up' ? 'text-success' : 'text-destructive'
                  }`}>
                    {stat.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {stat.change}
                  </div>
                </div>
                <div className="text-2xl mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Shipments Chart */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="text-lg mb-6">Przesyłki w tym tygodniu</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={shipmentsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF1" />
                  <XAxis dataKey="name" stroke="#5F6F7E" />
                  <YAxis stroke="#5F6F7E" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #D9E1E8',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="przesyłki" fill="#1A94BC" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Chart */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="text-lg mb-6">Przychód w ostatnich miesiącach</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF1" />
                  <XAxis dataKey="name" stroke="#5F6F7E" />
                  <YAxis stroke="#5F6F7E" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #D9E1E8',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="przychód" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg">Ostatnia aktywność</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        activity.type === 'user' ? 'bg-accent' :
                        activity.type === 'shipment' ? 'bg-success' :
                        activity.type === 'payment' ? 'bg-info' :
                        activity.type === 'claim' ? 'bg-warning' :
                        'bg-muted'
                      }`}></div>
                      <div className="flex-1">
                        <div className="text-sm">{activity.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Couriers */}
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg">Najlepsi kurierzy tego miesiąca</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topCouriers.map((courier, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white">
                          {index + 1}
                        </div>
                        <div>
                          <div>{courier.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {courier.deliveries} dostaw
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-warning" />
                        <span>{courier.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
