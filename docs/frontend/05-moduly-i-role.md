# Moduły aplikacji i role użytkowników

## Moduły
1. **Public**
   - landing page,
   - tracking,
   - punkty i paczkomaty,
   - logowanie.

2. **Client**
   - dashboard klienta,
   - przesyłki,
   - płatności,
   - przekierowania,
   - reklamacje,
   - profil.

3. **Courier**
   - dashboard kuriera,
   - lista zadań,
   - szczegóły zadania,
   - akcje kurierskie.

4. **Point**
   - dashboard punktu,
   - przyjęcie przesyłki,
   - wydanie przesyłki,
   - płatności,
   - lista przesyłek w punkcie.

5. **Admin**
   - dashboard,
   - użytkownicy,
   - punkty,
   - przesyłki,
   - reklamacje,
   - płatności,
   - raporty.

## Role i dostęp

| Rola | Zakres widoków |
|---|---|
| Gość | część publiczna |
| Klient | public + panel klienta |
| Kurier | public + panel kuriera |
| Pracownik punktu | public + panel punktu |
| Administrator | public + panel administratora |

## Założenia UX
- każda rola widzi tylko potrzebne funkcje,
- wspólne komponenty i styl dla całego systemu,
- maksymalnie proste i czytelne formularze,
- nacisk na szybki dostęp do najczęstszych akcji.
