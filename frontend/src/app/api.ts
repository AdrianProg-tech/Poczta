import type { AppUser, UserRole } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface DemoRoleOption {
  role: UserRole;
  label: string;
  hint: string;
  defaultEmail?: string;
}

export const demoRoleOptions: DemoRoleOption[] = [
  {
    role: 'client',
    label: 'Klient',
    hint: 'Nadawanie, śledzenie i reklamacje',
    defaultEmail: 'jan.kowalski.client@example.com',
  },
  {
    role: 'courier',
    label: 'Kurier',
    hint: 'Zadania doręczeń i próby dostawy',
    defaultEmail: 'courier.warsaw.1@example.com',
  },
  {
    role: 'point',
    label: 'Punkt',
    hint: 'Kolejka punktu i odbiory',
  },
  {
    role: 'admin',
    label: 'Administrator',
    hint: 'Operacje, płatności i reklamacje',
    defaultEmail: 'ops.dispatch@example.com',
  },
];

export interface CurrentUserResponse {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  pointCode: string | null;
}

export interface PublicPoint {
  pointCode: string;
  name: string;
  type: 'PICKUP_POINT' | 'PARCEL_LOCKER';
  city: string;
  address: string;
  postalCode: string;
  phone: string;
  openingHours: string;
  active: boolean;
}

export interface PublicTrackingEvent {
  status: string;
  locationName: string;
  description: string;
  eventTime: string;
}

export interface PublicTrackingResponse {
  trackingNumber: string;
  currentStatus: string;
  deliveryType: string;
  destinationSummary: string;
  estimatedDeliveryDate: string | null;
  history: PublicTrackingEvent[];
}

export interface ClientShipmentListItem {
  trackingNumber: string;
  currentStatus: string;
  paymentStatus: string | null;
  recipientName: string;
  destinationSummary: string;
  createdAt: string;
  estimatedDeliveryDate: string | null;
}

export interface ShipmentContact {
  name: string;
  phone: string;
  address: string;
}

export interface ShipmentParcel {
  weight: number;
  sizeCategory: string;
  declaredValue: number | null;
  fragile: boolean | null;
}

export interface ShipmentPaymentDetails {
  status: string | null;
  method: string | null;
  amount: number | null;
  externalReference: string | null;
}

export interface ShipmentDeliveryDetails {
  deliveryType: string | null;
  currentPointCode: string | null;
  targetPointCode: string | null;
  estimatedDeliveryDate: string | null;
}

export interface TrackingHistoryItem {
  status: string;
  eventTime: string;
  locationName: string;
  description: string;
}

export interface ClientShipmentDetails {
  trackingNumber: string;
  currentStatus: string;
  sender: ShipmentContact;
  recipient: ShipmentContact;
  parcel: ShipmentParcel;
  payment: ShipmentPaymentDetails;
  delivery: ShipmentDeliveryDetails;
  history: TrackingHistoryItem[];
  allowedActions: string[];
}

export interface ShipmentCreatedResponse {
  trackingNumber: string;
  shipmentId: string;
  currentStatus: string;
  paymentStatus: string;
}

export interface PaymentSummary {
  paymentId: string;
  trackingNumber: string;
  amount: number;
  method: string;
  status: string;
  externalReference: string | null;
  createdAt: string;
}

export interface ComplaintSummary {
  complaintId: string;
  complaintNumber: string;
  trackingNumber: string;
  type: string;
  subject: string | null;
  status: string;
  submittedAt: string;
}

export interface CourierTaskListItem {
  taskId: string;
  trackingNumber: string;
  taskType: string;
  taskStatus: string;
  shipmentStatus: string | null;
  recipientName: string;
  recipientPhone: string;
  targetAddress: string;
  plannedDate: string | null;
}

export interface PointQueueItem {
  trackingNumber: string;
  queueType: string;
  shipmentStatus: string;
  paymentStatus: string | null;
  paymentId: string | null;
  recipientName: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface PointQueueResponse {
  acceptQueue: PointQueueItem[];
  pickupQueue: PointQueueItem[];
  offlinePaymentQueue: PointQueueItem[];
}

export interface OpsDashboardSummary {
  totalShipments: number;
  pendingPaymentShipments: number;
  paymentFailedShipments: number;
  readyForDispatchShipments: number;
  awaitingCourierAssignmentShipments: number;
  redirectedToPickupShipments: number;
  awaitingPickupShipments: number;
  activeCourierTasks: number;
  complaintsInReview: number;
}

export interface OpsShipmentBoardItem {
  shipmentId: string;
  trackingNumber: string;
  shipmentStatus: string;
  paymentStatus: string | null;
  deliveryType: string | null;
  sourceCity: string | null;
  destinationCity: string | null;
  targetPointCode: string | null;
  assignedCourierEmail: string | null;
  nextActionOwner: string;
  nextSuggestedAction: string;
  blockedReason: string | null;
  createdAt: string;
}

export interface OpsCourierSummary {
  courierId: string;
  courierEmail: string;
  displayName: string;
  inferredServiceCity: string | null;
  openTaskCount: number;
  inProgressTaskCount: number;
  failedTaskCount: number;
  availableForAutoAssignment: boolean;
}

export interface OpsDispatchCandidate {
  shipmentId: string;
  trackingNumber: string;
  destinationCity: string | null;
  shipmentStatus: string;
  suggestedCourierId: string | null;
  suggestedCourierEmail: string | null;
  suggestionReason: string;
}

export interface OpsCourierDispatchResponse {
  couriers: OpsCourierSummary[];
  shipmentsAwaitingAssignment: OpsDispatchCandidate[];
}

export interface OpsRecentEvent {
  trackingNumber: string;
  status: string;
  locationName: string;
  description: string;
  eventTime: string;
}

export interface AdminPaymentSummary {
  paymentId: string;
  trackingNumber: string;
  amount: number;
  method: string;
  status: string;
  externalReference: string | null;
  clientEmail: string | null;
  createdAt: string;
}

export interface AdminComplaintSummary {
  complaintId: string;
  complaintNumber: string;
  trackingNumber: string;
  clientEmail: string | null;
  type: string;
  status: string;
  resolutionNote: string | null;
  submittedAt: string;
}

export interface CreateClientShipmentPayload {
  sender: ShipmentContact;
  recipient: ShipmentContact;
  delivery: {
    deliveryType: 'COURIER' | 'PICKUP_POINT';
    targetPointCode?: string;
  };
  parcel: {
    weight: number;
    sizeCategory: 'S' | 'M' | 'L';
    declaredValue?: number;
    contents?: string;
    fragile?: boolean;
  };
  payment: {
    method: 'ONLINE' | 'OFFLINE_AT_POINT';
  };
}

export interface CreateComplaintPayload {
  trackingNumber: string;
  type: 'DELAYED' | 'DAMAGED' | 'LOST' | 'OTHER';
  subject?: string;
  description: string;
}

export interface ClientShipmentRedirectPayload {
  targetPointCode: string;
  reason?: string;
}

export interface CreatePaymentPayload {
  method: 'ONLINE' | 'OFFLINE_AT_POINT';
  amount: number;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string | undefined>;
}

function removeEmptyHeaders(headers: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(headers).filter(([, value]) => value));
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: removeEmptyHeaders({
      Accept: 'application/json',
      'Content-Type': options.body ? 'application/json' : undefined,
      ...options.headers,
    }),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(errorText || `HTTP ${response.status}`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function userHeader(email: string | undefined) {
  return email ? { 'X-User-Email': email } : {};
}

export function formatDate(dateTime: string | null | undefined) {
  if (!dateTime) {
    return 'Brak danych';
  }

  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateTime));
}

export function formatDateTime(dateTime: string | null | undefined) {
  if (!dateTime) {
    return 'Brak danych';
  }

  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateTime));
}

export function formatCurrency(amount: number | null | undefined) {
  if (amount == null) {
    return 'Brak danych';
  }

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatShipmentStatus(status: string | null | undefined) {
  switch (status) {
    case 'CREATED':
      return 'Utworzona';
    case 'PAID':
      return 'Opłacona';
    case 'POSTED':
      return 'Nadana';
    case 'READY_FOR_POSTING':
      return 'Gotowa do wysyłki';
    case 'IN_TRANSIT':
      return 'W transporcie';
    case 'OUT_FOR_DELIVERY':
      return 'W doręczeniu';
    case 'DELIVERY_ATTEMPT':
      return 'Próba doręczenia';
    case 'REDIRECTED_TO_PICKUP':
      return 'Przekierowana do punktu';
    case 'AWAITING_PICKUP':
      return 'Czeka na odbiór';
    case 'DELIVERED':
      return 'Doręczona';
    case 'RETURNED':
      return 'Zwrócona';
    case 'CANCELED':
      return 'Anulowana';
    default:
      return status ?? 'Nieznany';
  }
}

export function formatPaymentStatus(status: string | null | undefined) {
  switch (status) {
    case 'PAID':
      return 'Opłacona';
    case 'OFFLINE_CONFIRMED':
      return 'Potwierdzona offline';
    case 'PENDING':
      return 'Oczekująca';
    case 'FAILED':
      return 'Nieudana';
    case 'CANCELED':
      return 'Anulowana';
    case 'OFFLINE_PENDING':
      return 'Offline - do potwierdzenia';
    default:
      return status ?? 'Nieznany';
  }
}

export function formatPaymentMethod(method: string | null | undefined) {
  switch (method) {
    case 'ONLINE':
      return 'Online';
    case 'OFFLINE_AT_POINT':
      return 'Płatność w punkcie';
    default:
      return method ?? 'Nieznana';
  }
}

export function formatComplaintStatus(status: string | null | undefined) {
  switch (status) {
    case 'NEW':
      return 'Nowa';
    case 'IN_REVIEW':
      return 'W trakcie';
    case 'ACCEPTED':
      return 'Uznana';
    case 'REJECTED':
      return 'Odrzucona';
    case 'CLOSED':
      return 'Zamknięta';
    default:
      return status ?? 'Nieznany';
  }
}

export function formatComplaintType(type: string | null | undefined) {
  switch (type) {
    case 'DELAYED':
      return 'Opóźnienie';
    case 'DAMAGED':
      return 'Uszkodzenie';
    case 'LOST':
      return 'Zaginięcie';
    case 'OTHER':
      return 'Inne';
    default:
      return type ?? 'Nieznany';
  }
}

export function formatPointType(type: PublicPoint['type']) {
  return type === 'PARCEL_LOCKER' ? 'Paczkomat' : 'Punkt odbioru';
}

export function formatQueueType(type: string | null | undefined) {
  switch (type) {
    case 'ACCEPT':
      return 'Do przyjęcia';
    case 'PICKUP':
      return 'Do wydania';
    case 'OFFLINE_PAYMENT':
      return 'Offline payment';
    default:
      return type ?? 'Nieznana';
  }
}

export function formatOpsAction(action: string | null | undefined) {
  switch (action) {
    case 'MARK_PAYMENT_PAID':
      return 'Potwierdź płatność';
    case 'RESTART_PAYMENT':
      return 'Klient musi ponowić płatność';
    case 'CONFIRM_OFFLINE_PAYMENT':
      return 'Potwierdź płatność w punkcie';
    case 'PREPARE_FOR_DISPATCH':
      return 'Przygotuj do wysyłki';
    case 'ASSIGN_COURIER':
      return 'Przypisz kuriera';
    case 'HAND_OVER_TO_COURIER':
      return 'Przekaż kurierowi';
    case 'ACCEPT_TASK':
      return 'Kurier powinien przyjąć zadanie';
    case 'START_ROUTE':
      return 'Rozpocznij trasę';
    case 'COMPLETE_OR_RECORD_ATTEMPT':
      return 'Dostarcz lub zapisz próbę';
    case 'ACCEPT_REDIRECTED_SHIPMENT':
      return 'Przyjmij w punkcie';
    case 'PICKUP_AT_POINT':
      return 'Odbiór klienta';
    case 'REVIEW_EXCEPTION':
      return 'Sprawdź wyjątek';
    case 'NONE':
      return 'Brak';
    default:
      return action ?? 'Brak';
  }
}

export function formatOpsOwner(owner: string | null | undefined) {
  switch (owner) {
    case 'CLIENT':
      return 'Klient';
    case 'ADMIN':
      return 'Administrator';
    case 'POINT':
      return 'Punkt';
    case 'DISPATCH':
      return 'Dispatcher';
    case 'OPS':
      return 'Operacje';
    case 'COURIER':
      return 'Kurier';
    case 'SYSTEM':
      return 'System';
    default:
      return owner ?? 'Nieznany';
  }
}

export async function getCurrentUser(email: string) {
  return request<CurrentUserResponse>('/api/auth/me', {
    headers: userHeader(email),
  });
}

export async function getPublicPoints() {
  return request<PublicPoint[]>('/api/public/points');
}

export async function getPublicTracking(trackingNumber: string) {
  return request<PublicTrackingResponse>(`/api/public/tracking/${trackingNumber}`);
}

export async function getClientShipments(email: string) {
  return request<ClientShipmentListItem[]>('/api/client/shipments', {
    headers: userHeader(email),
  });
}

export async function getClientShipmentDetails(email: string, trackingNumber: string) {
  return request<ClientShipmentDetails>(`/api/client/shipments/${trackingNumber}`, {
    headers: userHeader(email),
  });
}

export async function createClientShipment(email: string, payload: CreateClientShipmentPayload) {
  return request<ShipmentCreatedResponse>('/api/client/shipments', {
    method: 'POST',
    headers: userHeader(email),
    body: payload,
  });
}

export async function getClientComplaints(email: string) {
  return request<ComplaintSummary[]>('/api/client/complaints', {
    headers: userHeader(email),
  });
}

export async function createClientComplaint(email: string, payload: CreateComplaintPayload) {
  return request<{ complaintId: string; complaintNumber: string; status: string }>('/api/client/complaints', {
    method: 'POST',
    headers: userHeader(email),
    body: payload,
  });
}

export async function getClientPayments(email: string) {
  return request<PaymentSummary[]>('/api/client/payments', {
    headers: userHeader(email),
  });
}

export async function createShipmentPayment(email: string, trackingNumber: string, payload: CreatePaymentPayload) {
  return request<{ paymentId: string; status: string; shipmentStatus: string }>(
    `/api/client/shipments/${trackingNumber}/payments`,
    {
      method: 'POST',
      headers: userHeader(email),
      body: payload,
    },
  );
}

export async function requestClientShipmentRedirect(
  email: string,
  trackingNumber: string,
  payload: ClientShipmentRedirectPayload,
) {
  return request<{
    trackingNumber: string;
    shipmentStatus: string;
    targetPointCode: string;
    redirectionId: string;
    redirectionStatus: string;
  }>(`/api/client/shipments/${trackingNumber}/redirect`, {
    method: 'POST',
    headers: userHeader(email),
    body: payload,
  });
}

export async function getCourierTasks(courierId: string) {
  return request<CourierTaskListItem[]>('/api/courier/tasks', {
    headers: { 'X-Courier-Id': courierId },
  });
}

export async function acceptCourierTask(courierId: string, taskId: string) {
  return request(`/api/courier/tasks/${taskId}/accept`, {
    method: 'POST',
    headers: { 'X-Courier-Id': courierId },
  });
}

export async function startCourierTask(courierId: string, taskId: string) {
  return request(`/api/courier/tasks/${taskId}/start`, {
    method: 'POST',
    headers: { 'X-Courier-Id': courierId },
  });
}

export async function completeCourierTask(courierId: string, taskId: string, note?: string) {
  return request(`/api/courier/tasks/${taskId}/complete-delivery`, {
    method: 'POST',
    headers: { 'X-Courier-Id': courierId },
    body: {
      deliveredAt: new Date().toISOString(),
      note: note || null,
    },
  });
}

export async function recordCourierAttempt(
  courierId: string,
  taskId: string,
  payload: { result: string; note?: string; redirectToPickup?: boolean; redirectPointCode?: string },
) {
  return request(`/api/courier/tasks/${taskId}/record-attempt`, {
    method: 'POST',
    headers: { 'X-Courier-Id': courierId },
    body: payload,
  });
}

export async function getPointQueue(pointCode: string) {
  return request<PointQueueResponse>('/api/point/queue', {
    headers: { 'X-Point-Code': pointCode },
  });
}

export async function acceptPointShipment(pointCode: string, trackingNumber: string) {
  return request(`/api/point/shipments/${trackingNumber}/accept`, {
    method: 'POST',
    headers: { 'X-Point-Code': pointCode },
  });
}

export async function postPointShipment(pointCode: string, trackingNumber: string) {
  return request(`/api/point/shipments/${trackingNumber}/post`, {
    method: 'POST',
    headers: { 'X-Point-Code': pointCode },
  });
}

export async function releasePointShipment(pointCode: string, trackingNumber: string) {
  return request(`/api/point/shipments/${trackingNumber}/release`, {
    method: 'POST',
    headers: { 'X-Point-Code': pointCode },
  });
}

export async function confirmOfflinePayment(pointCode: string, paymentId: string) {
  return request(`/api/point/payments/${paymentId}/confirm-offline`, {
    method: 'POST',
    headers: { 'X-Point-Code': pointCode },
  });
}

export async function getOpsDashboardSummary() {
  return request<OpsDashboardSummary>('/api/ops/dashboard-summary');
}

export async function getOpsShipmentBoard() {
  return request<OpsShipmentBoardItem[]>('/api/ops/shipments-board');
}

export async function getOpsCourierDispatch() {
  return request<OpsCourierDispatchResponse>('/api/ops/courier-dispatch');
}

export async function getOpsRecentEvents() {
  return request<OpsRecentEvent[]>('/api/ops/recent-events');
}

export async function prepareShipmentForDispatch(shipmentId: string) {
  return request(`/api/admin/shipments/${shipmentId}/prepare-for-dispatch`, {
    method: 'POST',
  });
}

export async function assignCourierToShipment(shipmentId: string, courierId: string) {
  return request(`/api/admin/shipments/${shipmentId}/assign-courier`, {
    method: 'POST',
    body: {
      courierId,
      taskDate: new Date().toISOString().slice(0, 10),
    },
  });
}

export async function getAdminPayments() {
  return request<AdminPaymentSummary[]>('/api/admin/payments');
}

export async function markPaymentPaid(paymentId: string) {
  return request(`/api/admin/payments/${paymentId}/mark-paid`, {
    method: 'POST',
  });
}

export async function failPayment(paymentId: string) {
  return request(`/api/admin/payments/${paymentId}/fail`, {
    method: 'POST',
  });
}

export async function cancelPayment(paymentId: string) {
  return request(`/api/admin/payments/${paymentId}/cancel`, {
    method: 'POST',
  });
}

export async function getAdminComplaints() {
  return request<AdminComplaintSummary[]>('/api/admin/complaints');
}

export async function startComplaintReview(complaintId: string) {
  return request(`/api/admin/complaints/${complaintId}/start-review`, {
    method: 'POST',
  });
}

export async function acceptComplaint(complaintId: string, resolutionNote?: string) {
  return request(`/api/admin/complaints/${complaintId}/accept`, {
    method: 'POST',
    body: resolutionNote ? { resolutionNote } : undefined,
  });
}

export async function rejectComplaint(complaintId: string, resolutionNote?: string) {
  return request(`/api/admin/complaints/${complaintId}/reject`, {
    method: 'POST',
    body: resolutionNote ? { resolutionNote } : undefined,
  });
}

export async function closeComplaint(complaintId: string) {
  return request(`/api/admin/complaints/${complaintId}/close`, {
    method: 'POST',
  });
}

export function userFromAuthResponse(role: UserRole, authUser: CurrentUserResponse): AppUser {
  return {
    role,
    id: authUser.id,
    email: authUser.email,
    name: authUser.displayName,
    pointCode: authUser.pointCode ?? undefined,
  };
}
