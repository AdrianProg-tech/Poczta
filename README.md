# Poczta

Projekt sklada sie z:
- backendu Spring Boot z Oracle XE w Dockerze
- frontendu React + Vite
- skryptow Python do generowania i ladowania danych testowych przez prawdziwe API

## Co zostalo zrobione

Ten stan projektu obejmuje:
- dopracowanie glownej logiki backendu pod live flow
- podlaczenie frontendu do backendu bez mockow
- contract endpointy dla client, courier, point, admin i ops dashboard
- skrypty seedujace, ktore potrafia wypelnic czysta baze realnymi scenariuszami operacyjnymi
- runtime role model v1 z profilami kuriera i przypisaniem pracownika punktu
- bearer auth/session v1 dla zywych rol w frontendzie i loaderze

## Wymagania

- Docker Desktop
- Java 17 lub nowsza
- Node.js 20+ i npm
- Python 3.11+ lub kompatybilny Python 3

## Docker i baza danych

Projekt uzywa Oracle XE w Dockerze.

Plik:
- `docker-compose.yml`

Dane:
- kontener: `oracle-21c-springboot`
- host DB: `localhost`
- port DB: `1522`
- service name: `XEPDB1`
- user aplikacyjny: `springuser`
- haslo aplikacyjne: `spring`
- haslo `SYS` / `SYSTEM`: `Sys123`

## Szybki start od zera

### 1. Podnies Oracle

Z katalogu repo:

```powershell
cd H:\poczta
docker compose up -d oracle-db
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
docker compose up -d oracle-db
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

Aktualny seed daje miedzy innymi:
- shipmenty z `PENDING` i `FAILED` payment
- shipmenty gotowe do dispatchu
- courier taski w stanach `ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `FAILED`
- redirect do point
- complaint `IN_REVIEW`

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

- klient: `jan.kowalski.client@example.com`
- kurier: `courier.warsaw.1@example.com`
- dispatcher: `ops.dispatch@example.com`
- admin: `admin.review@example.com`
- punkt: `point.warsaw.pop-waw-01@example.com`

Haslo dla wszystkich:

```text
demo1234
```

Rola point korzysta teraz z normalnego konta usera z przypisaniem do punktu, a nie z samego `pointCode`.

## Dodatkowe notatki

- Backend:
  `backend/poczta-backend/src/main/resources/application.properties`
- Frontend dev server:
  `frontend/vite.config.ts`
- Seeder docs:
  `docs/backend/API_SEEDING.md`
