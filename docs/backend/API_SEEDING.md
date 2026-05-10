# API Seeding

## Cel

Skrypty seedujace:
- generuja CSV z danymi testowymi
- laduja dane do backendu przez prawdziwe endpointy REST

To nie jest import bezposrednio do bazy. Seeder przechodzi przez contract API i dzieki temu sprawdza realny flow backendu.

## Pliki

- `scripts/generate_api_csvs.py`
- `scripts/load_api_csvs.py`

## Co generuje generator

CSV sa zapisywane do:
- `scripts/generated_api_csv/`

Generator tworzy:
- `users.csv`
- `points.csv`
- `shipments.csv`
- `payment_actions.csv`
- `courier_assignments.csv`
- `courier_task_actions.csv`
- `point_actions.csv`
- `complaints.csv`
- `_summary.txt`

## Warunki uruchomienia

Przed loadem musi dzialac:
- Oracle w Dockerze
- backend na `http://localhost:8081`
- aktywny endpoint `POST /api/auth/login`

Haslo demo dla seedowanych kont:

```text
demo1234
```

## Bardzo wazna zasada

Jesli chcesz miec czyste dane testowe, najpierw wyczysc baze:

```powershell
cd H:\poczta
docker compose down -v
docker compose up -d oracle-db
```

Poczekaj na:

```text
DATABASE IS READY TO USE!
```

Potem uruchom backend i dopiero wtedy generator + loader.

Powod:
- users i points sa reuzywane
- shipmenty i akcje biznesowe sa tworzone na nowo
- wielokrotne odpalanie loadera bez resetu daje dodatkowe rekordy

## Generowanie CSV

Domyslny rozsadny zestaw:

```powershell
cd H:\poczta
python .\scripts\generate_api_csvs.py --users 24 --points 8 --shipments 36
```

Przyklad wiekszego zestawu:

```powershell
python .\scripts\generate_api_csvs.py --users 24 --points 8 --shipments 40
```

## Ladowanie danych

```powershell
cd H:\poczta
python .\scripts\load_api_csvs.py --timeout 60
```

Loader sam loguje wymagane konta testowe i wykonuje operacje przez bearer tokeny.

Mozna tez podac inny base URL:

```powershell
python .\scripts\load_api_csvs.py --base-url http://localhost:8081
```

## Kolejnosc ladowania

Loader pracuje w tej kolejnosci:

1. points
2. users
3. shipments
4. payment actions
5. courier assignments
6. courier task actions
7. point actions
8. complaints

## Jakie scenariusze seed sa teraz pokryte

Aktualny seed buduje m.in.:
- payment `PENDING`
- payment `FAILED`
- shipment `READY_FOR_POSTING`
- shipmenty czekajace na assign kuriera
- task kuriera w `ASSIGNED`
- task kuriera w `ACCEPTED`
- task kuriera w `IN_PROGRESS`
- task kuriera zakonczony sukcesem
- nieudana proba doreczenia i redirect do point
- complaint `IN_REVIEW`
- complaint `CLOSED`
- offline point payment cases jako `OFFLINE_PENDING`

## Potwierdzenie

Ten flow zostal sprawdzony lokalnie na czystej bazie:

1. reset Oracle przez `docker compose down -v`
2. start Oracle
3. start backendu
4. jesli backend byl uruchomiony przed gotowoscia Oracle albo przed resetem, zrestartowac go recznie
5. generate CSV
6. load przez API

Loader zakonczyl sie sukcesem dla zestawu:
- `users: 24`
- `points: 8`
- `shipments: 36`
- `payment_actions: 36`
- `courier_assignments: 20`
- `courier_task_actions: 18`
- `point_actions: 6`
- `complaints: 4`

Nowy seed zawiera tez:
- point worker users z przypisaniem do konkretnych punktow
- courier users z `CourierProfile.serviceCity`
- demo loginy gotowe do `auth/me` dla client, courier, point i admin

## Ograniczenie, o ktorym trzeba wiedziec

Offline point payment cases sa obecnie zostawiane w seedzie jako pending do recznego testowania. Nie sa automatycznie domykane przez loader.

To jest swiadoma decyzja, zeby seed byl stabilny i nie przewracal calego importu na tym jednym rogu domenowym.
