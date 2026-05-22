import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CheckSquare, RefreshCw, RotateCcw, ScanSearch, Truck } from 'lucide-react';
import {
  acceptCourierTask,
  completeCourierTask,
  formatDate,
  getCourierTasks,
  getPublicPoints,
  recordCourierAttempt,
  startCourierTask,
  type CourierTaskListItem,
  type PublicPoint,
} from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

type TaskFilter = 'ALL' | 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'FAILED' | 'COMPLETED';

function getCourierTaskNextStep(taskStatus: string, requiresPaymentCollection: boolean) {
  if (taskStatus === 'ASSIGNED') {
    return 'Przyjmij task, zeby dispatcher widzial, ze kurier przejal trase.';
  }
  if (taskStatus === 'ACCEPTED') {
    return 'Rozpocznij trase, gdy wyjazd jest faktycznie gotowy.';
  }
  if (taskStatus === 'IN_PROGRESS') {
    if (requiresPaymentCollection) {
      return 'Przed domknieciem dostawy kurier musi pobrac platnosc gotowka albo karta.';
    }
    return 'Domknij dostawe sukcesem albo zapisz nieudana probe z redirectem.';
  }
  if (taskStatus === 'FAILED') {
    return 'Task jest po probie nieudanej. Dalszy handoff przejmuje punkt lub ops.';
  }
  return 'Task jest zakonczony i nie wymaga juz akcji kuriera.';
}

export default function CourierTasks() {
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [tasks, setTasks] = useState<CourierTaskListItem[]>([]);
  const [points, setPoints] = useState<PublicPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>('ALL');
  const [query, setQuery] = useState('');
  const [redirectPointByTaskId, setRedirectPointByTaskId] = useState<Record<string, string>>({});
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [batchRedirectPointCode, setBatchRedirectPointCode] = useState('');

  const loadTasks = useCallback(async () => {
    if (!currentUser?.email) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [taskData, pointsData] = await Promise.all([getCourierTasks(currentUser.email), getPublicPoints()]);
      setTasks(taskData);
      setPoints(pointsData);
      setError(null);
      setRedirectPointByTaskId((current) => {
        const pickupPoint = pointsData.find((point) => point.type === 'PICKUP_POINT') ?? pointsData[0];
        if (pickupPoint) {
          setBatchRedirectPointCode((currentValue) => currentValue || pickupPoint.pointCode);
        }
        if (!pickupPoint) {
          return current;
        }

        const next = { ...current };
        taskData.forEach((task) => {
          if (!next[task.taskId]) {
            next[task.taskId] = pickupPoint.pointCode;
          }
        });
        return next;
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie pobrac zadan kuriera.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  async function runTaskAction(taskId: string, action: () => Promise<unknown>) {
    setBusyTaskId(taskId);
    setError(null);
    try {
      await action();
      await loadTasks();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Operacja nie powiodla sie.');
    } finally {
      setBusyTaskId(null);
    }
  }

  async function runBatchTaskAction(actionKey: string, actions: Array<() => Promise<unknown>>) {
    if (actions.length === 0) {
      return false;
    }

    setBusyTaskId(actionKey);
    setError(null);
    try {
      for (const action of actions) {
        await action();
      }
      await loadTasks();
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Operacja masowa nie powiodla sie.');
      return false;
    } finally {
      setBusyTaskId(null);
    }
  }

  const pickupPoints = useMemo(() => points.filter((point) => point.type === 'PICKUP_POINT'), [points]);
  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesFilter = filter === 'ALL' || task.taskStatus === filter;
      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [task.trackingNumber, task.recipientName, task.recipientPhone, task.targetAddress, task.taskStatus]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [filter, query, tasks]);
  const summary = useMemo(
    () => [
      { label: 'Assigned', value: tasks.filter((task) => task.taskStatus === 'ASSIGNED').length },
      { label: 'Accepted', value: tasks.filter((task) => task.taskStatus === 'ACCEPTED').length },
      { label: 'In progress', value: tasks.filter((task) => task.taskStatus === 'IN_PROGRESS').length },
      { label: 'Closed', value: tasks.filter((task) => ['FAILED', 'COMPLETED'].includes(task.taskStatus)).length },
    ],
    [tasks],
  );
  const selectedTasks = useMemo(() => filteredTasks.filter((task) => selectedTaskIds.has(task.taskId)), [filteredTasks, selectedTaskIds]);
  const selectableTasks = useMemo(
    () => filteredTasks.filter((task) => ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(task.taskStatus)),
    [filteredTasks],
  );
  const batchAcceptableTasks = useMemo(
    () => selectedTasks.filter((task) => task.taskStatus === 'ASSIGNED'),
    [selectedTasks],
  );
  const batchStartableTasks = useMemo(
    () => selectedTasks.filter((task) => task.taskStatus === 'ASSIGNED' || task.taskStatus === 'ACCEPTED'),
    [selectedTasks],
  );
  const batchCompletableTasks = useMemo(
    () => selectedTasks.filter((task) => task.taskStatus === 'IN_PROGRESS' && !task.requiresPaymentCollection),
    [selectedTasks],
  );
  const selectedTasksNeedingPaymentCollection = useMemo(
    () => selectedTasks.filter((task) => task.requiresPaymentCollection),
    [selectedTasks],
  );

  useEffect(() => {
    const visibleIds = new Set(filteredTasks.map((task) => task.taskId));
    setSelectedTaskIds((current) => new Set([...current].filter((taskId) => visibleIds.has(taskId))));
  }, [filteredTasks]);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleAllVisibleTasks = () => {
    setSelectedTaskIds((current) =>
      current.size === selectableTasks.length ? new Set() : new Set(selectableTasks.map((task) => task.taskId)),
    );
  };

  return (
    <DashboardShell role="courier" title="Zadania kuriera">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="mb-2 text-2xl">Aktywne zadania</h2>
          <p className="text-muted-foreground">
            Kazda akcja ponizej wywoluje prawdziwy endpoint kuriera i odswieza live stan zadania.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadTasks()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Odswiez taski
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="text-sm text-muted-foreground">{item.label}</div>
            <div className="mt-2 text-3xl">{isLoading ? '...' : item.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['ALL', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'FAILED', 'COMPLETED'] as TaskFilter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              filter === value ? 'border-accent bg-accent text-white' : 'border-border bg-card hover:bg-muted'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <label className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <ScanSearch className="h-4 w-4" />
          Numer / odbiorca / telefon / adres
        </label>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Wpisz tracking, nazwisko odbiorcy albo fragment adresu"
          className="w-full rounded-lg border border-border bg-input-background px-4 py-3 outline-none transition-colors focus:border-accent"
        />
      </div>

      <div className="mb-6 rounded-xl border border-dashed border-border bg-secondary/60 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm">
              Wybrano <span className="font-medium">{selectedTasks.length}</span> z{' '}
              <span className="font-medium">{selectableTasks.length}</span> aktywnych taskow w aktualnym widoku.
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Batch mode dziala na aktualnym filtrze i pomija taski zamkniete (`FAILED`, `COMPLETED`).
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div>Do przyjecia: {batchAcceptableTasks.length}</div>
              <div>Do startu: {batchStartableTasks.length}</div>
              <div>Do domkniecia: {batchCompletableTasks.length}</div>
            </div>
            {selectedTasksNeedingPaymentCollection.length > 0 ? (
              <div className="mt-2 text-sm text-warning">
                {selectedTasksNeedingPaymentCollection.length} zaznaczonych taskow wymaga checkoutu gotowka/karta w szczegolach zadania.
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleAllVisibleTasks}
              disabled={selectableTasks.length === 0 || busyTaskId !== null}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-70"
            >
              {selectedTaskIds.size === selectableTasks.length ? 'Odznacz widoczne' : `Zaznacz widoczne (${selectableTasks.length})`}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTaskIds(new Set())}
              disabled={selectedTasks.length === 0 || busyTaskId !== null}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-70"
            >
              Wyczysc wybor
            </button>
            <button
              type="button"
              disabled={batchAcceptableTasks.length === 0 || busyTaskId !== null || !currentUser?.email}
              onClick={() => {
                if (!currentUser?.email || batchAcceptableTasks.length === 0) {
                  return;
                }

                void (async () => {
                  const success = await runBatchTaskAction(
                    'batch-accept',
                    batchAcceptableTasks.map((task) => () => acceptCourierTask(currentUser.email!, task.taskId)),
                  );
                  if (success) {
                    setSelectedTaskIds(new Set());
                  }
                })();
              }}
              className="rounded-lg bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
            >
              Przyjmij zaznaczone
            </button>
            <button
              type="button"
              disabled={batchStartableTasks.length === 0 || busyTaskId !== null || !currentUser?.email}
              onClick={() => {
                if (!currentUser?.email || batchStartableTasks.length === 0) {
                  return;
                }

                void (async () => {
                  const success = await runBatchTaskAction(
                    'batch-start',
                    batchStartableTasks.map((task) => () => startCourierTask(currentUser.email!, task.taskId)),
                  );
                  if (success) {
                    setSelectedTaskIds(new Set());
                  }
                })();
              }}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-70"
            >
              Rozpocznij zaznaczone
            </button>
            <button
              type="button"
              disabled={batchCompletableTasks.length === 0 || busyTaskId !== null || !currentUser?.email}
              onClick={() => {
                if (!currentUser?.email || batchCompletableTasks.length === 0) {
                  return;
                }

                void (async () => {
                  const success = await runBatchTaskAction(
                    'batch-complete',
                    batchCompletableTasks.map((task) => () =>
                      completeCourierTask(currentUser.email!, task.taskId, {
                        note: 'Delivered from courier batch UI',
                      }),
                    ),
                  );
                  if (success) {
                    setSelectedTaskIds(new Set());
                  }
                })();
              }}
              className="rounded-lg bg-success px-4 py-2 text-sm text-white transition-colors hover:bg-success/90 disabled:opacity-70"
            >
              Dorecz zaznaczone
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:items-center">
          <label className="text-sm text-muted-foreground">Pickup point dla batch redirectu</label>
          <select
            value={batchRedirectPointCode}
            onChange={(event) => setBatchRedirectPointCode(event.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none"
          >
            {pickupPoints.map((point) => (
              <option key={point.pointCode} value={point.pointCode}>
                {point.pointCode} | {point.city}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={batchCompletableTasks.length === 0 || busyTaskId !== null || !currentUser?.email || !batchRedirectPointCode}
            onClick={() => {
              if (!currentUser?.email || batchCompletableTasks.length === 0 || !batchRedirectPointCode) {
                return;
              }

              void (async () => {
                const success = await runBatchTaskAction(
                  'batch-attempt',
                  batchCompletableTasks.map((task) => () =>
                    recordCourierAttempt(currentUser.email!, task.taskId, {
                      result: 'RECIPIENT_ABSENT',
                      note: 'Recipient unavailable during courier batch UI',
                      redirectToPickup: true,
                      redirectPointCode: batchRedirectPointCode,
                    }),
                  ),
                );
                if (success) {
                  setSelectedTaskIds(new Set());
                }
              })();
            }}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-70"
          >
            Zapisz probe + redirect dla zaznaczonych
          </button>
        </div>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}

      {isLoading ? <div className="rounded-xl border border-border bg-card p-6 shadow-sm">Ladowanie zadan...</div> : null}

      {!isLoading && filteredTasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-muted-foreground">
          Brak taskow dla wybranego filtra.
        </div>
      ) : null}

      <div className="grid gap-4">
        {filteredTasks.map((task) => {
          const isBusy = busyTaskId === task.taskId;
          const redirectPoint = redirectPointByTaskId[task.taskId] ?? pickupPoints[0]?.pointCode;

          return (
            <div key={task.taskId} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.has(task.taskId)}
                      disabled={!['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(task.taskStatus)}
                      onChange={() => toggleTaskSelection(task.taskId)}
                      className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                      aria-label={`Zaznacz task ${task.trackingNumber}`}
                    />
                    <div className="text-lg">{task.trackingNumber}</div>
                    <StatusBadge status={task.shipmentStatus ?? task.taskStatus} />
                    <StatusBadge status={task.taskStatus} />
                  </div>
                  <div className="mb-3">
                    <Link
                      to={`/courier/tasks/${task.taskId}`}
                      className="text-sm text-accent transition-colors hover:text-accent/80"
                    >
                      Otworz szczegoly tasku
                    </Link>
                  </div>
                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <div className="mb-1 text-muted-foreground">Odbiorca</div>
                      <div>{task.recipientName}</div>
                      <div className="text-muted-foreground">{task.recipientPhone}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-muted-foreground">Adres docelowy</div>
                      <div>{task.targetAddress}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-muted-foreground">Task type</div>
                      <div>{task.taskType}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-muted-foreground">Planowana data</div>
                      <div>{formatDate(task.plannedDate)}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-muted-foreground">Platnosc</div>
                      <div>
                        {task.paymentMethod ?? 'Brak'} {task.paymentStatus ? `| ${task.paymentStatus}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-muted-foreground">Pobranie</div>
                      <div>{task.requiresPaymentCollection ? 'Kuriera czeka checkout przy odbiorze' : 'Brak checkoutu przy doreczeniu'}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      to={`/courier/tasks/${task.taskId}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
                    >
                      Szczegoly tasku
                    </Link>
                  </div>
                </div>

                <div className="space-y-3 lg:w-72">
                  <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
                    <div className="mb-2 text-foreground">Nastepny krok</div>
                    <div>{getCourierTaskNextStep(task.taskStatus, task.requiresPaymentCollection)}</div>
                  </div>

                  {task.taskStatus === 'ASSIGNED' ? (
                    <button
                      type="button"
                      disabled={isBusy || !currentUser?.email}
                      onClick={() =>
                        currentUser?.email && runTaskAction(task.taskId, () => acceptCourierTask(currentUser.email!, task.taskId))
                      }
                      className="w-full rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                    >
                      Przyjmij zadanie
                    </button>
                  ) : null}

                  {(task.taskStatus === 'ASSIGNED' || task.taskStatus === 'ACCEPTED') ? (
                    <button
                      type="button"
                      disabled={isBusy || !currentUser?.email}
                      onClick={() =>
                        currentUser?.email && runTaskAction(task.taskId, () => startCourierTask(currentUser.email!, task.taskId))
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
                        <Link
                          to={`/courier/tasks/${task.taskId}`}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90"
                        >
                          <CheckSquare className="h-4 w-4" />
                          Pobierz platnosc i dorecz
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy || !currentUser?.email}
                          onClick={() =>
                            currentUser?.email &&
                            runTaskAction(task.taskId, () =>
                              completeCourierTask(currentUser.email!, task.taskId, {
                                note: 'Delivered from courier UI',
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
                          value={redirectPoint ?? ''}
                          onChange={(event) =>
                            setRedirectPointByTaskId((current) => ({
                              ...current,
                              [task.taskId]: event.target.value,
                            }))
                          }
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
                          disabled={isBusy || !currentUser?.email || !redirectPoint}
                          onClick={() =>
                            currentUser?.email &&
                            redirectPoint &&
                            runTaskAction(task.taskId, () =>
                              recordCourierAttempt(currentUser.email!, task.taskId, {
                                result: 'RECIPIENT_ABSENT',
                                note: 'Recipient unavailable during frontend demo',
                                redirectToPickup: true,
                                redirectPointCode: redirectPoint,
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
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
