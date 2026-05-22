import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, CheckSquare, CreditCard, MapPin, RefreshCw, RotateCcw, Truck } from 'lucide-react';
import {
  acceptCourierTask,
  completeCourierTask,
  formatDate,
  formatDateTime,
  getCourierTaskDetails,
  getPublicPoints,
  getPublicTracking,
  recordCourierAttempt,
  startCourierTask,
  type CourierTaskDetails as CourierTaskDetailsRecord,
  type PublicPoint,
  type PublicTrackingResponse,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

export default function CourierTaskDetails() {
  const { id } = useParams();
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [task, setTask] = useState<CourierTaskDetailsRecord | null>(null);
  const [points, setPoints] = useState<PublicPoint[]>([]);
  const [tracking, setTracking] = useState<PublicTrackingResponse | null>(null);
  const [redirectPointCode, setRedirectPointCode] = useState('');
  const [collectionMethod, setCollectionMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTask = useCallback(async () => {
    if (!currentUser?.email || !id) {
      setTask(null);
      setTracking(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [taskData, pointsData] = await Promise.all([getCourierTaskDetails(currentUser.email, id), getPublicPoints()]);
      const trackingData = await getPublicTracking(taskData.trackingNumber);
      const pickupPoint = pointsData.find((point) => point.type === 'PICKUP_POINT') ?? pointsData[0];

      setTask(taskData);
      setPoints(pointsData);
      setTracking(trackingData);
      setRedirectPointCode((current) => current || pickupPoint?.pointCode || '');
      setError(null);
    } catch (requestError) {
      setTask(null);
      setTracking(null);
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie pobrac szczegolow zadania.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email, id]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  useEffect(() => {
    if (task?.paymentCollectionMethod === 'CARD' || task?.paymentCollectionMethod === 'CASH') {
      setCollectionMethod(task.paymentCollectionMethod);
    } else if (task?.requiresPaymentCollection) {
      setCollectionMethod('CASH');
    }
  }, [task?.paymentCollectionMethod, task?.requiresPaymentCollection]);

  async function runTaskAction(actionKey: string, action: () => Promise<unknown>) {
    setBusyAction(actionKey);
    setError(null);
    try {
      await action();
      await loadTask();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Operacja nie powiodla sie.');
    } finally {
      setBusyAction(null);
    }
  }

  const pickupPoints = useMemo(() => points.filter((point) => point.type === 'PICKUP_POINT'), [points]);
  const timelineItems = useMemo(
    () => (tracking?.history?.length ? tracking.history : task?.history ?? []),
    [task?.history, tracking?.history],
  );
  const actionPlan = useMemo(() => {
    if (!task) {
      return null;
    }

    if (task.taskStatus === 'ASSIGNED') {
      return {
        title: 'Nastepny krok: przyjmij zadanie',
        description: 'Dispatcher przypisal task, ale kurier nie potwierdzil jeszcze przejecia odpowiedzialnosci za trase.',
        bullets: ['Przyjmij zadanie.', 'Po akceptacji rozpocznij trase, gdy jestes gotowy do wyjazdu.'],
      };
    }

    if (task.taskStatus === 'ACCEPTED') {
      return {
        title: 'Nastepny krok: rozpocznij trase',
        description: 'Task jest juz po stronie kuriera i czeka na wyjazd w route flow.',
        bullets: ['Rozpocznij trase.', 'Po starcie shipment przejdzie do live delivery flow.'],
      };
    }

    if (task.taskStatus === 'IN_PROGRESS') {
      if (task.requiresPaymentCollection) {
        return {
          title: 'Masz aktywna dostawe z pobraniem',
          description: 'Przed domknieciem tasku kurier musi zebrac platnosc i wskazac, czy byla gotowka czy karta.',
          bullets: ['Wybierz cash albo card.', 'Dopiero potem zamknij dostawe sukcesem.'],
        };
      }
      return {
        title: 'Masz aktywna dostawe',
        description: 'Na tym etapie kurier powinien zamknac dostawe sukcesem albo zapisac nieudana probe z redirectem.',
        bullets: ['Dorecz przesylke, jesli odbiorca jest dostepny.', 'Jesli nie, zapisz probe i wskaz punkt odbioru.'],
      };
    }

    if (task.taskStatus === 'FAILED') {
      return {
        title: 'Task zakonczony niepowodzeniem',
        description: 'Kurierska proba zostala zapisana. Dalszy krok odbywa sie juz w pickup/point flow.',
        bullets: ['Sprawdz tracking, jesli chcesz potwierdzic redirect.', 'Punkt odbioru przejmuje kolejny handoff.'],
      };
    }

    return {
      title: 'Task zakonczony',
      description: 'To zadanie nie wymaga juz akcji kuriera.',
      bullets: ['Mozesz przejsc do kolejnego tasku z listy.', 'Tracking zostal juz domkniety po stronie operacyjnej.'],
    };
  }, [task]);

  return (
    <DashboardShell role="courier" title="Szczegoly zadania">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3">
            <Link to="/courier/tasks" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Wroc do listy zadan
            </Link>
          </div>
          <h2 className="mb-2 text-2xl">Szczegoly zadania kuriera</h2>
          <p className="text-muted-foreground">
            Widok laczy task, dane odbiorcy i tracking, zeby kurier nie musial skladac flow z kilku ekranow.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadTask()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Odswiez task
        </button>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}
      {isLoading ? <div className="rounded-xl border border-border bg-card p-6 shadow-sm">Ladowanie zadania...</div> : null}

      {!isLoading && !task ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-muted-foreground">
          Nie znaleziono zadania dla wskazanego identyfikatora.
        </div>
      ) : null}

      {!isLoading && task ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr),360px]">
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl">{task.trackingNumber}</h3>
                    <StatusBadge status={task.shipmentStatus ?? task.taskStatus} />
                    <StatusBadge status={task.taskStatus} />
                  </div>
                  <p className="text-sm text-muted-foreground">Task ID: {task.taskId}</p>
                </div>
                <div className="rounded-lg bg-secondary px-4 py-2 text-sm">{task.taskType}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">Odbiorca</div>
                  <div>{task.recipientName}</div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">Telefon</div>
                  <div>{task.recipientPhone}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="mb-1 text-sm text-muted-foreground">Adres docelowy</div>
                  <div>{task.targetAddress}</div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">Planowana data</div>
                  <div>{formatDate(task.plannedDate)}</div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">Aktualny status shipmentu</div>
                  <div>{task.shipmentStatus ?? 'Brak danych'}</div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">Platnosc</div>
                  <div>
                    {task.paymentMethod ?? 'Brak'} {task.paymentStatus ? `| ${task.paymentStatus}` : ''}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">Pobranie przy odbiorze</div>
                  <div>{task.requiresPaymentCollection ? 'Tak, kurier musi zamknac checkout' : 'Nie'}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg">Historia trackingowa</h3>
              {timelineItems.length ? (
                <div className="space-y-6">
                  {timelineItems.map((item, index) => (
                    <div key={`${item.eventTime}-${item.status}-${index}`} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-accent' : 'bg-muted'}`} />
                        {index !== timelineItems.length - 1 ? <div className="mt-2 h-full w-0.5 bg-border" /> : null}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="mb-1 flex items-center gap-3">
                          <StatusBadge status={item.status} />
                          <span className="text-sm text-muted-foreground">{formatDateTime(item.eventTime)}</span>
                        </div>
                        <div className="mb-1">{item.description}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {item.locationName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">Brak historii trackingowej dla tej przesylki.</div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              {actionPlan ? (
                <div className="mb-5 rounded-xl bg-secondary p-4">
                  <div className="mb-1 text-sm text-muted-foreground">Suggested next step</div>
                  <div className="text-lg">{actionPlan.title}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{actionPlan.description}</p>
                  <div className="mt-3 space-y-2 text-sm">
                    {actionPlan.bullets.map((bullet) => (
                      <div key={bullet}>{bullet}</div>
                    ))}
                  </div>
                </div>
              ) : null}

              <h3 className="mb-4 text-lg">Akcje kuriera</h3>
              <div className="space-y-3">
                {task.taskStatus === 'ASSIGNED' ? (
                  <button
                    type="button"
                    disabled={busyAction === 'accept' || !currentUser?.email}
                    onClick={() =>
                      currentUser?.email && runTaskAction('accept', () => acceptCourierTask(currentUser.email, task.taskId))
                    }
                    className="w-full rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                  >
                    Przyjmij zadanie
                  </button>
                ) : null}

                {(task.taskStatus === 'ASSIGNED' || task.taskStatus === 'ACCEPTED') ? (
                  <button
                    type="button"
                    disabled={busyAction === 'start' || !currentUser?.email}
                    onClick={() =>
                      currentUser?.email && runTaskAction('start', () => startCourierTask(currentUser.email, task.taskId))
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                  >
                    <Truck className="h-4 w-4" />
                    Rozpocznij trase
                  </button>
                ) : null}

                {task.taskStatus === 'IN_PROGRESS' ? (
                  <>
                    {task.requiresPaymentCollection ? (
                      <div className="space-y-3 rounded-lg border border-border p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CreditCard className="h-4 w-4" />
                          Checkout przy odbiorze
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="flex items-center gap-2 rounded-lg border border-border p-3">
                            <input
                              type="radio"
                              name="collectionMethod"
                              checked={collectionMethod === 'CASH'}
                              onChange={() => setCollectionMethod('CASH')}
                            />
                            <span>Gotowka</span>
                          </label>
                          <label className="flex items-center gap-2 rounded-lg border border-border p-3">
                            <input
                              type="radio"
                              name="collectionMethod"
                              checked={collectionMethod === 'CARD'}
                              onChange={() => setCollectionMethod('CARD')}
                            />
                            <span>Karta</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          disabled={busyAction === 'complete' || !currentUser?.email}
                          onClick={() =>
                            currentUser?.email &&
                            runTaskAction('complete', () =>
                              completeCourierTask(currentUser.email, task.taskId, {
                                note: 'Delivered from courier details UI',
                                collectPayment: true,
                                collectionMethod,
                              }),
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                        >
                          <CheckSquare className="h-4 w-4" />
                          Pobierz platnosc i dorecz
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={busyAction === 'complete' || !currentUser?.email}
                        onClick={() =>
                          currentUser?.email &&
                          runTaskAction('complete', () =>
                            completeCourierTask(currentUser.email, task.taskId, {
                              note: 'Delivered from courier details UI',
                            }),
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                      >
                        <CheckSquare className="h-4 w-4" />
                        Oznacz jako doreczona
                      </button>
                    )}

                    <div className="space-y-2 rounded-lg border border-border p-3">
                      <div className="text-sm text-muted-foreground">Redirect po nieudanej probie</div>
                      <select
                        value={redirectPointCode}
                        onChange={(event) => setRedirectPointCode(event.target.value)}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 outline-none"
                      >
                        {pickupPoints.map((point) => (
                          <option key={point.pointCode} value={point.pointCode}>
                            {point.pointCode} | {point.city}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busyAction === 'attempt' || !currentUser?.email || !redirectPointCode}
                        onClick={() =>
                          currentUser?.email &&
                          redirectPointCode &&
                          runTaskAction('attempt', () =>
                            recordCourierAttempt(currentUser.email, task.taskId, {
                              result: 'RECIPIENT_ABSENT',
                              note: 'Recipient unavailable during frontend demo',
                              redirectToPickup: true,
                              redirectPointCode,
                            }),
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Zapisz nieudana probe
                      </button>
                    </div>
                  </>
                ) : null}

                {task.taskStatus !== 'ASSIGNED' && task.taskStatus !== 'ACCEPTED' && task.taskStatus !== 'IN_PROGRESS' ? (
                  <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
                    To zadanie nie ma juz aktywnych akcji kuriera. Stan zostal zakonczony albo wymaga operacji po stronie dispatch.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg">Szybki kontekst</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Tracking</span>
                  <span>{tracking?.trackingNumber ?? task.trackingNumber}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Destination</span>
                  <span className="text-right">{tracking?.destinationSummary ?? task.targetAddress}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">ETA</span>
                  <span>{formatDate(tracking?.estimatedDeliveryDate ?? task.plannedDate)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Pickup points</span>
                  <span>{pickupPoints.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Historia eventow</span>
                  <span>{timelineItems.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Collection method</span>
                  <span>{task.paymentCollectionMethod ?? (task.requiresPaymentCollection ? 'Do wyboru przy doreczeniu' : 'Brak')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
