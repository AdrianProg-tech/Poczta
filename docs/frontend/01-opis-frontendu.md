# Opis frontendu

## Nazwa projektu
System zarządzania przesyłkami kurierskimi i pocztowymi

## Cel frontendu
Frontend ma zapewnić użytkownikom wygodny dostęp do wszystkich kluczowych funkcji systemu przez przeglądarkę internetową.
Aplikacja będzie zrealizowana jako **web SPA**, responsywna i dostosowana do różnych ról użytkowników.

## Główne założenia
- jedna aplikacja frontendowa obsługująca część publiczną i panele użytkowników,
- różne widoki i nawigacja zależne od roli,
- komunikacja z backendem przez REST API,
- możliwość późniejszego rozwinięcia o i18n, themes i interceptory,
- architektura komponentowa ułatwiająca rozwój i testowanie.

## Role użytkowników
- **Klient** — tworzy przesyłki, opłaca je, śledzi status, przekierowuje przesyłkę, zgłasza reklamację.
- **Kurier** — przegląda przypisane zadania, rejestruje próbę doręczenia, wystawia awizo, oznacza doręczenie.
- **Pracownik punktu** — przyjmuje i wydaje przesyłki, sprawdza płatności, obsługuje przesyłki w punkcie.
- **Administrator** — zarządza użytkownikami, punktami, reklamacjami, płatnościami i raportami.

## Główne części aplikacji
1. **Część publiczna**
   - strona główna,
   - śledzenie przesyłki,
   - lista punktów i paczkomatów,
   - logowanie.

2. **Panel klienta**
   - dashboard,
   - lista przesyłek,
   - szczegóły przesyłki,
   - tworzenie przesyłki,
   - płatność,
   - przekierowanie,
   - reklamacje.

3. **Panel kuriera**
   - dashboard,
   - lista zadań,
   - szczegóły zadania,
   - formularze akcji kurierskich.

4. **Panel pracownika punktu**
   - dashboard punktu,
   - przyjęcie przesyłki,
   - wydanie przesyłki,
   - weryfikacja płatności,
   - lista przesyłek w punkcie.

5. **Panel administratora**
   - dashboard,
   - użytkownicy,
   - punkty i paczkomaty,
   - przesyłki,
   - płatności,
   - reklamacje,
   - raporty.

## Zakres na IV zajęcia
Na IV zajęcia przygotowywana jest analiza frontendowa obejmująca:
- wykorzystywane technologie,
- architekturę komponentów,
- routing i widoki,
- opis ekranów,
- uproszczone wireframe’y stanowiące bazę pod Figma.
