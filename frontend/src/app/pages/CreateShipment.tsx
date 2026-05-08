import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { ArrowRight, Check, CreditCard, MapPin, Package, User } from 'lucide-react';
import { createClientShipment, getPublicPoints, type PublicPoint } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

interface CreateShipmentFormValues {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  deliveryType: 'COURIER' | 'PICKUP_POINT';
  targetPointCode: string;
  weight: number;
  sizeCategory: 'S' | 'M' | 'L';
  declaredValue: number;
  contents: string;
  fragile: boolean;
  paymentMethod: 'ONLINE' | 'OFFLINE_AT_POINT';
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
      senderName: currentUser?.name ?? 'Jan Kowalski',
      senderPhone: '+48 500 100 102',
      senderAddress: 'Lodz, Narutowicza 14',
      recipientName: '',
      recipientPhone: '',
      recipientAddress: '',
      deliveryType: 'COURIER',
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
        if (active) {
          setPoints(data.filter((point) => point.active));
          if (data[0]) {
            setValue('targetPointCode', data[0].pointCode);
          }
        }
      } catch {
        if (active) {
          setPoints([]);
        }
      }
    }

    void loadPoints();

    return () => {
      active = false;
    };
  }, [setValue]);

  const deliveryType = watch('deliveryType');
  const declaredValue = watch('declaredValue');
  const fragile = watch('fragile');

  const priceSummary = useMemo(() => {
    const base = 19.99;
    const insurance = declaredValue > 0 ? 5 : 0;
    const fragileFee = fragile ? 3 : 0;
    return {
      base,
      insurance,
      fragileFee,
      total: (base + insurance + fragileFee).toFixed(2),
    };
  }, [declaredValue, fragile]);

  const stepFields: Record<number, Array<keyof CreateShipmentFormValues>> = {
    1: ['senderName', 'senderPhone', 'senderAddress', 'recipientName', 'recipientPhone', 'recipientAddress'],
    2: ['deliveryType', 'targetPointCode', 'weight', 'sizeCategory', 'declaredValue'],
    3: ['paymentMethod'],
  };

  const finishShipment = handleSubmit(async (values) => {
    if (!currentUser?.email) {
      setSubmitError('Brak aktywnej sesji klienta.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await createClientShipment(currentUser.email, {
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
        payment: {
          method: values.paymentMethod,
        },
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
      const fields = stepFields[step];
      const isValid = await trigger(
        deliveryType === 'PICKUP_POINT' && step === 2 ? fields : fields.filter((field) => field !== 'targetPointCode'),
      );
      if (isValid) {
        setStep(step + 1);
      }
      return;
    }

    const isValid = await trigger(stepFields[3]);
    if (isValid) {
      await finishShipment();
    }
  }

  return (
    <DashboardShell role="client" title="Nowa przesyłka">
      <div className="mx-auto max-w-5xl">
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
              {step === 1 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-6 text-xl">Dane adresowe</h3>
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
                          {...register('senderPhone', { required: 'Podaj telefon nadawcy.' })}
                          className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                        />
                        {errors.senderPhone ? <p className="mt-1 text-sm text-destructive">{errors.senderPhone.message}</p> : null}
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="mb-2 block text-sm">Adres</label>
                      <input
                        {...register('senderAddress', { required: 'Podaj adres nadawcy.' })}
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                      />
                      {errors.senderAddress ? <p className="mt-1 text-sm text-destructive">{errors.senderAddress.message}</p> : null}
                    </div>
                  </div>

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
                          {...register('recipientPhone', { required: 'Podaj telefon odbiorcy.' })}
                          className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                        />
                        {errors.recipientPhone ? <p className="mt-1 text-sm text-destructive">{errors.recipientPhone.message}</p> : null}
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="mb-2 block text-sm">Adres doręczenia</label>
                      <input
                        {...register('recipientAddress', { required: 'Podaj adres odbiorcy.' })}
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                      />
                      {errors.recipientAddress ? (
                        <p className="mt-1 text-sm text-destructive">{errors.recipientAddress.message}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <h3 className="text-xl">Dostawa i paczka</h3>

                  <div>
                    <label className="mb-2 block text-sm">Typ dostawy</label>
                    <select
                      {...register('deliveryType', { required: 'Wybierz typ dostawy.' })}
                      className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                    >
                      <option value="COURIER">Kurier</option>
                      <option value="PICKUP_POINT">Punkt odbioru</option>
                    </select>
                  </div>

                  {deliveryType === 'PICKUP_POINT' ? (
                    <div>
                      <label className="mb-2 block text-sm">Punkt docelowy</label>
                      <select
                        {...register('targetPointCode', { required: 'Wybierz punkt docelowy.' })}
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                      >
                        {points.map((point) => (
                          <option key={point.pointCode} value={point.pointCode}>
                            {point.name} ({point.pointCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm">Waga (kg)</label>
                      <input
                        {...register('weight', { required: 'Podaj wagę.', valueAsNumber: true, min: 0.1 })}
                        type="number"
                        step="0.1"
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm">Gabaryt</label>
                      <select
                        {...register('sizeCategory', { required: 'Wybierz gabaryt.' })}
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                      >
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm">Wartość (PLN)</label>
                      <input
                        {...register('declaredValue', { required: 'Podaj wartość.', valueAsNumber: true, min: 1 })}
                        type="number"
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                      />
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
                    <span className="text-sm">Delikatna obsługa</span>
                  </label>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <h3 className="text-xl">Płatność</h3>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 hover:bg-muted">
                    <input {...register('paymentMethod', { required: 'Wybierz metodę płatności.' })} type="radio" value="ONLINE" />
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span>Płatność online</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 hover:bg-muted">
                    <input
                      {...register('paymentMethod', { required: 'Wybierz metodę płatności.' })}
                      type="radio"
                      value="OFFLINE_AT_POINT"
                    />
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span>Płatność w punkcie</span>
                  </label>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                    <Check className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="mb-2 text-2xl">Przesyłka utworzona</h3>
                  <p className="mb-6 text-muted-foreground">Tracking number: {createdTrackingNumber}</p>
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
                  <span>{priceSummary.fragileFee ? `${priceSummary.fragileFee.toFixed(2)} PLN` : '-'}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span>Razem</span>
                  <span className="text-xl text-accent">{priceSummary.total} PLN</span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-secondary p-3">
                  <div className="mb-1 text-muted-foreground">Docelowy kanał</div>
                  <div>{deliveryType === 'COURIER' ? 'Doręczenie kurierskie' : 'Odbiór w punkcie'}</div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <div className="mb-1 text-muted-foreground">API contract</div>
                  <div>POST /api/client/shipments</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
