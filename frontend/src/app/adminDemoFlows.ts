import type { AdminParcelRecord, CreateAdminParcelPayload } from './api';

export interface DemoStoryStageMeta {
  lane: 'WAREHOUSE' | 'LINEHAUL' | 'FINAL_MILE' | 'PICKUP' | 'EXCEPTION' | 'DONE';
  title: string;
  owner: string;
  nextOwner: string;
  summary: string;
  checkpoint: string;
}

export const technicalTransitions: Record<string, Array<CreateAdminParcelPayload['status']>> = {
  CREATED: ['PAID', 'CANCELED'],
  PAID: ['READY_FOR_POSTING', 'AWAITING_PICKUP', 'CANCELED'],
  READY_FOR_POSTING: ['POSTED', 'CANCELED'],
  POSTED: ['IN_TRANSIT', 'RETURNED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'REDIRECTED_TO_PICKUP', 'AWAITING_PICKUP', 'RETURNED'],
  OUT_FOR_DELIVERY: ['DELIVERY_ATTEMPT', 'DELIVERED', 'RETURNED'],
  DELIVERY_ATTEMPT: ['OUT_FOR_DELIVERY', 'REDIRECTED_TO_PICKUP', 'AWAITING_PICKUP', 'RETURNED'],
  REDIRECTED_TO_PICKUP: ['AWAITING_PICKUP', 'RETURNED'],
  AWAITING_PICKUP: ['DELIVERED', 'RETURNED'],
};

export const transitionMeta: Record<CreateAdminParcelPayload['status'], { label: string; locationName: string; description: string }> = {
  REGISTERED: { label: 'Zarejestrowana', locationName: 'Przyjecie demo', description: 'Techniczne zarejestrowanie przesylki do scenariusza demo.' },
  CREATED: { label: 'Utworzona', locationName: 'Przyjecie demo', description: 'Technicznie utworzona przesylka do celow demonstracyjnych.' },
  PAID: { label: 'Oznacz jako oplacona', locationName: 'Platnosc demo', description: 'Techniczne potwierdzenie platnosci dla scenariusza demo.' },
  READY_FOR_POSTING: {
    label: 'Przygotuj do wysylki',
    locationName: 'Magazyn demo',
    description: 'Przesylka jest gotowa do przekazania dalej w kolejnym kroku operacyjnym.',
  },
  POSTED: {
    label: 'Nadaj z punktu lub magazynu',
    locationName: 'Rampa wyjazdowa demo',
    description: 'Przesylka zostala nadana z technicznego punktu przekazania.',
  },
  IN_TRANSIT: {
    label: 'Przenies do tranzytu',
    locationName: 'Tranzyt miedzyhubowy',
    description: 'Przesylka jedzie pomiedzy magazynami w technicznym scenariuszu demo.',
  },
  OUT_FOR_DELIVERY: {
    label: 'Przekaz kurierowi',
    locationName: 'Trasa kuriera',
    description: 'Przesylka zostala wypuszczona do doreczenia.',
  },
  DELIVERY_ATTEMPT: {
    label: 'Zapisz nieudana probe',
    locationName: 'Proba doreczenia',
    description: 'Kurier probowal doreczyc przesylke, ale odbiorcy nie bylo na miejscu.',
  },
  REDIRECTED_TO_PICKUP: {
    label: 'Przekieruj do odbioru',
    locationName: 'Obsluga przekierowania',
    description: 'Przesylka zostala przekierowana z doreczenia kurierskiego do odbioru w punkcie.',
  },
  AWAITING_PICKUP: {
    label: 'Przekaz do odbioru',
    locationName: 'Gotowa do odbioru',
    description: 'Przesylka czeka teraz na odbiorce w technicznym scenariuszu odbioru.',
  },
  DELIVERED: {
    label: 'Zakoncz doreczenie',
    locationName: 'Doreczona',
    description: 'Przesylka zostala poprawnie wydana odbiorcy.',
  },
  RETURNED: {
    label: 'Zwrot do nadawcy',
    locationName: 'Obsluga zwrotu',
    description: 'Przesylka opuscila aktywny flow i trafila do procesu zwrotnego.',
  },
  CANCELED: {
    label: 'Anuluj przesylke',
    locationName: 'Anulowana',
    description: 'Przesylka zostala anulowana w technicznym scenariuszu operacyjnym.',
  },
};

export const scenarioTemplates: Array<{
  id: string;
  label: string;
  description: string;
  payload: Omit<CreateAdminParcelPayload, 'trackingNumber'>;
}> = [
  {
    id: 'courier-ready',
    label: 'Przesylka gotowa dla kuriera',
    description: 'Przesylka kurierska w stanie READY_FOR_POSTING, gotowa do dalszej symulacji.',
    payload: {
      status: 'READY_FOR_POSTING',
      deliveryType: 'COURIER',
      senderName: 'Demo Sender Warsaw',
      senderPhone: '+48111000111',
      recipientName: 'Demo Courier Recipient',
      recipientPhone: '+48222000222',
      weight: 2.4,
      sizeCategory: 'M',
    },
  },
  {
    id: 'linehaul-transit',
    label: 'Przesylka w tranzycie',
    description: 'Przesylka w stanie IN_TRANSIT do pokazania ruchu miedzy magazynami.',
    payload: {
      status: 'IN_TRANSIT',
      deliveryType: 'COURIER',
      senderName: 'Demo Sender Gdansk',
      senderPhone: '+48333000333',
      recipientName: 'Demo Transit Recipient',
      recipientPhone: '+48444000444',
      weight: 4.1,
      sizeCategory: 'L',
    },
  },
  {
    id: 'delivery-attempt',
    label: 'Nieudana proba doreczenia',
    description: 'Przesylka w stanie DELIVERY_ATTEMPT do pokazania wyjatku, ponowienia albo przekierowania.',
    payload: {
      status: 'DELIVERY_ATTEMPT',
      deliveryType: 'COURIER',
      senderName: 'Demo Sender Wroclaw',
      senderPhone: '+48999000999',
      recipientName: 'Demo Attempt Recipient',
      recipientPhone: '+48123000123',
      weight: 3.5,
      sizeCategory: 'M',
    },
  },
  {
    id: 'redirect-pickup',
    label: 'Przekierowanie do odbioru',
    description: 'Przesylka w stanie REDIRECTED_TO_PICKUP do dalszego flow punktu lub skrytki.',
    payload: {
      status: 'REDIRECTED_TO_PICKUP',
      deliveryType: 'PICKUP_POINT',
      senderName: 'Demo Sender Poznan',
      senderPhone: '+48555000555',
      recipientName: 'Demo Redirect Recipient',
      recipientPhone: '+48666000666',
      weight: 1.1,
      sizeCategory: 'S',
    },
  },
  {
    id: 'return-flow',
    label: 'Zwrot do nadawcy',
    description: 'Przesylka w stanie RETURNED do pokazania scenariusza wyjatku i zwrotu.',
    payload: {
      status: 'RETURNED',
      deliveryType: 'COURIER',
      senderName: 'Demo Sender Szczecin',
      senderPhone: '+48101000101',
      recipientName: 'Demo Return Recipient',
      recipientPhone: '+48202000202',
      weight: 2.2,
      sizeCategory: 'M',
    },
  },
  {
    id: 'locker-waiting',
    label: 'Skrytka czeka na odbior',
    description: 'Przesylka w stanie AWAITING_PICKUP do pokazania odbioru ze skrytki.',
    payload: {
      status: 'AWAITING_PICKUP',
      deliveryType: 'PICKUP_POINT',
      senderName: 'Demo Sender Krakow',
      senderPhone: '+48777000777',
      recipientName: 'Demo Locker Recipient',
      recipientPhone: '+48888000888',
      weight: 0.8,
      sizeCategory: 'S',
    },
  },
];

export function createTechnicalTrackingNumber(prefix: string) {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function buildScenarioPayload(template: (typeof scenarioTemplates)[number]['payload']): CreateAdminParcelPayload {
  return {
    trackingNumber: createTechnicalTrackingNumber('DM'),
    ...template,
  };
}

export function sortParcelsByCreatedAt(parcels: AdminParcelRecord[]) {
  return [...parcels].sort((left, right) => (right.createdAt ?? '').localeCompare(left.createdAt ?? ''));
}

export function getTransitDemoParcels(parcels: AdminParcelRecord[]) {
  return sortParcelsByCreatedAt(parcels).filter((parcel) =>
    ['READY_FOR_POSTING', 'POSTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERY_ATTEMPT', 'RETURNED'].includes(parcel.status),
  );
}

export function getHandoverDemoParcels(parcels: AdminParcelRecord[]) {
  return sortParcelsByCreatedAt(parcels).filter((parcel) =>
    ['READY_FOR_POSTING', 'POSTED', 'IN_TRANSIT', 'DELIVERY_ATTEMPT', 'REDIRECTED_TO_PICKUP', 'AWAITING_PICKUP', 'RETURNED'].includes(
      parcel.status,
    ),
  );
}

export const transitStoryMeta: Record<string, DemoStoryStageMeta> = {
  READY_FOR_POSTING: {
    lane: 'WAREHOUSE',
    title: 'Gotowa po stronie magazynu',
    owner: 'Magazyn',
    nextOwner: 'Rampa wyjazdowa',
    summary: 'Przesylka jest przyjeta, posortowana i czeka na wydanie do dalszego transportu.',
    checkpoint: 'Gotowa do wyjazdu z magazynu i przekazania dalej.',
  },
  POSTED: {
    lane: 'WAREHOUSE',
    title: 'Nadana z magazynu',
    owner: 'Rampa wyjazdowa',
    nextOwner: 'Tranzyt',
    summary: 'Przesylka opuscila magazyn nadawczy i ma poprawnie zamkniety skan wyjazdowy.',
    checkpoint: 'Kolejny widoczny ruch to przejazd miedzy hubami.',
  },
  IN_TRANSIT: {
    lane: 'LINEHAUL',
    title: 'Tranzyt miedzy hubami',
    owner: 'Transport miedzyhubowy',
    nextOwner: 'Magazyn docelowy',
    summary: 'Przesylka jedzie pomiedzy magazynami i nie powinna zbyt dlugo pozostawac na tym etapie.',
    checkpoint: 'Oczekuj przyjazdu do magazynu docelowego albo wejscia w scenariusz wyjatkowy.',
  },
  OUT_FOR_DELIVERY: {
    lane: 'FINAL_MILE',
    title: 'Trasa kuriera',
    owner: 'Courier',
    nextOwner: 'Odbiorca albo punkt odbioru',
    summary: 'Kurier ma przesylke i powinien ja doreczyc albo zapisac wynik nieudanej proby.',
    checkpoint: 'Na tym etapie spodziewaj sie doreczenia, nieudanej proby albo przekierowania do odbioru.',
  },
  DELIVERY_ATTEMPT: {
    lane: 'EXCEPTION',
    title: 'Wyjatek po stronie kuriera',
    owner: 'Obsluga wyjatkow kuriera',
    nextOwner: 'Ponowna proba albo punkt odbioru',
    summary: 'Kurier nie mogl zamknac doreczenia i musi wybrac kolejny scenariusz ratunkowy.',
    checkpoint: 'To glowny etap wyjatkowy dla opowiesci o nieudanej probie doreczenia.',
  },
  RETURNED: {
    lane: 'EXCEPTION',
    title: 'Zwrot do nadawcy',
    owner: 'Obsluga zwrotow',
    nextOwner: 'Obsluga nadawcy',
    summary: 'Przesylka opuscila aktywna trase i weszla do procesu zwrotnego.',
    checkpoint: 'Uzyj tego etapu dla wyjatkow magazynowych i scenariuszy bez doreczenia.',
  },
  DELIVERED: {
    lane: 'DONE',
    title: 'Doreczona',
    owner: 'Wydanie zakonczone',
    nextOwner: 'Archiwum',
    summary: 'Przesylka poprawnie zakonczyla aktywny lancuch operacyjny.',
    checkpoint: 'W tym miejscu demo moze przejsc do platnosci, reklamacji albo historii.',
  },
  REDIRECTED_TO_PICKUP: {
    lane: 'PICKUP',
    title: 'Przekierowanie przygotowane',
    owner: 'Obsluga przekierowan',
    nextOwner: 'Punkt odbioru',
    summary: 'Doreczenie kurierem nie powiodlo sie i przesylka jest kierowana do odbioru wspomaganego.',
    checkpoint: 'Operator punktu musi jeszcze przyjac przekierowana przesylke.',
  },
  AWAITING_PICKUP: {
    lane: 'PICKUP',
    title: 'Gotowa do odbioru',
    owner: 'Punkt odbioru lub skrytka',
    nextOwner: 'Odbiorca',
    summary: 'Przesylka jest fizycznie gotowa do odbioru w punkcie albo skrytce.',
    checkpoint: 'To tutaj odbywa sie finalne wydanie dla odbiorcy.',
  },
};

export const handoverStoryMeta: Record<string, DemoStoryStageMeta> = {
  READY_FOR_POSTING: {
    lane: 'WAREHOUSE',
    title: 'Przygotowanie w magazynie',
    owner: 'Magazyn',
    nextOwner: 'Tranzyt',
    summary: 'Zespol operacyjny nadal trzyma przesylke i moze pokazac przyjecie, sortowanie oraz przygotowanie do wysylki.',
    checkpoint: 'Pierwsze przekazanie zaczyna sie w chwili nadania przesylki dalej.',
  },
  POSTED: {
    lane: 'WAREHOUSE',
    title: 'Nadana z magazynu',
    owner: 'Rampa wyjazdowa',
    nextOwner: 'Tranzyt',
    summary: 'Przesylka ma poprawnie zamkniete przekazanie magazynowe i jest gotowa do transportu.',
    checkpoint: 'To widoczny most pomiedzy magazynem a dalszym ruchem logistycznym.',
  },
  IN_TRANSIT: {
    lane: 'LINEHAUL',
    title: 'Tranzyt w toku',
    owner: 'Siec transportowa',
    nextOwner: 'Kurier',
    summary: 'Przesylka jest pomiedzy obiektami i jeszcze nie trafila do kuriera.',
    checkpoint: 'To dobry moment, by pokazac ruch miedzymiastowy albo miedzy hubami.',
  },
  DELIVERY_ATTEMPT: {
    lane: 'EXCEPTION',
    title: 'Wyjatek po stronie kuriera',
    owner: 'Courier',
    nextOwner: 'Ponowna proba albo punkt odbioru',
    summary: 'Kurier nie zamknal doreczenia pod drzwiami i musi wybrac kolejna sciezke ratunkowa.',
    checkpoint: 'To dobry moment, by wyjasnic zasady ponowienia, przekierowania albo zwrotu.',
  },
  REDIRECTED_TO_PICKUP: {
    lane: 'PICKUP',
    title: 'Przekazanie do punktu',
    owner: 'Obsluga przekierowan',
    nextOwner: 'Operator punktu',
    summary: 'Przesylka opuscila doreczenie kurierskie i czeka na przyjecie w punkcie.',
    checkpoint: 'W tym miejscu odpowiedzialnosc przechodzi z zespolu kurierow na punkt.',
  },
  AWAITING_PICKUP: {
    lane: 'PICKUP',
    title: 'Czeka na odbior klienta',
    owner: 'Operator punktu',
    nextOwner: 'Odbiorca',
    summary: 'Punkt lub skrytka odpowiada za finalne wydanie i moze obsluzyc checkout offline, jesli jest potrzebny.',
    checkpoint: 'To ostatnie wspomagane przekazanie przed zakonczeniem procesu.',
  },
  RETURNED: {
    lane: 'EXCEPTION',
    title: 'Zwrot do nadawcy',
    owner: 'Zespol zwrotow',
    nextOwner: 'Obsluga nadawcy',
    summary: 'Standardowy flow odbioru albo doreczenia zakonczyl sie i przesylka weszla w logistyke zwrotna.',
    checkpoint: 'Uzyj tego etapu dla nie-happy-path endingow i przegladu wyjatkow.',
  },
  DELIVERED: {
    lane: 'DONE',
    title: 'Recipient handoff done',
    owner: 'Archive',
    nextOwner: 'Archive',
    summary: 'No more active operator handoffs remain.',
    checkpoint: 'Natural ending for point pickup or courier delivery storyline.',
  },
};

export function getLaneCount(parcels: AdminParcelRecord[], metaByStatus: Record<string, DemoStoryStageMeta>, lane: DemoStoryStageMeta['lane']) {
  return parcels.filter((parcel) => metaByStatus[parcel.status]?.lane === lane).length;
}
