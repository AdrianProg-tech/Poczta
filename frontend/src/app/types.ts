export type UserRole = 'client' | 'courier' | 'point' | 'admin';

export type ShipmentStatus =
  | 'Utworzona'
  | 'Opłacona'
  | 'Nadana'
  | 'W transporcie'
  | 'Wydana kurierowi'
  | 'Oczekuje na odbiór'
  | 'Próba doręczenia'
  | 'Doręczona'
  | 'Zwrócona';

export type PaymentStatus =
  | 'Opłacona'
  | 'Oczekująca'
  | 'Nieudana'
  | 'Anulowana'
  | 'Offline — do potwierdzenia';

export type PaymentMethod = 'Karta płatnicza' | 'Przelew online' | 'Płatność w punkcie';

export interface AppUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  location?: string;
}

export interface AddressInfo {
  name: string;
  phone: string;
  address: string;
}

export interface PackageDetails {
  type: string;
  weight: string;
  dimensions: string;
  value: string;
  contents?: string;
  fragile?: boolean;
}

export interface PaymentDetails {
  status: PaymentStatus;
  method: PaymentMethod;
  amount: string;
  date: string;
}

export interface ShipmentHistoryItem {
  date: string;
  location: string;
  status: ShipmentStatus | 'Opłacona';
  description: string;
}

export interface Shipment {
  id: string;
  clientId: string;
  pointId: string;
  assignedCourierId: string;
  status: ShipmentStatus;
  created: string;
  estimatedDelivery: string;
  sender: AddressInfo;
  recipient: AddressInfo;
  package: PackageDetails;
  payment: PaymentDetails;
  history: ShipmentHistoryItem[];
}

export interface Claim {
  id: string;
  shipmentId: string;
  clientId: string;
  subject: string;
  description: string;
  status: 'Nowa' | 'W trakcie' | 'Rozwiązana';
  created: string;
}

export interface PickupPoint {
  id: string;
  name: string;
  type: 'Punkt odbioru' | 'Paczkomat';
  address: string;
  hours: string;
  phone: string;
}

export interface ShipmentDraft {
  sender: AddressInfo;
  recipient: AddressInfo;
  package: PackageDetails;
  paymentMethod: PaymentMethod;
}

export interface AppState {
  currentUser: AppUser | null;
  users: AppUser[];
  shipments: Shipment[];
  claims: Claim[];
  points: PickupPoint[];
}
