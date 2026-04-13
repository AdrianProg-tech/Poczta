Zaprojektuj kompletny, nowoczesny i spójny wizualnie interfejs webowej aplikacji SPA dla systemu logistycznego o nazwie „PingwinPost”.

Jest to system zarządzania przesyłkami kurierskimi i pocztowymi. Aplikacja ma obsługiwać kilka ról użytkowników:
- klient
- kurier
- pracownik punktu
- administrator

Język całego interfejsu: polski.
Projekt ma być responsywny: przygotuj wersję desktopową i mobilną dla najważniejszych ekranów.
Styl ma być spójny, nowoczesny, prosty, profesjonalny i wiarygodny, jak nowoczesna firma logistyczna.
Nie projektuj interfejsu zabawnego ani dziecięcego — ma wyglądać jak realny produkt SaaS / system operacyjny dla firmy kurierskiej.

## Nazwa i branding
Nazwa marki: PingwinPost
Charakter marki: nowoczesna, przyjazna, technologiczna, uporządkowana, niezawodna

## Kolorystyka
Wybierz spójną paletę kolorów opartą o:
- kolor główny: chłodny granat lub ciemny niebieski
- kolor akcentu: turkus / morski
- kolor pomocniczy: jasny szary / off-white
- kolory statusów:
  - sukces: zielony
  - ostrzeżenie: bursztynowy
  - błąd: czerwony
  - informacyjny: niebieski

Zadbaj o dobry kontrast, czytelność i profesjonalny wygląd.
Użyj jednego spójnego design systemu:
- te same przyciski
- te same inputy
- te same badge statusów
- te same karty
- te same tabele
- te same nagłówki i odstępy

## Styl UI
- nowoczesny dashboard webowy
- delikatne rounded corners
- miękkie cienie
- przejrzyste sekcje
- czytelna typografia
- nacisk na usability
- dużo whitespace
- ikony liniowe
- czytelne status badges
- formularze mają być maksymalnie proste i uporządkowane

## Struktura aplikacji
Aplikacja ma mieć część publiczną i panele po zalogowaniu.

### Część publiczna
Zaprojektuj:
1. Strona główna
2. Śledzenie przesyłki
3. Lista punktów i paczkomatów
4. Logowanie

### Panel klienta
Zaprojektuj:
1. Dashboard klienta
2. Lista przesyłek
3. Szczegóły przesyłki
4. Kreator tworzenia przesyłki
5. Ekran płatności
6. Przekierowanie przesyłki do punktu lub paczkomatu
7. Reklamacje
8. Profil użytkownika

### Panel kuriera
Zaprojektuj:
1. Dashboard kuriera
2. Lista zadań
3. Szczegóły zadania
4. Formularz akcji kurierskiej

### Panel pracownika punktu
Zaprojektuj:
1. Dashboard punktu
2. Przyjęcie przesyłki
3. Wydanie przesyłki
4. Weryfikacja płatności
5. Lista przesyłek w punkcie

### Panel administratora
Zaprojektuj:
1. Dashboard administratora
2. Użytkownicy
3. Punkty i paczkomaty
4. Przesyłki
5. Płatności
6. Reklamacje
7. Raporty

## Wymagania funkcjonalne widoczne w UI
Interfejs ma uwzględniać:
- śledzenie przesyłki po numerze
- tworzenie przesyłki i etykiety
- płatność online
- statusy płatności
- statusy przesyłki
- przekierowanie przesyłki
- reklamację
- listy zadań kuriera
- operacje punktu odbioru / nadania
- zarządzanie systemem przez administratora

## Wymagania layoutowe
Desktop:
- sidebar + topbar dla paneli
- czytelny układ dashboardowy
- tabele i karty danych
- widoki formularzowe z sekcją podsumowania

Mobile:
- uproszczona nawigacja
- stacked layout
- zachowanie tych samych komponentów i stylu
- najważniejsze akcje widoczne bez chaosu

## Wymagania projektowe
- pokaż spójny design system
- użyj realistycznych polskich tekstów w UI
- użyj realistycznych nazw pól i statusów
- pokaż przykładowe dane przesyłek, punktów i płatności
- zachowaj spójność między wszystkimi ekranami
- przygotuj widoki tak, aby nadawały się później do implementacji w React + TypeScript
- projekt ma wyglądać jak gotowy produkt MVP dla firmy kurierskiej

## Dodatkowe wskazówki
Dla statusów używaj np.:
- Utworzona
- Opłacona
- Nadana
- W transporcie
- Wydana kurierowi
- Próba doręczenia
- Oczekuje na odbiór
- Doręczona
- Zwrócona

Dla płatności używaj np.:
- Oczekująca
- Opłacona
- Nieudana
- Anulowana
- Offline — do potwierdzenia

Wygeneruj cały system w jednym spójnym stylu wizualnym.
Najpierw pokaż strukturę i główne ekrany, a potem dopracuj kluczowe widoki:
- home
- tracking
- client dashboard
- shipment details
- create shipment
- courier dashboard
- point dashboard
- admin dashboard

Zadbaj o to, żeby projekt wyglądał profesjonalnie i nadawał się do prezentacji na uczelni.