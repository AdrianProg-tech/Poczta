# Dokumentacja frontendu — IV zajęcia

Projekt: **System zarządzania przesyłkami kurierskimi i pocztowymi**

Ten pakiet zawiera roboczą dokumentację analityczno-projektową frontendu na **IV zajęcia**.
Celem pakietu jest przygotowanie materiałów, które:

- nadają się do prezentacji,
- można trzymać w repozytorium,
- później łatwo przełożyć na implementację React + TypeScript,
- porządkują widoki, routing, moduły i architekturę komponentów.

## Zawartość

- `01-opis-frontendu.md` — opis części frontendowej
- `02-technologie-frontend.md` — technologie i uzasadnienie wyboru
- `03-architektura-komponentow.puml` — ogólna architektura komponentów
- `04-routes-and-views.md` — mapa widoków i routingu
- `05-moduly-i-role.md` — moduły aplikacji i role użytkowników
- `06-state-management.md` — założenia zarządzania stanem
- `07-screen-spec-public.md` — opis ekranów publicznych
- `08-screen-spec-client.md` — opis panelu klienta
- `09-screen-spec-courier.md` — opis panelu kuriera
- `10-screen-spec-point-worker.md` — opis panelu pracownika punktu
- `11-screen-spec-admin.md` — opis panelu administratora
- `12-api-integration-plan.md` — sposób komunikacji z backendem
- `wireframes/` — uproszczone makiety ekranów w formacie SVG

## Dlaczego taki format

- pliki `*.md` dobrze nadają się do Git i do dalszego rozwijania dokumentacji,
- pliki `*.puml` można łatwo eksportować do PNG/PDF,
- pliki `*.svg` można wykorzystać jako proste wireframe’y do prezentacji lub jako punkt startowy do Figma.

## Sposób użycia

1. Wrzucić katalog do repozytorium, np. do `docs/iv-zajecia/frontend/`.
2. Otworzyć plik `03-architektura-komponentow.puml` w PlantUML.
3. Wykorzystać pliki `07–11` jako bazę do dopracowania Figma.
4. Wireframe’y SVG potraktować jako prosty szkic układu ekranów.
5. Na ich podstawie zbudować routing, layouty i komponenty w React.
