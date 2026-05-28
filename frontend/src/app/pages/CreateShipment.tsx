import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
  intakeMethod: 'POINT_DROPOFF' | 'COURIER_PICKUP';
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
  intakeMethod: 'POINT_DROPOFF' | 'COURIER_PICKUP',
  deliveryType: 'COURIER' | 'PICKUP_POINT',
): Array<keyof CreateShipmentFormValues> {
  if (step === 1) {
    if (intakeMethod === 'POINT_DROPOFF' && deliveryType === 'PICKUP_POINT') {
      return ['intakeMethod', 'deliveryType', 'senderName', 'senderPhone', 'sourcePointCode', 'recipientName', 'recipientPhone'];
    }
    if (intakeMethod === 'POINT_DROPOFF') {
      return ['intakeMethod', 'deliveryType', 'senderName', 'senderPhone', 'sourcePointCode', 'recipientName', 'recipientPhone', 'recipientCity', 'recipientStreet'];
    }
    if (deliveryType === 'PICKUP_POINT') {
      return ['intakeMethod', 'deliveryType', 'senderName', 'senderPhone', 'senderCity', 'senderStreet', 'recipientName', 'recipientPhone'];
    }
    return ['intakeMethod', 'deliveryType', 'senderName', 'senderPhone', 'senderCity', 'senderStreet', 'recipientName', 'recipientPhone', 'recipientCity', 'recipientStreet'];
  }
  if (step === 2) {
    const base: Array<keyof CreateShipmentFormValues> = ['weight', 'sizeCategory', 'declaredValue'];
    return deliveryType === 'PICKUP_POINT' ? ['targetPointCode', ...base] : base;
  }
  return ['paymentMethod'];
}

export default function CreateShipment() {
  const { t } = useTranslation();
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
      intakeMethod: 'POINT_DROPOFF',
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
        const pickupPoints = activePoints.filter((point) => point.type === 'PICKUP_POINT');
        const preferredPoint =
          pickupPoints.find((point) => point.pointCode === 'POP-WAW-01')
          ?? pickupPoints.find((point) => point.city.toLowerCase() === 'warszawa')
          ?? pickupPoints[0];
        if (preferredPoint) {
          setValue('targetPointCode', preferredPoint.pointCode);
          setValue('sourcePointCode', preferredPoint.pointCode);
        }
      } catch {
        if (active) setPoints([]);
      }
    }

    void loadPoints();
    return () => { active = false; };
  }, [setValue]);

  const deliveryType = watch('deliveryType');
  const intakeMethod = watch('intakeMethod');
  const paymentMethod = watch('paymentMethod');
  const declaredValue = watch('declaredValue');
  const fragile = watch('fragile');
  const pickupPoints = useMemo(
    () =>
      [...points]
        .filter((point) => point.type === 'PICKUP_POINT')
        .sort((left, right) => {
          const score = (point: PublicPoint) => {
            if (point.pointCode === 'POP-WAW-01') return 0;
            if (point.city.toLowerCase() === 'warszawa') return 1;
            return 2;
          };
          return score(left) - score(right) || left.city.localeCompare(right.city) || left.pointCode.localeCompare(right.pointCode);
        }),
    [points],
  );

  useEffect(() => {
    if (deliveryType === 'PICKUP_POINT' && paymentMethod === 'OFFLINE_AT_COURIER') {
      setValue('paymentMethod', 'ONLINE');
    }
    if (intakeMethod !== 'POINT_DROPOFF' && paymentMethod === 'OFFLINE_AT_POINT') {
      setValue('paymentMethod', 'ONLINE');
    }
  }, [deliveryType, intakeMethod, paymentMethod, setValue]);

  const priceSummary = useMemo(() => {
    const base = 19.99;
    const insurance = declaredValue > 0 ? 5 : 0;
    const fragileFee = fragile ? 3 : 0;
    return { base, insurance, fragileFee, total: calculateShipmentPrice(declaredValue, fragile).toFixed(2) };
  }, [declaredValue, fragile]);

  const finishShipment = handleSubmit(async (values) => {
    if (!currentUser?.email) {
      setSubmitError(t('createShipment.errors.noSession'));
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const sourcePoint = pickupPoints.find((p) => p.pointCode === values.sourcePointCode);
    const targetPoint = pickupPoints.find((p) => p.pointCode === values.targetPointCode);

    const senderAddress =
      values.intakeMethod === 'POINT_DROPOFF'
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
          intakeMethod: values.intakeMethod,
          deliveryMethod: values.deliveryType === 'PICKUP_POINT' ? 'PICKUP_POINT' : 'COURIER_HOME',
          sourcePointCode: values.intakeMethod === 'POINT_DROPOFF' ? values.sourcePointCode || undefined : undefined,
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
      setSubmitError(requestError instanceof Error ? requestError.message : t('createShipment.errors.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  });

  async function handlePrimaryAction() {
    if (step < 3) {
      const fieldsToValidate = getStepFields(step, intakeMethod, deliveryType);
      const isValid = await trigger(fieldsToValidate);
      if (isValid) setStep(step + 1);
      return;
    }
    const isValid = await trigger(getStepFields(3, intakeMethod, deliveryType));
    if (isValid) await finishShipment();
  }

  const isPickup = deliveryType === 'PICKUP_POINT';
  const isPointDropoff = intakeMethod === 'POINT_DROPOFF';

  return (
    <DashboardShell role="client" title={t('createShipment.title')}>
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
                    <h3 className="mb-4 text-xl">{t('createShipment.intakeMethod.label')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                          !isPointDropoff ? 'border-accent bg-accent/5' : 'border-border hover:bg-muted'
                        }`}
                      >
                        <input {...register('intakeMethod')} type="radio" value="COURIER_PICKUP" className="sr-only" />
                        <Truck className={`mb-2 h-5 w-5 ${!isPointDropoff ? 'text-accent' : 'text-muted-foreground'}`} />
                        <div className="font-medium">{t('createShipment.intakeMethod.courierPickup')}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {t('createShipment.intakeMethod.courierPickupDesc')}
                        </div>
                      </label>
                      <label
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                          isPointDropoff ? 'border-accent bg-accent/5' : 'border-border hover:bg-muted'
                        }`}
                      >
                        <input {...register('intakeMethod')} type="radio" value="POINT_DROPOFF" className="sr-only" />
                        <MapPin className={`mb-2 h-5 w-5 ${isPointDropoff ? 'text-accent' : 'text-muted-foreground'}`} />
                        <div className="font-medium">{t('createShipment.intakeMethod.pointDropoff')}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {t('createShipment.intakeMethod.pointDropoffDesc')}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-xl">{t('createShipment.deliveryType.label')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                          !isPickup ? 'border-accent bg-accent/5' : 'border-border hover:bg-muted'
                        }`}
                      >
                        <input {...register('deliveryType')} type="radio" value="COURIER" className="sr-only" />
                        <Truck className={`mb-2 h-5 w-5 ${!isPickup ? 'text-accent' : 'text-muted-foreground'}`} />
                        <div className="font-medium">{t('createShipment.deliveryType.courier')}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {t('createShipment.deliveryType.courierDesc')}
                        </div>
                      </label>
                      <label
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                          isPickup ? 'border-accent bg-accent/5' : 'border-border hover:bg-muted'
                        }`}
                      >
                        <input {...register('deliveryType')} type="radio" value="PICKUP_POINT" className="sr-only" />
                        <MapPin className={`mb-2 h-5 w-5 ${isPickup ? 'text-accent' : 'text-muted-foreground'}`} />
                        <div className="font-medium">{t('createShipment.deliveryType.pickupPoint')}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {t('createShipment.deliveryType.pickupPointDesc')}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* ── Nadawca ── */}
                  <div>
                    <div className="mb-4 flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      {t('createShipment.sender.label')}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm">{t('createShipment.sender.name')}</label>
                        <input
                          {...register('senderName', { required: t('createShipment.sender.nameRequired') })}
                          className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                        />
                        {errors.senderName ? <p className="mt-1 text-sm text-destructive">{errors.senderName.message}</p> : null}
                      </div>
                      <div>
                        <label className="mb-2 block text-sm">{t('createShipment.sender.phone')}</label>
                        <input
                          {...register('senderPhone', {
                            required: t('createShipment.sender.phoneRequired'),
                            pattern: { value: /^[+\d][\d\s\-()\d]{6,19}$/, message: t('createShipment.sender.phoneInvalid') },
                          })}
                          className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                        />
                        {errors.senderPhone ? <p className="mt-1 text-sm text-destructive">{errors.senderPhone.message}</p> : null}
                      </div>
                    </div>

                    {!isPointDropoff ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm">{t('createShipment.sender.city')}</label>
                          <select
                            {...register('senderCity', { required: !isPointDropoff ? t('createShipment.sender.cityRequired') : false })}
                            className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                          >
                            {CITIES.map((city) => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                          {errors.senderCity ? <p className="mt-1 text-sm text-destructive">{errors.senderCity.message}</p> : null}
                        </div>
                        <div>
                          <label className="mb-2 block text-sm">{t('createShipment.sender.street')}</label>
                          <input
                            {...register('senderStreet', { required: !isPointDropoff ? t('createShipment.sender.streetRequired') : false })}
                            placeholder="np. Narutowicza 14"
                            className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                          />
                          {errors.senderStreet ? <p className="mt-1 text-sm text-destructive">{errors.senderStreet.message}</p> : null}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <label className="mb-2 block text-sm">{t('createShipment.sender.dropoffPoint')}</label>
                        <select
                          {...register('sourcePointCode', { required: isPointDropoff ? t('createShipment.sender.pointRequired') : false })}
                          className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                        >
                          {pickupPoints.map((point) => (
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
                      {t('createShipment.recipient.label')}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm">{t('createShipment.recipient.name')}</label>
                        <input
                          {...register('recipientName', { required: t('createShipment.recipient.nameRequired') })}
                          className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                        />
                        {errors.recipientName ? <p className="mt-1 text-sm text-destructive">{errors.recipientName.message}</p> : null}
                      </div>
                      <div>
                        <label className="mb-2 block text-sm">{t('createShipment.recipient.phone')}</label>
                        <input
                          {...register('recipientPhone', {
                            required: t('createShipment.recipient.phoneRequired'),
                            pattern: { value: /^[+\d][\d\s\-()\d]{6,19}$/, message: t('createShipment.recipient.phoneInvalid') },
                          })}
                          className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                        />
                        {errors.recipientPhone ? <p className="mt-1 text-sm text-destructive">{errors.recipientPhone.message}</p> : null}
                      </div>
                    </div>

                    {!isPickup ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm">{t('createShipment.recipient.city')}</label>
                          <select
                            {...register('recipientCity', { required: !isPickup ? t('createShipment.recipient.cityRequired') : false })}
                            className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                          >
                            {CITIES.map((city) => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                          {errors.recipientCity ? <p className="mt-1 text-sm text-destructive">{errors.recipientCity.message}</p> : null}
                        </div>
                        <div>
                          <label className="mb-2 block text-sm">{t('createShipment.recipient.street')}</label>
                          <input
                            {...register('recipientStreet', { required: !isPickup ? t('createShipment.recipient.streetRequired') : false })}
                            placeholder="np. Marszałkowska 5"
                            className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                          />
                          {errors.recipientStreet ? <p className="mt-1 text-sm text-destructive">{errors.recipientStreet.message}</p> : null}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-lg bg-secondary px-4 py-3 text-sm text-muted-foreground">
                        {t('createShipment.recipient.pickupPointNote')}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* ── STEP 2: dostawa i paczka ── */}
              {step === 2 ? (
                <div className="space-y-5">
                  <h3 className="text-xl">
                    {isPickup ? t('createShipment.parcel.titleWithPoint') : t('createShipment.parcel.title')}
                  </h3>

                  {isPickup ? (
                    <div>
                      <label className="mb-2 block text-sm">{t('createShipment.parcel.pickupPoint')}</label>
                      <select
                        {...register('targetPointCode', { required: t('createShipment.parcel.pickupPointRequired') })}
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                      >
                        {pickupPoints.map((point) => (
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
                      <label className="mb-2 block text-sm">{t('createShipment.parcel.weight')}</label>
                      <input
                        {...register('weight', {
                          required: t('createShipment.parcel.weightRequired'),
                          valueAsNumber: true,
                          min: { value: 0.1, message: t('createShipment.parcel.weightMin') },
                          max: { value: 50, message: t('createShipment.parcel.weightMax') },
                        })}
                        type="number"
                        step="0.1"
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                      />
                      {errors.weight ? <p className="mt-1 text-sm text-destructive">{errors.weight.message}</p> : null}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm">{t('createShipment.parcel.size')}</label>
                      <select
                        {...register('sizeCategory', { required: t('createShipment.parcel.sizeRequired') })}
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                      >
                        <option value="S">{t('createShipment.parcel.sizeS')}</option>
                        <option value="M">{t('createShipment.parcel.sizeM')}</option>
                        <option value="L">{t('createShipment.parcel.sizeL')}</option>
                      </select>
                      {errors.sizeCategory ? <p className="mt-1 text-sm text-destructive">{errors.sizeCategory.message}</p> : null}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm">{t('createShipment.parcel.declaredValue')}</label>
                      <input
                        {...register('declaredValue', {
                          required: t('createShipment.parcel.declaredValueRequired'),
                          valueAsNumber: true,
                          min: { value: 0, message: t('createShipment.parcel.declaredValueMin') },
                          max: { value: 100000, message: t('createShipment.parcel.declaredValueMax') },
                        })}
                        type="number"
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5"
                      />
                      {errors.declaredValue ? <p className="mt-1 text-sm text-destructive">{errors.declaredValue.message}</p> : null}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm">{t('createShipment.parcel.contents')}</label>
                    <textarea
                      {...register('contents')}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-border bg-input-background px-4 py-2.5"
                    />
                  </div>

                  <label className="flex items-center gap-2">
                    <input {...register('fragile')} type="checkbox" className="h-4 w-4 rounded border-border" />
                    <span className="text-sm">{t('createShipment.parcel.fragile')}</span>
                  </label>
                </div>
              ) : null}

              {/* ── STEP 3: płatność ── */}
              {step === 3 ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl">{t('createShipment.payment.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('createShipment.payment.subtitle')}
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted">
                    <input {...register('paymentMethod', { required: t('createShipment.payment.required') })} type="radio" value="ONLINE" className="mt-1" />
                    <CreditCard className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div>{t('createShipment.payment.online')}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('createShipment.payment.onlineDesc')}
                      </div>
                    </div>
                  </label>

                  {isPointDropoff ? (
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted">
                      <input {...register('paymentMethod', { required: t('createShipment.payment.required') })} type="radio" value="OFFLINE_AT_POINT" className="mt-1" />
                      <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <div>{t('createShipment.payment.atPoint')}</div>
                        <div className="text-sm text-muted-foreground">
                          {t('createShipment.payment.atPointDesc')}
                        </div>
                      </div>
                    </label>
                  ) : null}

                  {!isPickup ? (
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted">
                      <input {...register('paymentMethod', { required: t('createShipment.payment.required') })} type="radio" value="OFFLINE_AT_COURIER" className="mt-1" />
                      <Package className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <div>{t('createShipment.payment.atCourier')}</div>
                        <div className="text-sm text-muted-foreground">
                          {t('createShipment.payment.atCourierDesc')}
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
                  <h3 className="mb-2 text-2xl">{t('createShipment.confirm.title')}</h3>
                  <p className="mb-2 text-muted-foreground">
                    {t('createShipment.confirm.trackingNumber', { number: createdTrackingNumber })}
                  </p>
                  <p className="mb-6 text-sm text-muted-foreground">
                    {paymentMethod === 'OFFLINE_AT_POINT'
                      ? t('createShipment.confirm.noteAtPoint')
                      : paymentMethod === 'OFFLINE_AT_COURIER'
                        ? t('createShipment.confirm.noteAtCourier')
                        : t('createShipment.confirm.noteOnline')}
                  </p>
                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => createdTrackingNumber && navigate(`/client/shipments/${createdTrackingNumber}`)}
                      className="rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-accent/90"
                    >
                      {t('createShipment.confirm.viewDetails')}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/client/shipments')}
                      className="rounded-lg border border-border bg-card px-6 py-3 transition-colors hover:bg-muted"
                    >
                      {t('createShipment.confirm.backToList')}
                    </button>
                  </div>
                </div>
              ) : null}

              {submitError ? <div className="mt-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{submitError}</div> : null}

              {step < 4 ? (
                <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                  <button
                    type="button"
                    onClick={() => step > 1 && setStep(step - 1)}
                    disabled={step === 1 || step === 4}
                    className="rounded-lg border border-border px-6 py-2.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('createShipment.nav.back')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePrimaryAction()}
                    disabled={step === 4 || isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? t('createShipment.nav.saving') : step === 3 ? t('createShipment.nav.create') : t('createShipment.nav.next')}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Sidebar podsumowanie ── */}
          <div>
            <div className="sticky top-6 rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg">{t('createShipment.summary.title')}</h3>

              <div className="mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('createShipment.summary.baseFee')}</span>
                  <span>{priceSummary.base.toFixed(2)} PLN</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('createShipment.summary.insurance')}</span>
                  <span>{priceSummary.insurance.toFixed(2)} PLN</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('createShipment.summary.fragileHandling')}</span>
                  <span>{priceSummary.fragileFee ? `${priceSummary.fragileFee.toFixed(2)} PLN` : '—'}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span>{t('createShipment.summary.total')}</span>
                  <span className="text-xl text-accent">{priceSummary.total} PLN</span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-secondary p-3">
                  <div className="mb-1 text-muted-foreground">{t('createShipment.summary.intakeMethod')}</div>
                  <div>{isPointDropoff ? t('createShipment.summary.pointDropoff') : t('createShipment.summary.courierPickup')}</div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <div className="mb-1 text-muted-foreground">{t('createShipment.summary.deliveryMethod')}</div>
                  <div>{isPickup ? t('createShipment.summary.pickupPoint') : t('createShipment.summary.courierDelivery')}</div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <div className="mb-1 text-muted-foreground">{t('createShipment.summary.paymentChannel')}</div>
                  <div>
                    {paymentMethod === 'ONLINE'
                      ? t('createShipment.summary.paymentOnline')
                      : paymentMethod === 'OFFLINE_AT_POINT'
                        ? t('createShipment.summary.paymentAtPoint')
                        : t('createShipment.summary.paymentAtCourier')}
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
