# Testowanie płatności kartą – Stripe Sandbox

Integracja z systemem płatności Stripe działa w trybie testowym (sandbox).
Żadne prawdziwe pieniądze nie są pobierane. Do testów służą specjalne numery kart.

---

## Jak przetestować płatność

### 1. Utwórz przesyłkę z płatnością online

1. Zaloguj się jako **Klient** (`jan.kowalski.client@example.com` / `demo1234`)
2. Przejdź do **Moje przesyłki → Nadaj przesyłkę**
3. Wypełnij formularz i wybierz metodę płatności **Online (Stripe)**
4. Po utworzeniu przesyłki wejdź w jej szczegóły
5. Kliknij przycisk **„Zapłać przez Stripe"**

---

## Scenariusz pozytywny – płatność zakończona sukcesem

Na stronie Stripe wpisz:

| Pole | Wartość |
|------|---------|
| Numer karty | `4242 4242 4242 4242` |
| Data ważności | dowolna przyszła (np. `12/29`) |
| CVC | dowolne 3 cyfry (np. `123`) |
| Imię | dowolne |

**Oczekiwany wynik:**
- Stripe przekierowuje z powrotem do aplikacji
- Pojawia się zielony komunikat: *„Płatność zakończona sukcesem"*
- Status płatności zmienia się na **Opłacona**
- Status przesyłki zmienia się na **Opłacona**

---

## Scenariusze negatywne – odrzucenie płatności

### Niewystarczające środki na koncie

| Pole | Wartość |
|------|---------|
| Numer karty | `4000 0000 0000 9995` |
| Data ważności | dowolna przyszła |
| CVC | dowolne 3 cyfry |

**Oczekiwany wynik:**
- Stripe wyświetla błąd: *„Your card has insufficient funds"*
- Płatność nie zostaje pobrana
- Po powrocie do aplikacji pojawia się czerwony komunikat: *„Płatność została anulowana lub odrzucona"*
- Status płatności pozostaje **Oczekująca**
- Można spróbować ponownie

---

### Karta odrzucona (ogólne odrzucenie)

| Pole | Wartość |
|------|---------|
| Numer karty | `4000 0000 0000 0002` |
| Data ważności | dowolna przyszła |
| CVC | dowolne 3 cyfry |

**Oczekiwany wynik:**
- Stripe wyświetla błąd: *„Your card was declined"*
- Płatność nie zostaje pobrana

---

### Anulowanie przez użytkownika

1. Na stronie Stripe kliknij przycisk **„Wróć"** lub zamknij stronę
2. Aplikacja przekierowuje z powrotem do szczegółów przesyłki
3. Pojawia się komunikat: *„Płatność została anulowana lub odrzucona"*
4. Status płatności pozostaje **Oczekująca** – można ponowić

---

## Pełna lista testowych kart Stripe

| Numer karty | Wynik |
|-------------|-------|
| `4242 4242 4242 4242` | ✅ Płatność zakończona sukcesem |
| `4000 0000 0000 9995` | ❌ Niewystarczające środki |
| `4000 0000 0000 0002` | ❌ Karta odrzucona |
| `4000 0000 0000 9987` | ❌ Adres karty niezgodny |
| `4000 0000 0000 0069` | ❌ Karta wygasła |
| `4000 0000 0000 0127` | ❌ Nieprawidłowy kod CVC |

> Przy wszystkich kartach testowych data ważności i CVC mogą być dowolne (ale data musi być przyszła).

---

## Uwagi techniczne

- Tryb sandbox jest aktywny dopóki klucz w `application.properties` zaczyna się od `sk_test_`
- Żadna transakcja testowa nie pojawi się na wyciągu bankowym
- Historia transakcji testowych jest widoczna w panelu Stripe: [dashboard.stripe.com/test/payments](https://dashboard.stripe.com/test/payments)
