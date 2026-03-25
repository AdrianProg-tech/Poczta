# Routing i widoki

## Część publiczna
- `/` — strona główna
- `/track` — śledzenie przesyłki
- `/points` — lista punktów i paczkomatów
- `/login` — logowanie

## Panel klienta
- `/client` — dashboard klienta
- `/client/shipments` — lista przesyłek
- `/client/shipments/:id` — szczegóły przesyłki
- `/client/shipments/new` — tworzenie przesyłki
- `/client/payments/:id` — płatność
- `/client/redirections/:shipmentId` — przekierowanie
- `/client/complaints` — lista reklamacji
- `/client/complaints/new` — nowa reklamacja
- `/client/profile` — profil użytkownika

## Panel kuriera
- `/courier` — dashboard kuriera
- `/courier/tasks` — lista zadań
- `/courier/tasks/:id` — szczegóły zadania
- `/courier/tasks/:id/action` — akcja kurierska

## Panel pracownika punktu
- `/point` — dashboard punktu
- `/point/accept` — przyjęcie przesyłki
- `/point/release` — wydanie przesyłki
- `/point/payment-verification` — weryfikacja płatności
- `/point/shipments` — przesyłki w punkcie

## Panel administratora
- `/admin` — dashboard administratora
- `/admin/users` — użytkownicy
- `/admin/points` — punkty i paczkomaty
- `/admin/shipments` — przesyłki
- `/admin/payments` — płatności
- `/admin/complaints` — reklamacje
- `/admin/reports` — raporty

## Założenia routingu
- część publiczna dostępna bez logowania,
- panele dostępne po zalogowaniu,
- dostęp do paneli ograniczony zależnie od roli,
- każdy panel korzysta ze wspólnego layoutu z nawigacją i nagłówkiem.
