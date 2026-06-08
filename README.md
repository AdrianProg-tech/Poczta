# Poczta

Projekt sklada sie z:
- backendu Spring Boot z Oracle XE w Dockerze
- frontendu React + Vite
- RabbitMQ do asynchronicznych powiadomien
- Maildev do lokalnego podgladu maili
- skryptow Python do generowania i ladowania danych testowych przez prawdziwe API

## Co jest w projekcie

Aktualny stan obejmuje:
- role-based flow dla klienta, kuriera, punktu, admina i dispatchera
- frontend podlaczony do backendu bez mockow
- logowanie przez email/haslo oraz Google OAuth2
- platnosci online Stripe w sandboxie
- offline payment flow w punkcie i u kuriera
- public tracking
- admin/ops dashboardy, demo labs i techniczne flow symulacyjne
- seeding przez prawdziwe API
- testy jednostkowe frontend/backend i smoke e2e

## Wymagania

- Docker Desktop
- Java 17
- Node.js 20+ i npm
- Python 3.11+ lub kompatybilny Python 3

Java 17 jest zalecana rowniez w IntelliJ. Projekt byl przygotowywany pod ten runtime.

## Uslugi lokalne

Projekt uzywa Docker Compose do uruchamiania Oracle XE, RabbitMQ i Maildev.

Plik:
- `docker-compose.yml`

Uslugi:
- Oracle XE
  - kontener: `oracle-21c-springboot`
  - host DB: `localhost`
  - port DB: `1522`
  - service name: `XEPDB1`
  - user aplikacyjny: `springuser`
  - haslo aplikacyjne: `spring`
  - haslo `SYS` / `SYSTEM`: `Sys123`
- RabbitMQ
  - kontener: `pingwinpost-rabbitmq`
  - AMQP: `localhost:5672`
  - panel: [http://localhost:15672](http://localhost:15672)
  - login: `pingwin`
  - haslo: `pingwin123`
- Maildev
  - kontener: `pingwinpost-maildev`
  - SMTP: `localhost:1025`
  - panel: [http://localhost:1080](http://localhost:1080)

## Szybki start od zera

### 1. Podnies Docker

Z katalogu repo:

```powershell
cd H:\poczta
docker compose up -d
docker compose logs -f oracle-db
```

Czekaj, az w logach Oracle pojawi sie:

```text
DATABASE IS READY TO USE!
```

### 2. Uruchom backend

Podstawowy start:

```powershell
cd H:\poczta\backend\poczta-backend
.\mvnw.cmd spring-boot:run
```

Backend startuje na:
- [http://localhost:8081](http://localhost:8081)
- Swagger: [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)

Jesli chcesz testowac Google OAuth2 i Stripe lokalnie:
- skopiuj [application-local.example.properties](/H:/poczta/backend/poczta-backend/src/main/resources/application-local.example.properties:1) do `backend/poczta-backend/src/main/resources/application-local.properties`
- uzupelnij lokalne sekrety
- uruchom backend z profilem `local`:

```powershell
cd H:\poczta\backend\poczta-backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

Backend lokalnie korzysta z:
- Oracle na `localhost:1522`
- RabbitMQ na `localhost:5672`
- Maildev SMTP na `localhost:1025`

### 3. Uruchom frontend

```powershell
cd H:\poczta\frontend
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

Frontend startuje na:
- [http://127.0.0.1:4173](http://127.0.0.1:4173)

Frontend dev server ma proxy `/api -> http://localhost:8081`, wiec backend musi dzialac lokalnie na porcie `8081`.

## Demo loginy

Po seedzie mozna korzystac z przykladowych kont:

- klient: `julia.wozniak.client@example.com`
- kurier: `courier.warsaw.1@example.com`
- punkt: `point.warsaw.pop-waw-01@example.com`
- dispatcher: `ops.dispatch@example.com`
- admin: `admin.review@example.com`

Haslo dla wszystkich:

```text
demo1234
```

## Jak wypelnic baze danymi

Skrypty seedujace:
- `scripts/generate_api_csvs.py`
- `scripts/load_api_csvs.py`

### Bardzo wazne

Przed seedowaniem trzeba miec czysta baze.

Jesli chcesz miec przewidywalny zestaw danych demo, nie uruchamiaj loadera wiele razy na tej samej bazie bez resetu.

### Zalecany reset bazy przed seedem

```powershell
cd H:\poczta
docker compose down -v
docker compose up -d
docker compose logs -f oracle-db
```

Po komunikacie `DATABASE IS READY TO USE!` uruchom backend ponownie.

### Seeder krok po kroku

1. Wygeneruj CSV:

```powershell
cd H:\poczta
python .\scripts\generate_api_csvs.py --users 24 --points 8 --shipments 36
```

2. Zaladuj dane przez API:

```powershell
cd H:\poczta
python .\scripts\load_api_csvs.py --timeout 90
```

Generator zapisuje pliki do:
- `scripts/generated_api_csv/`

### Co seed potrafi przygotowac

Aktualny seed daje miedzy innymi:
- shipmenty z `PENDING`, `PAID`, `FAILED`, `OFFLINE_PENDING`, `OFFLINE_CONFIRMED`
- przypadki gotowe do dispatchu
- courier taski w stanach `ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `FAILED`
- failed attempt z awizo
- redirect do punktu
- complaint `IN_REVIEW`
- zwrot zainicjowany przez kuriera
- anulowanie przez klienta
- walk-in klienta obsluzonego w punkcie
- point handoffy i offline payment cases do recznego testowania

## Jak uruchamiac testy

### Backend

Z katalogu [backend/poczta-backend](/H:/poczta/backend/poczta-backend):

```powershell
.\mvnw.cmd test
```

Cichsza wersja:

```powershell
.\mvnw.cmd -q test
```

### Frontend unit / component tests

Z katalogu [frontend](/H:/poczta/frontend):

```powershell
npm test
```

Watch mode:

```powershell
npm run test:watch
```

Coverage:

```powershell
npm run test:coverage
```

### Frontend smoke e2e

Z katalogu [frontend](/H:/poczta/frontend):

```powershell
npm run test:e2e
```

Wersja z widocznym browserem:

```powershell
npm run test:e2e:headed
```

Przed `test:e2e` musza dzialac:
- backend na `http://localhost:8081`
- frontend na `http://127.0.0.1:4173`
- demo dane w bazie

### Build frontendu

```powershell
cd H:\poczta\frontend
npm run build
```

Uwaga:
- Vite moze pokazac warning o duzym chunku JS
- to nie blokuje dzialania aplikacji ani testow

## Jak testowac Stripe

Pelna instrukcja:
- `docs/testowanie-platnosci-stripe.md`

Szybki scenariusz:

1. Uruchom Docker, backend i frontend.
2. Zaloguj sie jako klient:
   - `julia.wozniak.client@example.com`
   - `demo1234`
3. Wejdz w `Moje przesylki -> Nadaj przesylke`.
4. Utworz przesylke z metoda platnosci `Online`.
5. W szczegolach kliknij `Zaplac przez Stripe`.

Karty testowe Stripe:
- sukces: `4242 4242 4242 4242`
- brak srodkow: `4000 0000 0000 9995`
- karta odrzucona: `4000 0000 0000 0002`

Przy kartach testowych:
- data waznosci moze byc dowolna przyszla
- CVC moze byc dowolne 3-cyfrowe
- imie moze byc dowolne

## IntelliJ / Lombok

Jesli IntelliJ pokazuje bledy typu `cannot find symbol getId/setStatus/...`, a Maven z konsoli dziala, to zwykle problemem jest Lombok annotation processing.

Sprawdz:
1. `Settings -> Plugins -> Lombok`
2. `Settings -> Build, Execution, Deployment -> Compiler -> Annotation Processors`
   - `Enable annotation processing` = wlaczone
   - `Obtain processors from project classpath` = wlaczone
   - nie ustawiaj recznie `Processor path` na jakies `unknown.jar`
3. `Project SDK = 17`
4. `Reload All Maven Projects`

## Troubleshooting

### Port 8081 jest zajety

Jesli backend nie startuje z bledem `Port 8081 was already in use`, zatrzymaj stary proces Java i uruchom backend ponownie.

### PowerShell nie rozpoznaje `backend:` albo `frontend:`

To nie sa komendy. To tylko etykiety w instrukcjach.

Poprawnie:

```powershell
cd H:\poczta\backend\poczta-backend
.\mvnw.cmd test
```

albo:

```powershell
cd H:\poczta\frontend
npm test
```

### Public tracking lub role dashboards pokazuja dziwne dane

Najpierw zrob czysty reset i reseed:

```powershell
cd H:\poczta
docker compose down -v
docker compose up -d
```

potem ponownie uruchom backend, frontend i skrypty seedujace.

## Przydatne komendy

### Sprawdzenie kontenerow

```powershell
cd H:\poczta
docker compose ps
docker compose logs -f oracle-db
```

### Zatrzymanie i wyczyszczenie bazy

```powershell
cd H:\poczta
docker compose down -v
```

### Start backendu z profilem local

```powershell
cd H:\poczta\backend\poczta-backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

## Dodatkowe notatki

- Backend config:
  [application.properties](/H:/poczta/backend/poczta-backend/src/main/resources/application.properties:1)
- Frontend dev server:
  [vite.config.ts](/H:/poczta/frontend/vite.config.ts:1)
- Seeder docs:
  `docs/backend/API_SEEDING.md`
