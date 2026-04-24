# Backend Progress

Stan na: `2026-04-24`

## Goal
Ten plik podsumowuje, co jest gotowe po stronie backendu, co można już pokazać na zajęciach oraz co jeszcze wymaga dopracowania.

## What Is Ready

- Spring Boot backend uruchamia się lokalnie na porcie `8081`
- Backend łączy się z Oracle w Dockerze przez `localhost:1522/XEPDB1`
- Model domenowy jest szeroki i obejmuje główne encje systemu przesyłek
- Działa podstawowy zestaw REST API dla użytkowników, punktów, przesyłek, śledzenia, reklamacji i płatności
- Dodano pierwszą logikę biznesową:
  - reguły przejść statusów przesyłki
  - dodawanie tracking event aktualizuje status przesyłki
  - podstawowy flow płatności offline
- Dodano walidację requestów i obsługę części błędów API
- Testy uruchamiają się lokalnie na H2 bez potrzeby podpinania Oracle

## Database Status

Źródło struktury bazy:
- encje JPA z `backend/poczta-backend/src/main/java/org/example/pocztabackend/model`

Jak tworzy się baza:
- Hibernate uruchamia `ddl-auto=update`
- przy starcie backendu tworzy lub aktualizuje tabele na podstawie encji

Aktualna konfiguracja:
- plik: `backend/poczta-backend/src/main/resources/application.properties`
- Oracle: `jdbc:oracle:thin:@localhost:1522/XEPDB1`
- user: `springuser`
- hasło: `spring`

Jak zapełnia się baza:
- przez endpointy REST w Postmanie / IntelliJ HTTP client
- przykładowe requesty są w `backend/poczta-backend/src/test_api.http`

Format identyfikatorów:
- UUID przechowywane jako czytelne `VARCHAR(36)`, a nie `RAW(16)`

## Main Entities

Główne encje już istnieją:
- `User`
- `Role`
- `Shipment`
- `Label`
- `TrackingEvent`
- `Point`
- `Locker`
- `LockerCompartment`
- `Payment`
- `Redirection`
- `DeliveryAttempt`
- `Notice`
- `ReturnProcess`
- `Complaint`
- `ComplaintAttachment`
- `CourierTask`

Wniosek:
- model domenowy jest w dużej mierze gotowy
- głównym zadaniem nie jest już tworzenie nowych encji, tylko rozwijanie logiki, API i testów

## Available API

Kontrolery aktualnie dostępne:
- `UserController`
- `PointController`
- `ShipmentController`
- `TrackingEventController`
- `ComplaintController`
- `PaymentController`

Najważniejsze endpointy do pokazania:

### Users
- `GET /api/users`
- `GET /api/users/{id}`
- `POST /api/users`

### Points
- `GET /api/points`
- `GET /api/points/{id}`
- `POST /api/points`

### Shipments
- `GET /api/parcels`
- `GET /api/parcels/{id}`
- `GET /api/parcels/tracking/{trackingNumber}`
- `POST /api/parcels`
- `PATCH /api/parcels/{id}/status`
- `DELETE /api/parcels/{id}`

### Tracking
- `POST /api/tracking`
- `GET /api/tracking/{shipmentId}`

### Complaints
- `POST /api/complaints`
- `GET /api/complaints`
- `GET /api/complaints?shipmentId=...`
- `GET /api/complaints?userId=...`

### Payments
- `POST /api/payments`
- `GET /api/payments`
- `GET /api/payments?shipmentId=...`
- `PATCH /api/payments/{paymentId}/confirm-offline`

## Business Logic Already Implemented

### Shipment workflow
Serwis `ShipmentWorkflowService` pilnuje dozwolonych przejść statusów, np.:
- `CREATED -> PAID`
- `PAID -> READY_FOR_POSTING`
- `READY_FOR_POSTING -> POSTED`
- `POSTED -> IN_TRANSIT`
- `IN_TRANSIT -> OUT_FOR_DELIVERY`

Niedozwolone przejścia zwracają błąd `400`.

### Tracking
Dodanie tracking event:
- sprawdza istnienie przesyłki
- zapisuje event do historii
- aktualizuje status przesyłki zgodnie z workflow

### Payments
Obsługiwane są dwa tryby:
- `ONLINE` -> status `PENDING`
- `OFFLINE` -> status `OFFLINE_PENDING`

Po potwierdzeniu płatności offline:
- payment przechodzi na `OFFLINE_CONFIRMED`
- shipment przechodzi na `PAID`

## Validation Examples

Przykładowe walidacje już działające:
- `UserRequest.email` musi być poprawnym adresem email
- `ShipmentRequest.trackingNumber` jest wymagany
- `ShipmentRequest.weight` musi być większy od zera
- `TrackingEventRequest.status` jest wymagany
- `PaymentRequest.amount` musi być większy od zera

Przykłady odpowiedzi błędów:
- `400` dla brakujących lub błędnych danych
- `404` gdy nie istnieje shipment / user / payment
- `409` przy próbie zapisania duplikatu email albo usunięcia shipmentu używanego przez inne rekordy

## Tests

Aktualnie istnieją:
- `PocztaBackendApplicationTests`
- `ShipmentWorkflowServiceTest`
- `PaymentServiceTest`

Co testy pokrywają:
- poprawne przejścia statusów shipment
- blokowanie niepoprawnych przejść
- tworzenie offline payment
- potwierdzanie offline payment

Ważne:
- testy używają profilu `test`
- profil `test` działa na H2
- `mvn test` nie wymaga lokalnie uruchomionego Oracle

## What Can Be Shown On The Milestone

Na ten moment można pokazać:

1. Backend uruchamiający się lokalnie
2. Połączenie z Oracle w Dockerze
3. Auto-tworzenie / aktualizację schematu z encji
4. CRUD-ish flow dla:
   - users
   - points
   - shipments
5. Tracking flow
6. Complaint creation flow
7. Payment offline confirmation flow
8. Działające testy jednostkowe
9. Swagger / OpenAPI, jeśli po aktualizacji `springdoc` działa poprawnie

## Recommended Demo Flow

Najbezpieczniejszy scenariusz demo:

1. `POST /api/users`
2. `POST /api/points`
3. `POST /api/parcels`
4. `POST /api/tracking`
5. `POST /api/payments` z `OFFLINE`
6. `PATCH /api/payments/{paymentId}/confirm-offline`
7. `POST /api/complaints`
8. `GET`-y pokazujące zapisane dane

## What Is Still Missing

Najważniejsze braki po stronie backendu:
- pełniejszy moduł płatności online
- OAuth2 / social login
- realne użycie RabbitMQ / asynchronicznych kolejek
- więcej testów dla `TrackingEventService`, `ComplaintService`, kontrolerów
- lepsza dokumentacja API
- pełniejsze use-case dla admina i operatora

## Priority Before VI zajęcia

Must have:
- stabilny start backendu
- działające API z Postmana
- działająca baza Oracle
- sensowny demo flow
- brak krytycznych 500 podczas podstawowych scenariuszy

## Priority Before VIII zajęcia

Should have:
- mocniejsza logika biznesowa
- płatności w bardziej kompletnej formie
- więcej testów
- dopracowany Swagger
- początek integracji async / OAuth2
