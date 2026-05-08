import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckSquare, RefreshCw, RotateCcw, Truck } from 'lucide-react';
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
  const [redirectPointByTaskId, setRedirectPointByTaskId] = useState<Record<string, string>>({});

  const loadTasks = useCallback(async () => {
    if (!currentUser?.id) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [taskData, pointsData] = await Promise.all([getCourierTasks(currentUser.id), getPublicPoints()]);
      setTasks(taskData);
      setPoints(pointsData);
      setError(null);
      setRedirectPointByTaskId((current) => {
        const pickupPoint = pointsData.find((point) => point.type === 'PICKUP_POINT') ?? pointsData[0];
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
  }, [currentUser?.id]);

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

  const pickupPoints = useMemo(() => points.filter((point) => point.type === 'PICKUP_POINT'), [points]);
  const filteredTasks = useMemo(
    () => tasks.filter((task) => filter === 'ALL' || task.taskStatus === filter),
    [filter, tasks],
  );
  const summary = useMemo(
    () => [
      { label: 'Assigned', value: tasks.filter((task) => task.taskStatus === 'ASSIGNED').length },
      { label: 'Accepted', value: tasks.filter((task) => task.taskStatus === 'ACCEPTED').length },
      { label: 'In progress', value: tasks.filter((task) => task.taskStatus === 'IN_PROGRESS').length },
      { label: 'Closed', value: tasks.filter((task) => ['FAILED', 'COMPLETED'].includes(task.taskStatus)).length },
    ],
    [tasks],
  );

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
                    <div className="text-lg">{task.trackingNumber}</div>
                    <StatusBadge status={task.shipmentStatus ?? task.taskStatus} />
                    <StatusBadge status={task.taskStatus} />
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
                  </div>
                </div>

                <div className="space-y-3 lg:w-72">
                  {task.taskStatus === 'ASSIGNED' ? (
                    <button
                      type="button"
                      disabled={isBusy || !currentUser?.id}
                      onClick={() => currentUser?.id && runTaskAction(task.taskId, () => acceptCourierTask(currentUser.id!, task.taskId))}
                      className="w-full rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                    >
                      Przyjmij zadanie
                    </button>
                  ) : null}

                  {(task.taskStatus === 'ASSIGNED' || task.taskStatus === 'ACCEPTED') ? (
                    <button
                      type="button"
                      disabled={isBusy || !currentUser?.id}
                      onClick={() => currentUser?.id && runTaskAction(task.taskId, () => startCourierTask(currentUser.id!, task.taskId))}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                    >
                      <Truck className="h-4 w-4" />
                      Rozpocznij trase
                    </button>
                  ) : null}

                  {task.taskStatus === 'IN_PROGRESS' ? (
                    <>
                      <button
                        type="button"
                        disabled={isBusy || !currentUser?.id}
                        onClick={() =>
                          currentUser?.id && runTaskAction(task.taskId, () => completeCourierTask(currentUser.id!, task.taskId, 'Delivered from courier UI'))
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                      >
                        <CheckSquare className="h-4 w-4" />
                        Oznacz jako doreczona
                      </button>

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
                          disabled={isBusy || !currentUser?.id || !redirectPoint}
                          onClick={() =>
                            currentUser?.id &&
                            redirectPoint &&
                            runTaskAction(task.taskId, () =>
                              recordCourierAttempt(currentUser.id!, task.taskId, {
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
