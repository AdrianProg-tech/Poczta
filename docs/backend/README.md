# Dokumentacja backendu — IV zajęcia

Projekt: **System zarządzania przesyłkami kurierskimi i pocztowymi**

Ten pakiet zawiera roboczą dokumentację analityczno-projektową backendu na **IV zajęcia**.
Struktura została przygotowana tak, aby:

- nadawała się do prezentacji,
- dało się ją trzymać w repozytorium,
- później łatwo przełożyć ją na kod.

## Zawartość

- `01-opis-backendu.md` — opis backendu i zakresu systemu
- `02-technologie-backend.md` — technologie i uzasadnienie wyboru
- `03-architektura-systemu.puml` — ogólna architektura systemu
- `04-erd.puml` — ERD v1
- `05-uml-use-case.puml` — diagram przypadków użycia
- `06-uml-class-overview.puml` — ogólny diagram klas domenowych
- `07-uml-class-users-roles.puml` — moduł użytkowników i ról
- `08-uml-class-shipments-tracking.puml` — moduł przesyłek i śledzenia
- `09-uml-class-delivery-network.puml` — moduł sieci doręczeń
- `10-uml-class-payments-complaints.puml` — moduł płatności i reklamacji
- `11-activity-create-shipment-payment.puml` — activity: utworzenie przesyłki i płatność
- `12-activity-redirection.puml` — activity: przekierowanie przesyłki
- `13-activity-delivery-failure-return.puml` — activity: nieudane doręczenie i zwrot
- `14-status-matrix.md` — statusy i dozwolone przejścia

## Dlaczego PlantUML

Pliki `*.puml` są tekstowe, więc:
- dobrze nadają się do Git,
- łatwo je poprawiać,
- można je później eksportować do PNG/PDF,
- da się je rozwijać razem z projektem.

## Sposób użycia

1. Wrzucić cały katalog do repozytorium, np. do `docs/iv-zajecia/backend/`.
2. Otworzyć pliki `*.puml` w PlantUML / IntelliJ / VS Code plugin.
3. Wygenerować PNG albo PDF do prezentacji.
4. W razie potrzeby dopracować nazwy, atrybuty i relacje już pod implementację.
