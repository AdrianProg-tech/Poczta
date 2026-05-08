import { useEffect, useState } from 'react';
import { formatPointType, getPublicPoints, type PublicPoint } from '../api';
import { DashboardShell } from '../components/DashboardShell';

export default function AdminPoints() {
  const [points, setPoints] = useState<PublicPoint[]>([]);

  useEffect(() => {
    let active = true;

    async function loadPoints() {
      try {
        const data = await getPublicPoints();
        if (active) {
          setPoints(data);
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
  }, []);

  return (
    <DashboardShell role="admin" title="Punkty odbioru">
      <div className="grid gap-4">
        {points.map((point) => (
          <div key={point.pointCode} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-1 text-lg">{point.name}</div>
                <div className="text-sm text-muted-foreground">
                  {point.pointCode} • {point.city}, {point.address}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatPointType(point.type)} • {point.openingHours}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
