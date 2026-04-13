import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { Package, MapPin, User, Calendar, CreditCard, Printer, RotateCcw, AlertCircle, Download } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router';

export default function ShipmentDetails() {
  const shipment = {
    id: 'PW123456789PL',
    status: 'W transporcie',
    paymentStatus: 'Opłacona',
    created: '24.03.2026 16:45',
    estimatedDelivery: '26.03.2026',
    sender: {
      name: 'Jan Kowalski',
      phone: '+48 123 456 789',
      address: 'ul. Marszałkowska 1, 00-017 Warszawa',
    },
    recipient: {
      name: 'Anna Nowak',
      phone: '+48 987 654 321',
      address: 'ul. Floriańska 15, 31-019 Kraków',
    },
    package: {
      weight: '2.5 kg',
      dimensions: '30 x 20 x 15 cm',
      type: 'Paczka standardowa',
      value: '250 PLN',
    },
    payment: {
      method: 'Karta płatnicza',
      amount: '24.99 PLN',
      date: '24.03.2026 18:20',
    },
    history: [
      { date: '25.03.2026 14:30', location: 'Katowice - Sortownia', status: 'W transporcie', description: 'Przesyłka w drodze' },
      { date: '25.03.2026 09:15', location: 'Warszawa - Punkt nadania', status: 'Nadana', description: 'Przesyłka nadana' },
      { date: '24.03.2026 18:20', location: 'Warszawa - Magazyn', status: 'Opłacona', description: 'Przesyłka opłacona' },
      { date: '24.03.2026 16:45', location: 'Online', status: 'Utworzona', description: 'Przesyłka utworzona' },
    ],
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar role="client" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Szczegóły przesyłki" />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl">{shipment.id}</h2>
                <StatusBadge status={shipment.status} />
              </div>
              <p className="text-muted-foreground">Utworzona: {shipment.created}</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Etykieta
              </button>
              <button className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Drukuj
              </button>
              <Link
                to="/client/shipments/redirect"
                className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Przekieruj
              </Link>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Sender & Recipient */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h3 className="text-lg mb-4">Szczegóły adresowe</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <User className="w-4 h-4" />
                      <span className="text-sm uppercase tracking-wide">Nadawca</span>
                    </div>
                    <div className="space-y-1">
                      <div>{shipment.sender.name}</div>
                      <div className="text-sm text-muted-foreground">{shipment.sender.phone}</div>
                      <div className="text-sm text-muted-foreground flex items-start gap-1">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {shipment.sender.address}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <User className="w-4 h-4" />
                      <span className="text-sm uppercase tracking-wide">Odbiorca</span>
                    </div>
                    <div className="space-y-1">
                      <div>{shipment.recipient.name}</div>
                      <div className="text-sm text-muted-foreground">{shipment.recipient.phone}</div>
                      <div className="text-sm text-muted-foreground flex items-start gap-1">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {shipment.recipient.address}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Info */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h3 className="text-lg mb-4">Informacje o paczce</h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Typ przesyłki</div>
                    <div>{shipment.package.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Waga</div>
                    <div>{shipment.package.weight}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Wymiary</div>
                    <div>{shipment.package.dimensions}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Wartość</div>
                    <div>{shipment.package.value}</div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h3 className="text-lg mb-6">Historia przesyłki</h3>
                <div className="space-y-6">
                  {shipment.history.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-accent' : 'bg-muted'
                        }`}></div>
                        {index !== shipment.history.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center gap-3 mb-1">
                          <StatusBadge status={item.status} />
                          <span className="text-sm text-muted-foreground">{item.date}</span>
                        </div>
                        <div className="mb-1">{item.description}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {item.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Delivery Info */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h3 className="text-lg mb-4">Informacje o dostawie</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-accent" />
                    <div>
                      <div className="text-sm text-muted-foreground">Przewidywana dostawa</div>
                      <div>{shipment.estimatedDelivery}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Status przesyłki</div>
                    <StatusBadge status={shipment.status} />
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h3 className="text-lg mb-4">Płatność</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <StatusBadge status={shipment.paymentStatus} type="payment" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Kwota</span>
                    <span>{shipment.payment.amount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Metoda</span>
                    <span className="text-sm">{shipment.payment.method}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Data</span>
                    <span className="text-sm">{shipment.payment.date}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-destructive/10 rounded-xl border border-destructive/20 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div>
                    <h4 className="text-sm mb-1">Problem z przesyłką?</h4>
                    <p className="text-sm text-muted-foreground">Zgłoś reklamację lub skontaktuj się z obsługą</p>
                  </div>
                </div>
                <Link
                  to="/client/claims"
                  className="block w-full text-center px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors"
                >
                  Zgłoś reklamację
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
