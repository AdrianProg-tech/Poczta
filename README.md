# Poczta

Projekt sklada sie z:
- backendu Spring Boot z Oracle XE w Dockerze
- frontendu React + Vite
- RabbitMQ do asynchronicznych powiadomien
- Maildev do lokalnego podgladu maili
- skryptow Python do generowania i ladowania danych testowych przez prawdziwe API

## Co zostalo zrobione

Ten stan projektu obejmuje:
- dopracowanie glownej logiki backendu pod live flow
- podlaczenie frontendu do backendu bez mockow
- contract endpointy dla client, courier, point, admin i ops dashboard
- logowanie przez email/haslo oraz Google OAuth2
- platnosci online Stripe w trybie sandbox
- webhook Stripe i flow powrotu na frontend po checkout
- Swagger / OpenAPI dla biezacego API
- RabbitMQ + Maildev do lokalnych powiadomien
- skrypty seedujace, ktore potrafia wypelnic czysta baze realnymi scenariuszami operacyjnymi
- runtime role model v1 z profilami kuriera i przypisaniem pracownika punktu
- bearer auth/session v1 dla zywych rol w frontendzie i loaderze

## Wymagania

- Docker Desktop
- Java 17 lub nowsza
- Node.js 20+ i npm
- Python 3.11+ lub kompatybilny Python 3

## Docker i uslugi lokalne

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

### 1. Podnies uslugi Docker

Z katalogu repo:

```powershell
cd H:\poczta
docker compose up -d
docker compose logs -f oracle-db
```

Czekaj, az w logach pojawi sie:

```text
DATABASE IS READY TO USE!
```

### 2. Uruchom backend

```powershell
cd H:\poczta\backend\poczta-backend
.\mvnw.cmd spring-boot:run
```

Backend startuje na:
- `http://localhost:8081`
- Swagger: [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)

Jesli pojawi sie blad `Port 8081 was already in use`, trzeba zatrzymac stary proces Java, ktory wisi w tle.

Lokalne sekrety do OAuth2 i Stripe:
- skopiuj [application-local.example.properties](/H:/poczta/backend/poczta-backend/src/main/resources/application-local.example.properties:1) do `backend/poczta-backend/src/main/resources/application-local.properties`
- uzupelnij lokalne wartosci dla Google OAuth2 i Stripe
- uruchom backend z profilem `local`:

```powershell
cd H:\poczta\backend\poczta-backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

Backend lokalnie korzysta z:
- Oracle na `localhost:1522`
- RabbitMQ na `localhost:5672`
- Maildev SMTP na `localhost:1025`

Haslo demo dla wszystkich seedowanych kont:

```text
demo1234
```

### 3. Uruchom frontend

```powershell
cd H:\poczta\frontend
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

Frontend startuje domyslnie na:
- [http://127.0.0.1:4173](http://127.0.0.1:4173)

Frontend ma skonfigurowany proxy `/api -> http://localhost:8081`, wiec backend musi dzialac lokalnie na porcie `8081`.

Po powrocie z Google OAuth2 i Stripe frontend rowniez oczekuje backendu pod `http://localhost:8081`.

## Jak wypelnic baze danymi

Skrypty seedujace:
- `scripts/generate_api_csvs.py`
- `scripts/load_api_csvs.py`

### Bardzo wazne

Przed seedowaniem trzeba miec czysta baze.

Nie uruchamiaj `load_api_csvs.py` wielokrotnie na tej samej bazie, jezeli chcesz miec czysty i przewidywalny zestaw danych. Skrypt tworzy nowe shipmenty i nowe akcje biznesowe, wiec ponowny load bedzie dokladal kolejne rekordy.

### Zalecany reset bazy przed seedem

```powershell
cd H:\poczta
docker compose down -v
docker compose up -d
docker compose logs -f oracle-db
```

Po komunikacie `DATABASE IS READY TO USE!` uruchom backend jeszcze raz.

Jesli backend byl uruchomiony przed pelna gotowoscia Oracle albo przed resetem bazy, zrestartuj go recznie po tym kroku.

### Seeder krok po kroku

1. Wygeneruj dane CSV:

```powershell
cd H:\poczta
python .\scripts\generate_api_csvs.py --users 24 --points 8 --shipments 36
```

2. Zaladuj dane przez API do dzialajacego backendu:

```powershell
cd H:\poczta
python .\scripts\load_api_csvs.py --timeout 60
```

Loader sam loguje konta testowe przez `POST /api/auth/login` i korzysta z `Authorization: Bearer ...`.

Generator zapisuje pliki do:
- `scripts/generated_api_csv/`

Mozesz tez wygenerowac mniejszy lub wiekszy zestaw:

```powershell
python .\scripts\generate_api_csvs.py --users 24 --points 8 --shipments 40
```

### Co zostalo potwierdzone

Potwierdzilem lokalnie, ze na czystej bazie ten flow dziala:

1. `docker compose down -v`
2. `docker compose up -d oracle-db`
3. start backendu
4. `python .\scripts\generate_api_csvs.py --users 24 --points 8 --shipments 36`
5. `python .\scripts\load_api_csvs.py --timeout 60`

Po tym baza zostaje wypelniona m.in.:
- users
- points
- shipments
- payment actions
- courier assignments
- courier task actions
- point actions
- complaints
- client cancellations
- walk-in shipments from point flow

Aktualny seed daje miedzy innymi:
- shipmenty z `PENDING` i `FAILED` payment
- shipmenty gotowe do dispatchu
- courier taski w stanach `ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `FAILED`
- redirect do point
- complaint `IN_REVIEW`
- awizo po nieudanej probie doreczenia
- zwrot zainicjowany przez kuriera
- przesylke anulowana przez klienta
- walk-in klienta obsluzonego w punkcie

Uwaga:
- offline point payment cases sa na razie celowo zostawiane jako `OFFLINE_PENDING` do recznego testowania i nie sa automatycznie domykane przez seed loader

## Przydatne komendy

### Sprawdzenie kontenera Oracle

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

### Build frontendu

```powershell
cd H:\poczta\frontend
npm run build
```

### Testy backendu

```powershell
cd H:\poczta\backend\poczta-backend
.\mvnw.cmd test
```

## Demo loginy do frontendu

Po seedzie mozna korzystac z przykladowych kont:

- klient: `julia.wozniak.client@example.com`
- kurier: `courier.warsaw.1@example.com`
- dispatcher: `ops.dispatch@example.com`
- admin: `admin.review@example.com`
- punkt: `point.warsaw.pop-waw-01@example.com`

Haslo dla wszystkich:

```text
demo1234
```

Rola point korzysta teraz z normalnego konta usera z przypisaniem do punktu, a nie z samego `pointCode`.

## Jak testowac platnosci Stripe

Pelna instrukcja:
- `docs/testowanie-platnosci-stripe.md`

Szybki scenariusz:

1. Uruchom `docker compose up -d`, backend i frontend.
2. Zaloguj sie jako klient:
   - `julia.wozniak.client@example.com`
   - haslo: `demo1234`
3. Wejdz w `Moje przesylki -> Nadaj przesylke`.
4. Utworz przesylke z metoda platnosci `Online`.
5. Przejdz do szczegolow przesylki i kliknij `Zaplac przez Stripe`.

Karty testowe Stripe:
- sukces: `4242 4242 4242 4242`
- brak srodkow: `4000 0000 0000 9995`
- karta odrzucona: `4000 0000 0000 0002`

Przy kartach testowych:
- data waznosci moze byc dowolna przyszla
- CVC moze byc dowolne 3-cyfrowe
- imie moze byc dowolne

Oczekiwane zachowanie:
- po sukcesie frontend wraca na `/client/shipments/{paymentId}/stripe-success`
- status platnosci powinien przejsc na oplacona
- po anulowaniu lub odrzuceniu uzytkownik wraca do szczegolow przesylki i moze sprobowac ponownie

Uwagi techniczne:
- backend tworzy checkout Stripe i weryfikuje sesje po powrocie
- webhook Stripe jest wystawiony pod `/api/payments/webhook/stripe`
- testowe maile mozna podejrzec w Maildev: [http://localhost:1080](http://localhost:1080)

## Dodatkowe notatki

- Backend:
  `backend/poczta-backend/src/main/resources/application.properties`
- Frontend dev server:
  `frontend/vite.config.ts`
- Seeder docs:
  `docs/backend/API_SEEDING.md`
