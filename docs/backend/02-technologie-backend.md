# Technologie backendowe

| Technologia       | Rola w projekcie | Uzasadnienie wyboru |
|-------------------|---|---|
| Java 17           | język backendu | zgodny z wymaganiami IO i ISI, dobrze wspiera programowanie obiektowe |
| Spring Boot       | framework backendowy | szybkie budowanie REST API i konfiguracja aplikacji |
| Spring Web        | warstwa REST | implementacja kontrolerów i endpointów |
| Spring Data JPA   | warstwa dostępu do danych | wygodne mapowanie encji i relacji do bazy |
| Spring Security   | bezpieczeństwo i role | kontrola dostępu do endpointów i obsługa autoryzacji |
| Spring OAuth2 Client | logowanie przez Google | uwierzytelnianie przez zewnętrznego dostawcę (Google) |
| Spring AMQP / RabbitMQ | asynchroniczne powiadomienia | publikowanie zdarzeń zmiany statusu i wysyłka e-mail |
| Stripe Java SDK   | płatności online | integracja z sandbox Stripe — sesje checkout, weryfikacja i webhook |
| JavaMail / Spring Mail | e-mail | wysyłka potwierdzeń i powiadomień przez Maildev (lokalnie) |
| Oracle Database   | baza danych | zgodna z założeniami przedmiotu IO |
| Lombok            | redukcja boilerplate | uproszczenie modeli i DTO |
| Maven             | budowanie projektu | standardowe zarządzanie zależnościami |
| Swagger / SpringDoc OpenAPI | dokumentacja API | prezentacja i testowanie endpointów pod `/swagger-ui.html` |
| JUnit 5           | testy jednostkowe | standardowy framework testowy dla Java |
| Mockito           | mockowanie w testach | testowanie serwisów i logiki biznesowej |

## Uzasadnienie architektury

Wybrany zestaw technologii pozwala zrealizować:
- REST API z 21 kontrolerami i pełną dokumentacją Swagger,
- model klient–serwer z separacją ról (klient, kurier, pracownik punktu, admin),
- pracę z relacyjną bazą danych Oracle,
- logikę obiektową i wzorce projektowe (Facade, Strategy, Repository),
- asynchroniczne przetwarzanie powiadomień przez RabbitMQ,
- uwierzytelnianie przez OAuth2 (Google) i własny mechanizm Bearer token,
- integrację z systemem płatności Stripe (tryb sandbox).
