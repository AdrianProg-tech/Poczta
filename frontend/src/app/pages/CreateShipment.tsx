import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { Package, MapPin, User, CreditCard, ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { useAppStateContext } from '../state/AppStateContext';

interface CreateShipmentFormValues {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  type: string;
  weight: number;
  length: number;
  width: number;
  value: number;
  contents: string;
  fragile: boolean;
  paymentMethod: 'Karta płatnicza' | 'Przelew online' | 'Płatność w punkcie';
}

export default function CreateShipment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [createdShipmentId, setCreatedShipmentId] = useState<string | null>(null);
  const {
    state: { currentUser },
    createShipment,
  } = useAppStateContext();
  const {
    register,
    trigger,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateShipmentFormValues>({
    defaultValues: {
      senderName: currentUser?.name ?? 'Jan Kowalski',
      senderPhone: '+48 123 456 789',
      senderAddress: 'ul. Marszałkowska 1, 00-017 Warszawa',
      recipientName: '',
      recipientPhone: '',
      recipientAddress: '',
      type: 'Paczka standardowa',
      weight: 2.5,
      length: 30,
      width: 20,
      value: 250,
      contents: '',
      fragile: false,
      paymentMethod: 'Karta płatnicza',
    },
  });

  const stepFields: Record<number, FieldPath<CreateShipmentFormValues>[]> = {
    1: [
      'senderName',
      'senderPhone',
      'senderAddress',
      'recipientName',
      'recipientPhone',
      'recipientAddress',
    ],
    2: ['type', 'weight', 'length', 'width', 'value'],
    3: ['paymentMethod'],
  };

  const insuranceCost = watch('value') > 0 ? 5 : 0;
  const totalCost = (19.99 + insuranceCost).toFixed(2);

  const finishShipment = handleSubmit((values) => {
    const shipmentId = createShipment({
      sender: {
        name: values.senderName,
        phone: values.senderPhone,
        address: values.senderAddress,
      },
      recipient: {
        name: values.recipientName,
        phone: values.recipientPhone,
        address: values.recipientAddress,
      },
      package: {
        type: values.type,
        weight: `${values.weight} kg`,
        dimensions: `${values.length} x ${values.width} x 15 cm`,
        value: `${values.value} PLN`,
        contents: values.contents,
        fragile: values.fragile,
      },
      paymentMethod: values.paymentMethod,
    });

    setCreatedShipmentId(shipmentId);
    setStep(4);
  });

  async function handlePrimaryAction() {
    if (step < 3) {
      const isValid = await trigger(stepFields[step]);
      if (isValid) {
        setStep(step + 1);
      }
      return;
    }

    const isValid = await trigger(stepFields[3]);
    if (isValid) {
      finishShipment();
    }
  }

  function renderFieldError(fieldName: FieldPath<CreateShipmentFormValues>) {
    const error = errors[fieldName];
    if (!error?.message) {
      return null;
    }

    return <p className="text-sm text-destructive mt-1">{String(error.message)}</p>;
  }

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
                                {...register('senderName', { required: 'Podaj imię i nazwisko nadawcy.' })}
                                type="text"
                                placeholder="Jan Kowalski"
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                              />
                              {renderFieldError('senderName')}
                            </div>
                            <div>
                              <label className="block mb-2 text-sm">Telefon</label>
                              <input
                                {...register('senderPhone', {
                                  required: 'Podaj telefon nadawcy.',
                                  minLength: { value: 9, message: 'Podaj poprawny numer telefonu.' },
                                })}
                                type="tel"
                                placeholder="+48 123 456 789"
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                              />
                              {renderFieldError('senderPhone')}
                            </div>
                          </div>
                          <div>
                            <label className="block mb-2 text-sm">Adres</label>
                            <input
                              {...register('senderAddress', { required: 'Podaj adres nadawcy.' })}
                              type="text"
                              placeholder="ul. Marszałkowska 1"
                              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                            />
                            {renderFieldError('senderAddress')}
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
                                {...register('recipientName', { required: 'Podaj imię i nazwisko odbiorcy.' })}
                                type="text"
                                placeholder="Anna Nowak"
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                              />
                              {renderFieldError('recipientName')}
                            </div>
                            <div>
                              <label className="block mb-2 text-sm">Telefon</label>
                              <input
                                {...register('recipientPhone', {
                                  required: 'Podaj telefon odbiorcy.',
                                  minLength: { value: 9, message: 'Podaj poprawny numer telefonu.' },
                                })}
                                type="tel"
                                placeholder="+48 987 654 321"
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                              />
                              {renderFieldError('recipientPhone')}
                            </div>
                          </div>
                          <div>
                            <label className="block mb-2 text-sm">Adres lub punkt odbioru</label>
                            <input
                              {...register('recipientAddress', { required: 'Podaj adres odbiorcy.' })}
                              type="text"
                              placeholder="ul. Floriańska 15, 31-019 Kraków"
                              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                            />
                            {renderFieldError('recipientAddress')}
                          </div>
                          <button type="button" className="text-accent hover:text-accent/80 text-sm">
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
                          <select
                            {...register('type', { required: 'Wybierz typ przesyłki.' })}
                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                          >
                            <option>Paczka standardowa</option>
                            <option>Paczka ekspresowa</option>
                            <option>List polecony</option>
                            <option>Paczka ponadgabarytowa</option>
                          </select>
                          {renderFieldError('type')}
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block mb-2 text-sm">Waga (kg)</label>
                            <input
                              {...register('weight', {
                                required: 'Podaj wagę.',
                                min: { value: 0.1, message: 'Waga musi być większa od zera.' },
                                valueAsNumber: true,
                              })}
                              type="number"
                              placeholder="2.5"
                              step="0.1"
                              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                            />
                            {renderFieldError('weight')}
                          </div>
                          <div>
                            <label className="block mb-2 text-sm">Długość (cm)</label>
                            <input
                              {...register('length', {
                                required: 'Podaj długość.',
                                min: { value: 1, message: 'Długość musi być dodatnia.' },
                                valueAsNumber: true,
                              })}
                              type="number"
                              placeholder="30"
                              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                            />
                            {renderFieldError('length')}
                          </div>
                          <div>
                            <label className="block mb-2 text-sm">Szerokość (cm)</label>
                            <input
                              {...register('width', {
                                required: 'Podaj szerokość.',
                                min: { value: 1, message: 'Szerokość musi być dodatnia.' },
                                valueAsNumber: true,
                              })}
                              type="number"
                              placeholder="20"
                              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                            />
                            {renderFieldError('width')}
                          </div>
                        </div>

                        <div>
                          <label className="block mb-2 text-sm">Wartość przesyłki (PLN)</label>
                          <input
                            {...register('value', {
                              required: 'Podaj wartość przesyłki.',
                              min: { value: 1, message: 'Wartość musi być większa od zera.' },
                              valueAsNumber: true,
                            })}
                            type="number"
                            placeholder="250"
                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Ubezpieczenie do podanej wartości</p>
                          {renderFieldError('value')}
                        </div>

                        <div>
                          <label className="block mb-2 text-sm">Zawartość (opcjonalne)</label>
                          <textarea
                            {...register('contents')}
                            placeholder="Opis zawartości paczki"
                            rows={3}
                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background resize-none"
                          ></textarea>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            {...register('fragile')}
                            type="checkbox"
                            id="fragile"
                            className="w-4 h-4 rounded border-border"
                          />
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
                              <input
                                {...register('paymentMethod', { required: 'Wybierz metodę płatności.' })}
                                type="radio"
                                value="Karta płatnicza"
                                className="w-4 h-4"
                              />
                              <CreditCard className="w-5 h-5 text-muted-foreground" />
                              <span>Karta płatnicza</span>
                            </label>
                            <label className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted cursor-pointer">
                              <input
                                {...register('paymentMethod', { required: 'Wybierz metodę płatności.' })}
                                type="radio"
                                value="Przelew online"
                                className="w-4 h-4"
                              />
                              <Package className="w-5 h-5 text-muted-foreground" />
                              <span>Przelew online</span>
                            </label>
                            <label className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted cursor-pointer">
                              <input
                                {...register('paymentMethod', { required: 'Wybierz metodę płatności.' })}
                                type="radio"
                                value="Płatność w punkcie"
                                className="w-4 h-4"
                              />
                              <MapPin className="w-5 h-5 text-muted-foreground" />
                              <span>Płatność w punkcie</span>
                            </label>
                          </div>
                          {renderFieldError('paymentMethod')}
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
                          <p className="text-muted-foreground mb-6">Numer przesyłki: {createdShipmentId}</p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                              type="button"
                              className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                            >
                              Pobierz etykietę
                            </button>
                            <button
                              type="button"
                              onClick={() => createdShipmentId && navigate(`/client/shipments/${createdShipmentId}`)}
                              className="px-6 py-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                            >
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
                      type="button"
                      onClick={() => step > 1 && setStep(step - 1)}
                      disabled={step === 1}
                      className="px-6 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Wstecz
                    </button>
                    <button
                      type="button"
                      onClick={handlePrimaryAction}
                      disabled={step === 4}
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
                      <span>{insuranceCost.toFixed(2)} PLN</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Obsługa delikatna</span>
                      <span>{watch('fragile') ? '3.00 PLN' : '-'}</span>
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between">
                      <span>Razem</span>
                      <span className="text-xl text-accent">{totalCost} PLN</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-secondary rounded-lg">
                      <div className="text-muted-foreground mb-1">Przewidywana dostawa</div>
                      <div>2 dni robocze</div>
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
