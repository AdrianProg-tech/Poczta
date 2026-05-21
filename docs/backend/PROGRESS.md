# Backend Progress

Stan na: `2026-05-21`

## Zaimplementowane funkcjonalności

### Uwierzytelnianie i autoryzacja
- Logowanie przez email + hasło z tokenem Bearer (tymczasowa sesja w pamięci)
- Logowanie przez Google OAuth2 (Spring Security OAuth2 Client)
  - Automatyczne tworzenie/wyszukiwanie użytkownika po email z Google
  - Obsługa błędów OAuth2 z przekierowaniem na frontend
- Ochrona endpointów przez custom `AuthInterceptor`

### Model domenowy
- Pełny zestaw encji JPA: `User`, `Role`, `Shipment`, `Label`, `TrackingEvent`, `Point`, `Locker`, `LockerCompartment`, `Payment`, `Redirection`, `DeliveryAttempt`, `Notice`, `ReturnProcess`, `Complaint`, `ComplaintAttachment`, `CourierTask`
- UUID jako identyfikatory przechowywane jako `VARCHAR(36)`
- `ddl-auto=update` — schemat aktualizuje się automatycznie przy starcie

### REST API — 21 kontrolerów
| Kontroler | Ścieżka bazowa | Rola |
|-----------|---------------|------|
| `AuthController` | `/api/auth` | publiczne |
| `PublicTrackingController` | `/api/public/tracking` | publiczne |
| `PublicPointController` | `/api/public/points` | publiczne |
| `ClientShipmentController` | `/api/client/shipments` | klient |
| `ClientComplaintController` | `/api/client/complaints` | klient |
| `ClientPaymentController` | `/api/client` | klient |
| `CourierTaskContractController` | `/api/courier/tasks` | kurier |
| `PointOperationContractController` | `/api/point` | pracownik punktu |
| `AdminShipmentContractController` | `/api/admin/shipments` | admin |
| `AdminComplaintContractController` | `/api/admin/complaints` | admin |
| `AdminPaymentContractController` | `/api/admin/payments` | admin |
| `AdminUserContractController` | `/api/admin/users` | admin |
| `OperationsConsoleController` | `/api/ops` | admin |
| `ShipmentController` | `/api/parcels` | zarządzanie |
| `UserController` | `/api/users` | zarządzanie |
| `PointController` | `/api/points` | zarządzanie |
| `ComplaintController` | `/api/complaints` | zarządzanie |
| `PaymentController` | `/api/payments` | zarządzanie |
| `TrackingEventController` | `/api/tracking` | zarządzanie |
| `StripeWebhookController` | `/api/payments/webhook` | Stripe |

### Płatności — Stripe Sandbox
- `POST /api/client/payments/{paymentId}/initiate-online` → tworzy sesję Stripe Checkout, zwraca URL
- `POST /api/client/payments/{paymentId}/verify-session?sessionId=...` → weryfikuje sesję po powrocie ze Stripe
- `POST /api/payments/webhook/stripe` → obsługa webhooków Stripe (checkout.session.completed / expired)
- Klucze testowe w `application.properties`; dokumentacja kart testowych w `docs/testowanie-platnosci-stripe.md`

### RabbitMQ — asynchroniczne powiadomienia
- `RabbitMQConfig` — konfiguracja exchange, queue, binding
- `NotificationService` — publikuje zdarzenia zmiany statusu przesyłki do kolejki
- `NotificationConsumer` — odbiera zdarzenia i wysyła email przez `EmailNotificationService`
- Maildev dostępny lokalnie na porcie 1025 (odbiór) i 1080 (podgląd w przeglądarce)

### Logika biznesowa
- `ShipmentWorkflowService` — pilnuje dozwolonych przejść statusów
- `ClientShipmentCommandService` — tworzenie przesyłek z obliczaniem ceny
- `DispatchOperationsService` — dispatch, przydzielanie kurierów
- `CourierTaskContractService` — zarządzanie zadaniami kuriera
- `AdminComplaintContractService` — rozpatrywanie reklamacji
- Poprawne obliczanie kwoty płatności (base 19.99 + opcja deklarowanej wartości + fragile)

### Dokumentacja API
- Swagger UI dostępny na `http://localhost:8081/swagger-ui.html`
- `OpenApiConfig` — tytuł "PingwinPost API", wersja "1.0.0"
- Wszystkie 21 kontrolerów mają `@Tag` + `@Operation` na metodach

### Testy
- `PocztaBackendApplicationTests` — test uruchomienia kontekstu
- `ShipmentWorkflowServiceTest` — przejścia statusów
- `PaymentServiceTest` — tworzenie i potwierdzanie płatności offline
- `ClientShipmentCommandServiceTest` — tworzenie przesyłek klienta
- Testy działają na H2 (profil `test`), bez potrzeby uruchamiania Oracle

## Konfiguracja środowiska

- Baza danych: Oracle XE w Docker na `localhost:1522/XEPDB1`
- RabbitMQ: Docker na `localhost:5672`
- Maildev: Docker na `localhost:1025` (SMTP) / `localhost:1080` (Web UI)
- Backend: port `8081`
- Klucze Stripe: `application.properties` (sandbox)
- Klucze Google OAuth2: `application.properties`

## Uruchomienie

```bash
docker-compose up -d
cd backend/poczta-backend
./mvnw spring-boot:run
```

Swagger: `http://localhost:8081/swagger-ui.html`
