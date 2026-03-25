# Status matrix

## 1. Statusy przesyłki

| Status | Opis | Dozwolone przejścia |
|---|---|---|
| CREATED | przesyłka utworzona, jeszcze nieopłacona | PAID, CANCELED |
| PAID | płatność poprawna | READY_FOR_POSTING |
| READY_FOR_POSTING | gotowa do nadania | POSTED |
| POSTED | nadana w punkcie lub paczkomacie | IN_TRANSIT |
| IN_TRANSIT | w transporcie | OUT_FOR_DELIVERY, AWAITING_PICKUP |
| OUT_FOR_DELIVERY | wydana kurierowi | DELIVERED, DELIVERY_ATTEMPT, RETURNED |
| DELIVERY_ATTEMPT | nieudana próba doręczenia | AWAITING_PICKUP, RETURNED |
| AWAITING_PICKUP | czeka na odbiór w punkcie / paczkomacie | DELIVERED, RETURNED |
| DELIVERED | doręczona lub odebrana | — |
| RETURNED | zwrócona do nadawcy | — |
| CANCELED | anulowana przed nadaniem | — |

## 2. Statusy płatności

| Status | Opis | Dozwolone przejścia |
|---|---|---|
| PENDING | płatność rozpoczęta, niepotwierdzona | PAID, FAILED, CANCELED |
| PAID | płatność zakończona sukcesem | — |
| FAILED | płatność nieudana | PENDING |
| CANCELED | płatność anulowana | PENDING |
| OFFLINE_PENDING | oczekuje na ręczne potwierdzenie | OFFLINE_CONFIRMED, FAILED |
| OFFLINE_CONFIRMED | płatność offline potwierdzona | — |

## 3. Statusy reklamacji

| Status | Opis | Dozwolone przejścia |
|---|---|---|
| SUBMITTED | reklamacja zgłoszona przez klienta | IN_REVIEW |
| IN_REVIEW | reklamacja analizowana | ACCEPTED, REJECTED |
| ACCEPTED | reklamacja uznana | CLOSED |
| REJECTED | reklamacja odrzucona | CLOSED |
| CLOSED | sprawa zakończona | — |

## 4. Uwagi projektowe

- W implementacji backendu statusy powinny być reprezentowane przez **enumy**.
- Przejścia między statusami powinny być walidowane w warstwie serwisowej.
- Dla kluczowych przejść warto przygotować osobne testy jednostkowe.
- Statusy mogą zostać rozszerzone na późniejszym etapie projektu, jeśli pojawią się dodatkowe scenariusze biznesowe.
