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
- Axios jako główny klient HTTP,
- jeden centralny plik konfiguracyjny API,
- później interceptory do obsługi błędów i autoryzacji,
- typowane requesty i response’y w TypeScript.

## Etap IV
Na IV zajęcia wystarczy przygotowanie struktury i założeń.
Pełna integracja z backendem planowana jest na dalszy etap projektu.
