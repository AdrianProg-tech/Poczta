# Założenia zarządzania stanem

## Wybrane podejście
Zakładamy użycie **Redux Toolkit** jako głównego rozwiązania do zarządzania stanem aplikacji.

## Dlaczego Redux Toolkit
- dobrze nadaje się do większej aplikacji z wieloma rolami,
- ułatwia współpracę kilku osób w zespole,
- pozwala logicznie podzielić stan na moduły,
- dobrze współpracuje z TypeScript.

## Proponowane slice'y
- `authSlice` — informacje o zalogowanym użytkowniku i roli
- `shipmentsSlice` — lista przesyłek, szczegóły, tracking
- `paymentsSlice` — dane płatności i ich statusy
- `complaintsSlice` — reklamacje
- `pointsSlice` — punkty i paczkomaty
- `notificationsSlice` — komunikaty i alerty systemowe
- `uiSlice` — loading, modale, stan poboczny UI

## Dane lokalne vs globalne
### Globalne
- auth i profil użytkownika
- lista przesyłek
- dane punktów
- statusy płatności
- reklamacje
- powiadomienia

### Lokalne
- stan pól formularza
- stan modali
- filtry tabel
- stan kroków kreatora tworzenia przesyłki

## Etap IV
Na IV zajęcia ten dokument jest założeniem architektonicznym.
Implementacja store i integracja widoków ze stanem planowana jest na późniejszy etap.
