import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { Package, MapPin, User, CreditCard, ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';

export default function CreateShipment() {
  const [step, setStep] = useState(1);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar role="client" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Nowa przesyłka" />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Steps */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: 'Dane adresowe' },
                { num: 2, label: 'Szczegóły paczki' },
                { num: 3, label: 'Płatność' },
                { num: 4, label: 'Podsumowanie' },
              ].map((s, idx) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        step >= s.num
                          ? 'bg-accent border-accent text-white'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                    </div>
                    <div className={`mt-2 text-sm hidden md:block ${
                      step >= s.num ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {s.label}
                    </div>
                  </div>
                  {idx < 3 && (
                    <div className={`h-0.5 flex-1 ${step > s.num ? 'bg-accent' : 'bg-border'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                  {step === 1 && (
                    <div>
                      <h3 className="text-xl mb-6">Dane adresowe</h3>
                      
                      {/* Sender */}
                      <div className="mb-6">
                        <h4 className="mb-4 flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4" />
                          Nadawca
                        </h4>
                        <div className="space-y-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block mb-2 text-sm">Imię i nazwisko</label>
                              <input
                                type="text"
                                placeholder="Jan Kowalski"
                                defaultValue="Jan Kowalski"
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm">Telefon</label>
                              <input
                                type="tel"
                                placeholder="+48 123 456 789"
                                defaultValue="+48 123 456 789"
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block mb-2 text-sm">Adres</label>
                            <input
                              type="text"
                              placeholder="ul. Marszałkowska 1"
                              defaultValue="ul. Marszałkowska 1, 00-017 Warszawa"
                              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Recipient */}
                      <div>
                        <h4 className="mb-4 flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          Odbiorca
                        </h4>
                        <div className="space-y-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block mb-2 text-sm">Imię i nazwisko</label>
                              <input
                                type="text"
                                placeholder="Anna Nowak"
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm">Telefon</label>
                              <input
                                type="tel"
                                placeholder="+48 987 654 321"
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block mb-2 text-sm">Adres lub punkt odbioru</label>
                            <input
                              type="text"
                              placeholder="ul. Floriańska 15, 31-019 Kraków"
                              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                            />
                          </div>
                          <button className="text-accent hover:text-accent/80 text-sm">
                            + Wybierz punkt odbioru lub paczkomat
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <h3 className="text-xl mb-6">Szczegóły paczki</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-sm">Typ przesyłki</label>
                          <select className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background">
                            <option>Paczka standardowa</option>
                            <option>Paczka ekspresowa</option>
                            <option>List polecony</option>
                            <option>Paczka ponadgabarytowa</option>
                          </select>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block mb-2 text-sm">Waga (kg)</label>
                            <input
                              type="number"
                              placeholder="2.5"
                              step="0.1"
                              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-sm">Długość (cm)</label>
                            <input
                              type="number"
                              placeholder="30"
                              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-sm">Szerokość (cm)</label>
                            <input
                              type="number"
                              placeholder="20"
                              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block mb-2 text-sm">Wartość przesyłki (PLN)</label>
                          <input
                            type="number"
                            placeholder="250"
                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Ubezpieczenie do podanej wartości</p>
                        </div>

                        <div>
                          <label className="block mb-2 text-sm">Zawartość (opcjonalne)</label>
                          <textarea
                            placeholder="Opis zawartości paczki"
                            rows={3}
                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background resize-none"
                          ></textarea>
                        </div>

                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="fragile" className="w-4 h-4 rounded border-border" />
                          <label htmlFor="fragile" className="text-sm">Zawartość krucha - delikatna obsługa</label>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <h3 className="text-xl mb-6">Płatność</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-sm">Metoda płatności</label>
                          <div className="space-y-3">
                            <label className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted cursor-pointer">
                              <input type="radio" name="payment" defaultChecked className="w-4 h-4" />
                              <CreditCard className="w-5 h-5 text-muted-foreground" />
                              <span>Karta płatnicza</span>
                            </label>
                            <label className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted cursor-pointer">
                              <input type="radio" name="payment" className="w-4 h-4" />
                              <Package className="w-5 h-5 text-muted-foreground" />
                              <span>Przelew online</span>
                            </label>
                            <label className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted cursor-pointer">
                              <input type="radio" name="payment" className="w-4 h-4" />
                              <MapPin className="w-5 h-5 text-muted-foreground" />
                              <span>Płatność w punkcie</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div>
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-success" />
                          </div>
                          <h3 className="text-2xl mb-2">Przesyłka utworzona!</h3>
                          <p className="text-muted-foreground mb-6">Numer przesyłki: PW123456789PL</p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">
                              Pobierz etykietę
                            </button>
                            <button className="px-6 py-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
                              Zobacz szczegóły
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                    <button
                      onClick={() => step > 1 && setStep(step - 1)}
                      disabled={step === 1}
                      className="px-6 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Wstecz
                    </button>
                    <button
                      onClick={() => step < 4 && setStep(step + 1)}
                      className="px-6 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
                    >
                      {step === 3 ? 'Utwórz przesyłkę' : 'Dalej'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary Sidebar */}
              <div>
                <div className="bg-card rounded-xl border border-border shadow-sm p-6 sticky top-6">
                  <h3 className="text-lg mb-4">Podsumowanie</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Podstawowa opłata</span>
                      <span>19.99 PLN</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ubezpieczenie</span>
                      <span>5.00 PLN</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Obsługa delikatna</span>
                      <span>-</span>
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between">
                      <span>Razem</span>
                      <span className="text-xl text-accent">24.99 PLN</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-secondary rounded-lg">
                      <div className="text-muted-foreground mb-1">Przewidywana dostawa</div>
                      <div>26.03.2026</div>
                    </div>
                    <div className="p-3 bg-secondary rounded-lg">
                      <div className="text-muted-foreground mb-1">Czas dostawy</div>
                      <div>1-2 dni robocze</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
