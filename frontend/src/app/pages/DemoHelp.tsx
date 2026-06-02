import { Building2, Package, ShieldCheck, Truck, User } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

interface ScenarioCard {
  title: string;
  startingRole: string;
  accountHint: string;
  nextScreen: string;
  statuses: string[];
  nextOwner: string;
  steps: string[];
}

interface RoleGuide {
  title: string;
  description: string;
  routes: string[];
}

export function getDemoHelpContent(isEnglish: boolean): {
  introTitle: string;
  introBody: string;
  scenarios: ScenarioCard[];
  roles: RoleGuide[];
  glossary: Array<{ code: string; label: string }>;
} {
  return {
    introTitle: isEnglish ? 'Demo flow mental model' : 'Model myslenia dla demo',
    introBody: isEnglish
      ? 'Think about every parcel as moving through source -> transit -> target. After the client creates and pays, the parcel is moved operationally by the point, then by hub/transit, and finally by courier or target pickup point.'
      : 'Mysl o kazdej przesylce jako o ruchu source -> transit -> target. Po utworzeniu i oplaceniu klient juz nie przesuwa przesylki dalej: robi to najpierw punkt, potem hub/tranzyt, a na koncu kurier albo docelowy punkt odbioru.',
    scenarios: [
      {
        title: isEnglish ? 'Client creates, point sends, courier delivers' : 'Klient tworzy, punkt nadaje, kurier dorecza',
        startingRole: isEnglish ? 'Start as Client' : 'Start jako Klient',
        accountHint: isEnglish ? 'Use any active client account, create and pay a courier shipment.' : 'Uzyj aktywnego konta klienta, utworz i oplac przesylke kurierska.',
        nextScreen: '/point/accept -> /admin/demo/transit -> /admin/shipments -> /courier/tasks',
        statuses: ['READY_FOR_HANDOVER', 'ACCEPTED_AT_SOURCE', 'POSTED', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED'],
        nextOwner: isEnglish ? 'Next owner after payment: Source point' : 'Nastepny owner po platnosci: Punkt nadania',
        steps: isEnglish
          ? [
              'Client creates and pays.',
              'Point accepts the parcel in /point/accept and posts it onward.',
              'Transit or hub accepts the parcel in /admin/demo/transit.',
              'Admin or dispatcher assigns a courier in /admin/shipments.',
              'Courier accepts, starts, and completes the task in /courier/tasks.',
            ]
          : [
              'Klient tworzy przesylke i oplaca ja.',
              'Punkt przyjmuje przesylke w /point/accept i nadaje ja dalej.',
              'Tranzyt lub hub przyjmuje przesylke w /admin/demo/transit.',
              'Admin lub dyspozytor przypisuje kuriera w /admin/shipments.',
              'Kurier akceptuje, startuje i domyka zadanie w /courier/tasks.',
            ],
      },
      {
        title: isEnglish ? 'Client creates pickup-point shipment' : 'Klient tworzy przesylke do punktu odbioru',
        startingRole: isEnglish ? 'Start as Client' : 'Start jako Klient',
        accountHint: isEnglish ? 'Use a client account and choose pickup-point delivery.' : 'Uzyj konta klienta i wybierz odbior w punkcie.',
        nextScreen: '/point/accept -> /admin/demo/transit -> /admin/shipments -> /point/release',
        statuses: ['READY_FOR_HANDOVER', 'ACCEPTED_AT_SOURCE', 'POSTED', 'IN_TRANSIT_TO_TARGET_POINT', 'AWAITING_PICKUP', 'DELIVERED'],
        nextOwner: isEnglish ? 'Next owner after destination hub: Target point' : 'Nastepny owner po hubie docelowym: Punkt odbioru',
        steps: isEnglish
          ? [
              'Client creates and pays a pickup-point shipment.',
              'Source point accepts and posts it onward.',
              'Hub accepts it in transit.',
              'Admin routes it to the pickup point instead of assigning a courier.',
              'Point accepts it for pickup and releases it to the recipient.',
            ]
          : [
              'Klient tworzy i oplaca przesylke do punktu odbioru.',
              'Punkt nadania przyjmuje ja i nadaje dalej.',
              'Hub przyjmuje ja w tranzycie.',
              'Admin kieruje ja do punktu odbioru zamiast przypisywac kuriera.',
              'Punkt przyjmuje ja do wydania i wydaje odbiorcy.',
            ],
      },
      {
        title: isEnglish ? 'Walk-in shipment at point' : 'Walk-in na punkcie',
        startingRole: isEnglish ? 'Start as Point' : 'Start jako Punkt',
        accountHint: isEnglish ? 'Use a point operator account and open /point/walk-in.' : 'Uzyj konta operatora punktu i wejdz w /point/walk-in.',
        nextScreen: '/point/walk-in -> /point/accept -> /admin/demo/transit',
        statuses: ['READY_FOR_HANDOVER', 'ACCEPTED_AT_SOURCE', 'POSTED'],
        nextOwner: isEnglish ? 'Next owner after walk-in creation: Same source point' : 'Nastepny owner po utworzeniu walk-in: Ten sam punkt',
        steps: isEnglish
          ? [
              'Point creates a shipment for an existing or new client.',
              'After success, move directly into the point intake/post flow.',
              'From there the parcel follows the same source -> transit -> target path.',
            ]
          : [
              'Punkt tworzy przesylke dla istniejacego albo nowego klienta.',
              'Po sukcesie przejdz od razu do flow przyjecia i nadania dalej.',
              'Od tego miejsca przesylka idzie juz standardowo source -> transit -> target.',
            ],
      },
      {
        title: isEnglish ? 'Courier failed attempt -> redirect to pickup point' : 'Nieudana proba kuriera -> przekierowanie do punktu',
        startingRole: isEnglish ? 'Start as Courier' : 'Start jako Kurier',
        accountHint: isEnglish ? 'Use a courier account with an active final-mile task.' : 'Uzyj konta kuriera z aktywnym zadaniem final-mile.',
        nextScreen: '/courier/tasks -> /admin/shipments -> /point/accept -> /point/release',
        statuses: ['OUT_FOR_DELIVERY', 'RETURN_IN_TRANSIT', 'IN_TRANSIT_TO_TARGET_POINT', 'AWAITING_PICKUP', 'DELIVERED'],
        nextOwner: isEnglish ? 'Next owner after failed attempt: Admin / hub, then target point' : 'Nastepny owner po nieudanej probie: Admin / hub, potem punkt odbioru',
        steps: isEnglish
          ? [
              'Courier records a failed attempt and chooses redirect to pickup point.',
              'Admin routes the parcel back toward the target point.',
              'Point accepts the redirected parcel and releases it to the recipient.',
            ]
          : [
              'Kurier zapisuje nieudana probe i wybiera przekierowanie do punktu.',
              'Admin kieruje przesylke z powrotem do punktu odbioru.',
              'Punkt przyjmuje przekierowana przesylke i wydaje ja odbiorcy.',
            ],
      },
    ],
    roles: [
      {
        title: isEnglish ? 'Client' : 'Klient',
        description: isEnglish
          ? 'Creates shipments, pays, prints labels, tracks progress, and may request redirect or complaint.'
          : 'Tworzy przesylki, placi, drukuje etykiety, sledzi postep i moze zlozyc przekierowanie lub reklamacje.',
        routes: ['/client', '/client/shipments', '/client/shipments/create'],
      },
      {
        title: isEnglish ? 'Point' : 'Punkt',
        description: isEnglish
          ? 'Accepts source parcels, posts them into the network, handles walk-in creation, and releases pickup parcels.'
          : 'Przyjmuje przesylki u zrodla, nadaje je dalej do sieci, obsluguje walk-in i wydaje przesylki do odbioru.',
        routes: ['/point/accept', '/point/release', '/point/walk-in'],
      },
      {
        title: isEnglish ? 'Admin / Transit' : 'Admin / Tranzyt',
        description: isEnglish
          ? 'Simulates hub movement, assigns couriers, and routes parcels to pickup points.'
          : 'Symuluje ruch przez hub, przypisuje kurierow i kieruje przesylki do punktow odbioru.',
        routes: ['/admin/demo/transit', '/admin/shipments', '/admin/demo-lab'],
      },
      {
        title: isEnglish ? 'Courier' : 'Kurier',
        description: isEnglish
          ? 'Accepts tasks, starts delivery routes, completes delivery, or records failed attempts.'
          : 'Akceptuje zadania, startuje trase, dorecza przesylke albo zapisuje nieudana probe.',
        routes: ['/courier/tasks', '/courier'],
      },
    ],
    glossary: [
      { code: 'READY_FOR_HANDOVER', label: isEnglish ? 'Paid and waiting for first physical handover.' : 'Oplacona i czeka na pierwsze fizyczne przyjecie.' },
      { code: 'ACCEPTED_AT_SOURCE', label: isEnglish ? 'Source point already has the parcel.' : 'Punkt nadania juz fizycznie ma przesylke.' },
      { code: 'POSTED', label: isEnglish ? 'Posted onward from the source into the network.' : 'Nadana dalej z punktu do sieci.' },
      { code: 'AWAITING_PICKUP', label: isEnglish ? 'Ready to be released at the target point.' : 'Gotowa do wydania w punkcie odbioru.' },
      { code: 'DELIVERED', label: isEnglish ? 'Final delivery or pickup completed.' : 'Finalne doreczenie lub odbior zakonczony.' },
    ],
  };
}

export default function DemoHelp() {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const content = getDemoHelpContent(isEnglish);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-[0.25em] text-accent">{isEnglish ? 'Demo guide' : 'Przewodnik demo'}</div>
            <h1 className="mt-3 text-4xl">{content.introTitle}</h1>
            <p className="mt-3 max-w-4xl text-muted-foreground">{content.introBody}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/login-demo" className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90">
              {isEnglish ? 'Open login-demo' : 'Otworz login-demo'}
            </Link>
            <Link to="/login" className="rounded-lg border border-border px-4 py-2 transition-colors hover:bg-muted">
              {isEnglish ? 'Classic login' : 'Klasyczne logowanie'}
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {content.scenarios.map((scenario) => (
            <section key={scenario.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl">{scenario.title}</h2>
                  <div className="text-sm text-muted-foreground">{scenario.startingRole}</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="rounded-xl bg-secondary p-4">
                  <div className="font-medium">{isEnglish ? 'Account hint' : 'Jakie konto wybrac'}</div>
                  <div className="mt-1 text-muted-foreground">{scenario.accountHint}</div>
                </div>
                <div className="rounded-xl bg-secondary p-4">
                  <div className="font-medium">{isEnglish ? 'Where to go next' : 'Gdzie klikac dalej'}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">{scenario.nextScreen}</div>
                </div>
                <div className="rounded-xl bg-secondary p-4">
                  <div className="font-medium">{isEnglish ? 'Who owns the next move' : 'Kto robi nastepny ruch'}</div>
                  <div className="mt-1 text-muted-foreground">{scenario.nextOwner}</div>
                </div>

                <div>
                  <div className="mb-2 font-medium">{isEnglish ? 'Status path' : 'Sciezka statusow'}</div>
                  <div className="flex flex-wrap gap-2">
                    {scenario.statuses.map((status) => (
                      <span key={status} className="rounded-full border border-border px-3 py-1 font-mono text-xs">
                        {status}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 font-medium">{isEnglish ? 'Steps' : 'Kroki'}</div>
                  <ol className="space-y-2 text-muted-foreground">
                    {scenario.steps.map((step, index) => (
                      <li key={step} className="flex gap-3">
                        <span className="text-accent">{index + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <h2 className="text-2xl">{isEnglish ? 'Role map' : 'Mapa rol'}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {content.roles.map((role) => {
                const icon =
                  role.title === 'Klient' || role.title === 'Client'
                    ? User
                    : role.title === 'Punkt' || role.title === 'Point'
                      ? Building2
                      : role.title === 'Kurier' || role.title === 'Courier'
                        ? Truck
                        : ShieldCheck;
                const Icon = icon;
                return (
                  <div key={role.title} className="rounded-xl bg-secondary p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent" />
                      <div className="font-medium">{role.title}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{role.description}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {role.routes.map((route) => (
                        <span key={route} className="rounded-full border border-border px-3 py-1 font-mono text-xs">
                          {route}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Package className="h-5 w-5 text-accent" />
              <h2 className="text-2xl">{isEnglish ? 'Quick glossary' : 'Szybki slowniczek'}</h2>
            </div>

            <div className="space-y-3">
              {content.glossary.map((item) => (
                <div key={item.code} className="rounded-xl bg-secondary p-4">
                  <div className="font-mono text-xs text-accent">{item.code}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
