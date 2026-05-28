import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { ArrowRight, Check, CreditCard, MapPin, Package, Truck, User } from 'lucide-react';
import { calculateShipmentPrice, createClientShipment, getPublicPoints, type PublicPoint } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

const CITIES = [
  'Warszawa', 'Łódź', 'Kraków', 'Wrocław', 'Poznań',
  'Gdańsk', 'Szczecin', 'Lublin', 'Katowice', 'Bydgoszcz',
];

interface CreateShipmentFormValues {
  deliveryType: 'COURIER' | 'PICKUP_POINT';
  // Sender
  senderName: string;
  senderPhone: string;
  senderCity: string;       // COURIER only
  senderStreet: string;     // COURIER only
  sourcePointCode: string;  // PICKUP_POINT only — punkt nadania
  // Recipient
  recipientName: string;
  recipientPhone: string;
  recipientCity: string;    // COURIER only
  recipientStreet: string;  // COURIER only
  // Delivery
  targetPointCode: string;  // PICKUP_POINT only — punkt odbioru
  // Parcel
  weight: number;
  sizeCategory: 'S' | 'M' | 'L';
  declaredValue: number;
  contents: string;
  fragile: boolean;
  // Payment
  paymentMethod: 'ONLINE' | 'OFFLINE_AT_POINT' | 'OFFLINE_AT_COURIER';
}

function getStepFields(
  step: number,
  deliveryType: 'COURIER' | 'PICKUP_POINT',
): Array<keyof CreateShipmentFormValues> {
  if (step === 1) {
    if (deliveryType === 'PICKUP_POINT') {
      return ['deliveryType', 'senderName', 'senderPhone', 'sourcePointCode', 'recipientName', 'recipientPhone'];
    }
    return ['deliveryType', 'senderName', 'senderPhone', 'senderCity', 'senderStreet', 'recipientName', 'recipientPhone', 'recipientCity', 'recipientStreet'];
  }
  if (step === 2) {
    const base: Array<keyof CreateShipmentFormValues> = ['weight', 'sizeCategory', 'declaredValue'];
    return deliveryType === 'PICKUP_POINT' ? ['targetPointCode', ...base] : base;
  }
  return ['paymentMethod'];
}

export default function CreateShipment() {
  const navigate = useNavigate();
  const {
    state: { currentUser },
  } = useAppStateContext();

  const [step, setStep] = useState(1);
  const [points, setPoints] = useState<PublicPoint[]>([]);
  const [createdTrackingNumber, setCreatedTrackingNumber] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<CreateShipmentFormValues>({
    defaultValues: {
      deliveryType: 'COURIER',
      senderName: currentUser?.name ?? 'Jan Kowalski',
      senderPhone: '+48 500 100 102',
      senderCity: 'Łódź',
      senderStreet: 'Narutowicza 14',
      sourcePointCode: '',
      recipientName: '',
      recipientPhone: '',
      recipientCity: 'Warszawa',
      recipientStreet: '',
      targetPointCode: '',
      weight: 1.5,
      sizeCategory: 'M',
      declaredValue: 100,
      contents: '',
      fragile: false,
      paymentMethod: 'ONLINE',
    },
  });

  useEffect(() => {
    let active = true;

    async function loadPoints() {
      try {
        const data = await getPublicPoints();
        if (!active) return;
        const activePoints = data.filter((point) => point.active);
        setPoints(activePoints);
        if (activePoints[0]) {
          setValue('targetPointCode', activePoints[0].pointCode);
          setValue('sourcePointCode', activePoints[0].pointCode);
        }
      } catch {
        if (active) setPoints([]);
      }
    }

    void loadPoints();
    return () => { active = false; };
  }, [setValue]);

  const deliveryType = watch('deliveryType');
  const paymentMethod = watch('paymentMethod');
  const declaredValue = watch('declaredValue');
  const fragile = watch('fragile');

  useEffect(() => {
    if (deliveryType === 'PICKUP_POINT' && paymentMethod === 'OFFLINE_AT_COURIER') {
      setValue('paymentMethod', 'ONLINE');
    }
    if (deliveryType === 'COURIER' && paymentMethod === 'OFFLINE_AT_POINT') {
      setValue('paymentMethod', 'ONLINE');
    }
  }, [deliveryType, paymentMethod, setValue]);

  const priceSummary = useMemo(() => {
    const base = 19.99;
    const insurance = declaredValue > 0 ? 5 : 0;
    const fragileFee = fragile ? 3 : 0;
    return { base, insurance, fragileFee, total: calculateShipmentPrice(declaredValue, fragile).toFixed(2) };
  }, [declaredValue, fragile]);

  const finishShipment = handleSubmit(async (values) => {
    if (!currentUser?.email) {
      setSubmitError('Brak aktywnej sesji klienta.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const sourcePoint = points.find((p) => p.pointCode === values.sourcePointCode);
    const targetPoint = points.find((p) => p.pointCode === values.targetPointCode);

    const senderAddress =
      values.deliveryType === 'PICKUP_POINT'
        ? `${sourcePoint?.city ?? 'Warszawa'}, ${sourcePoint?.name ?? values.sourcePointCode}`
        : `${values.senderCity}, ${values.senderStreet}`;

    const recipientAddress =
      values.deliveryType === 'PICKUP_POINT'
        ? `${targetPoint?.city ?? 'Warszawa'}, ${targetPoint?.name ?? values.targetPointCode}`
        : `${values.recipientCity}, ${values.recipientStreet}`;

    try {
      const response = await createClientShipment(currentUser.email, {
        sender: { name: values.senderName, phone: values.senderPhone, address: senderAddress },
        recipient: { name: values.recipientName, phone: values.recipientPhone, address: recipientAddress },
        delivery: {
          deliveryType: values.deliveryType,
          targetPointCode: values.deliveryType === 'PICKUP_POINT' ? values.targetPointCode : undefined,
        },
        parcel: {
          weight: values.weight,
          sizeCategory: values.sizeCategory,
          declaredValue: values.declaredValue,
          contents: values.contents || undefined,
          fragile: values.fragile,
        },
        payment: { method: values.paymentMethod },
      });

      setCreatedTrackingNumber(response.trackingNumber);
      setStep(4);
    } catch (requestError) {
      setSubmitError(requestError instanceof Error ? requestError.message : 'Nie udało się utworzyć przesyłki.');
    } finally {
      setIsSubmitting(false);
    }
  });

  async function handlePrimaryAction() {
    if (step < 3) {
      const fieldsToValidate = getStepFields(step, deliveryType);
      const isValid = await trigger(fieldsToValidate);
      if (isValid) setStep(step + 1);
      return;
    }
    const isValid = await trigger(getStepFields(3, deliveryType));
    if (isValid) await finishShipment();
  }

  const isPickup = deliveryType === 'PICKUP_POINT';

  return (
    <DashboardShell role="client" title="Nowa przesyłka">
      <div className="mx-auto max-w-5xl">
        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-between gap-4">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex flex-1 items-center">
              <div className="flex flex-1 flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    step >= stepNumber ? 'border-accent bg-accent text-white' : 'border-border text-muted-foreground'
                  }`}
                >
                  {step > stepNumber ? <Check className="h-5 w-5" /> : stepNumber}
                </div>
              </div>
              {stepNumber < 4 ? <div className={`h-0.5 flex-1 ${step > stepNumber ? 'bg-accent' : 'bg-border'}`} /> : null}
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">

              {/* ── STEP 1: dane nadawcy / odbiorcy ── */}
              {step === 1 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-xl">Sposób nadania</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                          !isPickup ? 'border-accent bg-accent/5' : 'border-border hover:bg-muted'
                        }`}
                      >
                        <input {...register('deliveryType')} type="radio" value="COURIER" className="sr-only" />
                        <Truck className={`mb-2 h-5 w-5 ${!isPickup ? 'text-accent' : 'text-muted-foreground'}`} />
                        <div className="font-medium">Kurier od domu</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Kurier przyjedzie po paczkę pod Twój adres i dostarczy do odbiorcy.
                        </div>
                      </label>
                      <label
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                          isPickup ? 'border-accent bg-accent/5' : 'border-border hover:bg-muted'
                        }`}
                      >
                        <input {...register('deliveryType')} type="radio" value="PICKUP_POINT" className="sr-only" />
                        <MapPin className={`mb-2 h-5 w-5 ${isPickup ? 'text-accent' : 'text-muted-foreground'}`} />
                        <div className="font-medium">Punkt / paczkomat</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Przynosisz paczkę do punktu, odbiorca odbiera w innym punkcie lub paczkomacie.
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* ── Nadawca ── */}
                  <div>
                    <div className="mb-4 flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      Nadawca
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm">Imię i nazwisko</label>
                        <input
                          {...register('senderName', { required: 'Podaj nadawcę.' })}
                          className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                        />
                        {errors.senderName ? <p className="mt-1 text-sm text-destructive">{errors.senderName.message}</p> : null}
                      </div>
                      <div>
                        <label className="mb-2 block text-sm">Telefon</label>
                        <input
                          {...register('senderPhone', {
                            required: 'Podaj telefon nadawcy.',
                            pattern: { value: /^[+\d][\d\s\-()\d]{6,19}$/, message: 'Podaj poprawny numer telefonu.' },
                          })}
                          className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                        />
                        {errors.senderPhone ? <p className="mt-1 text-sm text-destructive">{errors.senderPhone.message}</p> : null}
                      </div>
                    </div>

                    {/* Adres nadawcy — tylko dla kuriera */}
                    {!isPickup ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm">Miasto</label>
                          <select
                            {...register('senderCity', { required: !isPickup ? 'Wybierz miasto nadawcy.' : false })}
                            className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                          >
                            {CITIES.map((city) => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                          {errors.senderCity ? <p className="mt-1 text-sm text-destructive">{errors.senderCity.message}</p> : null}
                        </div>
                        <div>
                          <label className="mb-2 block text-sm">Ulica i numer</label>
                          <input
                            {...register('senderStreet', { required: !isPickup ? 'Podaj ulicę nadawcy.' : false })}
                            placeholder="np. Narutowicza 14"
                            className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                          />
                          {errors.senderStreet ? <p className="mt-1 text-sm text-destructive">{errors.senderStreet.message}</p> : null}
                        </div>
                      </div>
                    ) : (
                      /* Punkt nadania — dla PICKUP_POINT */
                      <div className="mt-4">
                        <label className="mb-2 block text-sm">Miejsce nadania — gdzie oddasz paczkę</label>
                        <select
                          {...register('sourcePointCode', { required: isPickup ? 'Wybierz punkt nadania.' : false })}
                          className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                        >
                          {points.map((point) => (
                            <option key={point.pointCode} value={point.pointCode}>
                              {point.name} — {point.city} ({point.pointCode})
                            </option>
                          ))}
                        </select>
                        {errors.sourcePointCode ? <p className="mt-1 text-sm text-destructive">{errors.sourcePointCode.message}</p> : null}
                      </div>
                    )}
                  </div>

                  {/* ── Odbiorca ── */}
                  <div>
                    <div className="mb-4 flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Odbiorca
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm">Imię i nazwisko</label>
                        <input
                          {...register('recipientName', { required: 'Podaj odbiorcę.' })}
                          className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                        />
                        {errors.recipientName ? <p className="mt-1 text-sm text-destructive">{errors.recipientName.message}</p> : null}
                      </div>
                      <div>
                        <label className="mb-2 block text-sm">Telefon</label>
                        <input
                          {...register('recipientPhone', {
                            required: 'Podaj telefon odbiorcy.',
                            pattern: { value: /^[+\d][\d\s\-()\d]{6,19}$/, message: 'Podaj poprawny numer telefonu.' },
                          })}
                          className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                        />
                        {errors.recipientPhone ? <p className="mt-1 text-sm text-destructive">{errors.recipientPhone.message}</p> : null}
                      </div>
                    </div>

                    {/* Adres odbiorcy — tylko dla kuriera */}
                    {!isPickup ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm">Miasto doręczenia</label>
                          <select
                            {...register('recipientCity', { required: !isPickup ? 'Wybierz miasto odbiorcy.' : false })}
                            className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                          >
                            {CITIES.map((city) => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                          {errors.recipientCity ? <p className="mt-1 text-sm text-destructive">{errors.recipientCity.message}</p> : null}
                        </div>
                        <div>
                          <label className="mb-2 block text-sm">Ulica i numer</label>
                          <input
                            {...register('recipientStreet', { required: !isPickup ? 'Podaj ulicę odbiorcy.' : false })}
                            placeholder="np. Marszałkowska 5"
                            className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                          />
                          {errors.recipientStreet ? <p className="mt-1 text-sm text-destructive">{errors.recipientStreet.message}</p> : null}
                        </div>
                      </div>
                    ) : (
                      /* Dla PICKUP_POINT — punkt odbioru wybierany w kroku 2 */
                      <div className="mt-4 rounded-lg bg-secondary px-4 py-3 text-sm text-muted-foreground">
                        Punkt odbioru wybierzesz w następnym kroku.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* ── STEP 2: dostawa i paczka ── */}
              {step === 2 ? (
                <div className="space-y-5">
                  <h3 className="text-xl">
                    {isPickup ? 'Punkt odbioru i paczka' : 'Paczka'}
                  </h3>

                  {isPickup ? (
                    <div>
                      <label className="mb-2 block text-sm">Miejsce odbioru — skąd odbiorca zabierze paczkę</label>
                      <select
                        {...register('targetPointCode', { required: 'Wybierz punkt odbioru.' })}
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                      >
                        {points.map((point) => (
                          <option key={point.pointCode} value={point.pointCode}>
                            {point.name} — {point.city} ({point.pointCode})
                          </option>
                        ))}
                      </select>
                      {errors.targetPointCode ? <p className="mt-1 text-sm text-destructive">{errors.targetPointCode.message}</p> : null}
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm">Waga (kg)</label>
                      <input
                        {...register('weight', {
                          required: 'Podaj wagę.',
                          valueAsNumber: true,
                          min: { value: 0.1, message: 'Minimalna waga to 0.1 kg.' },
                          max: { value: 50, message: 'Maksymalna waga to 50 kg.' },
                        })}
                        type="number"
                        step="0.1"
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                      />
                      {errors.weight ? <p className="mt-1 text-sm text-destructive">{errors.weight.message}</p> : null}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm">Gabaryt</label>
                      <select
                        {...register('sizeCategory', { required: 'Wybierz gabaryt.' })}
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                      >
                        <option value="S">S (do 1 kg)</option>
                        <option value="M">M (1–10 kg)</option>
                        <option value="L">L (10–50 kg)</option>
                      </select>
                      {errors.sizeCategory ? <p className="mt-1 text-sm text-destructive">{errors.sizeCategory.message}</p> : null}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm">Wartość deklarowana (PLN)</label>
                      <input
                        {...register('declaredValue', {
                          required: 'Podaj wartość.',
                          valueAsNumber: true,
                          min: { value: 0, message: 'Wartość nie może być ujemna.' },
                          max: { value: 100000, message: 'Maksymalna wartość to 100 000 PLN.' },
                        })}
                        type="number"
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                      />
                      {errors.declaredValue ? <p className="mt-1 text-sm text-destructive">{errors.declaredValue.message}</p> : null}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm">Zawartość</label>
                    <textarea
                      {...register('contents')}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-border bg-input-background px-4 py-2.5"
                    />
                  </div>

                  <label className="flex items-center gap-2">
                    <input {...register('fragile')} type="checkbox" className="h-4 w-4 rounded border-border" />
                    <span className="text-sm">Delikatna obsługa (+3,00 PLN)</span>
                  </label>
                </div>
              ) : null}

              {/* ── STEP 3: płatność ── */}
              {step === 3 ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl">Płatność</h3>
                    <p className="text-sm text-muted-foreground">
                      Wybierz kanał rozliczenia zgodny z typem dostawy.
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted">
                    <input {...register('paymentMethod', { required: 'Wybierz metodę płatności.' })} type="radio" value="ONLINE" className="mt-1" />
                    <CreditCard className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div>Płatność online</div>
                      <div className="text-sm text-muted-foreground">
                        Opłać przesyłkę od razu przez Stripe — bez dodatkowych kroków przy nadaniu.
                      </div>
                    </div>
                  </label>

                  {isPickup ? (
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted">
                      <input {...register('paymentMethod', { required: 'Wybierz metodę płatności.' })} type="radio" value="OFFLINE_AT_POINT" className="mt-1" />
                      <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <div>Płatność w punkcie nadania</div>
                        <div className="text-sm text-muted-foreground">
                          Opłacasz gotówką lub kartą przy oddaniu paczki w punkcie.
                        </div>
                      </div>
                    </label>
                  ) : null}

                  {!isPickup ? (
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted">
                      <input {...register('paymentMethod', { required: 'Wybierz metodę płatności.' })} type="radio" value="OFFLINE_AT_COURIER" className="mt-1" />
                      <Package className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <div>Płatność u kuriera</div>
                        <div className="text-sm text-muted-foreground">
                          Kurier pobierze opłatę przy doręczeniu — gotówką lub kartą.
                        </div>
                      </div>
                    </label>
                  ) : null}

                  {errors.paymentMethod ? <p className="text-sm text-destructive">{errors.paymentMethod.message}</p> : null}
                </div>
              ) : null}

              {/* ── STEP 4: potwierdzenie ── */}
              {step === 4 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                    <Check className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="mb-2 text-2xl">Przesyłka utworzona</h3>
                  <p className="mb-2 text-muted-foreground">Numer śledzenia: {createdTrackingNumber}</p>
                  <p className="mb-6 text-sm text-muted-foreground">
                    {paymentMethod === 'OFFLINE_AT_POINT'
                      ? 'Przynieś paczkę do wybranego punktu — operator potwierdzi opłatę przy przyjęciu.'
                      : paymentMethod === 'OFFLINE_AT_COURIER'
                        ? 'Kurier pobierze opłatę przy doręczeniu. Przesyłka jest gotowa do nadania.'
                        : 'Możesz teraz opłacić przesyłkę przez Stripe lub zrobić to później ze szczegółów przesyłki.'}
                  </p>
                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => createdTrackingNumber && navigate(`/client/shipments/${createdTrackingNumber}`)}
                      className="rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-accent/90"
                    >
                      Zobacz szczegóły
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/client/shipments')}
                      className="rounded-lg border border-border bg-card px-6 py-3 transition-colors hover:bg-muted"
                    >
                      Wróć do listy
                    </button>
                  </div>
                </div>
              ) : null}

              {submitError ? <div className="mt-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{submitError}</div> : null}

              <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                <button
                  type="button"
                  onClick={() => step > 1 && setStep(step - 1)}
                  disabled={step === 1 || step === 4}
                  className="rounded-lg border border-border px-6 py-2.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Wstecz
                </button>
                <button
                  type="button"
                  onClick={() => void handlePrimaryAction()}
                  disabled={step === 4 || isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Zapisywanie...' : step === 3 ? 'Utwórz przesyłkę' : 'Dalej'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Sidebar podsumowanie ── */}
          <div>
            <div className="sticky top-6 rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg">Podsumowanie</h3>

              <div className="mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Opłata bazowa</span>
                  <span>{priceSummary.base.toFixed(2)} PLN</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ubezpieczenie</span>
                  <span>{priceSummary.insurance.toFixed(2)} PLN</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Obsługa delikatna</span>
                  <span>{priceSummary.fragileFee ? `${priceSummary.fragileFee.toFixed(2)} PLN` : '—'}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span>Razem</span>
                  <span className="text-xl text-accent">{priceSummary.total} PLN</span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-secondary p-3">
                  <div className="mb-1 text-muted-foreground">Sposób nadania</div>
                  <div>{isPickup ? 'Punkt / paczkomat' : 'Kurier od domu'}</div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <div className="mb-1 text-muted-foreground">Kanał płatności</div>
                  <div>
                    {paymentMethod === 'ONLINE'
                      ? 'Online (Stripe)'
                      : paymentMethod === 'OFFLINE_AT_POINT'
                        ? 'W punkcie nadania'
                        : 'U kuriera'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
