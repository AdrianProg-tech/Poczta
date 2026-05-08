import { DashboardShell } from '../components/DashboardShell';

export default function AdminUsers() {
  return (
    <DashboardShell role="admin" title="Użytkownicy">
      <div className="max-w-3xl rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-3 text-xl">Katalog użytkowników</h2>
        <p className="mb-4 text-muted-foreground">
          Ten ekran nie używa już mocków, ale backend nadal nie wystawia osobnego read-modelu `admin/users`.
        </p>
        <p className="text-muted-foreground">
          Na dziś role operacyjne są widoczne pośrednio w innych ekranach:
          kurierzy w `Courier Dispatch`, klienci przy płatnościach i reklamacjach, a punkt wybieramy po `pointCode`.
          Gdy dodamy dedykowany endpoint katalogu użytkowników, tę stronę podepniemy bez zmiany architektury frontu.
        </p>
      </div>
    </DashboardShell>
  );
}
