# Plan integracji frontendu z backendem

## Założenia
Frontend komunikuje się z backendem wyłącznie przez REST API.
Po stronie frontendu należy oddzielić:
- warstwę widoków,
- warstwę logiki UI,
- warstwę komunikacji z API.

## Proponowana struktura
- `api/` — pliki z definicjami wywołań HTTP
- `store/` — slice'y i akcje
- `pages/` — widoki
- `components/` — komponenty współdzielone
- `features/` — logika per moduł

## Główne obszary komunikacji
- auth i profil użytkownika,
- przesyłki i tracking,
- płatności,
- punkty i paczkomaty,
- reklamacje,
- zadania kuriera,
- operacje punktowe,
- raporty admina.

## Założenia techniczne
- Fetch API jako klient HTTP (bez dodatkowych zależności),
- jeden centralny plik `api.ts` z typowanymi funkcjami,
- interceptory Bearer token — każde żądanie zawiera nagłówek `Authorization`,
- typowane requesty i response’y w TypeScript.

## Stan realizacji
Integracja z backendem jest w pełni zrealizowana. Plik `src/app/api.ts` zawiera wszystkie wywołania API dla każdej roli użytkownika.
