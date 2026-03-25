# Technologie backendowe

| Technologia | Rola w projekcie | Uzasadnienie wyboru |
|---|---|---|
| Java 21 | język backendu | zgodny z wymaganiami IO i ISI, dobrze wspiera programowanie obiektowe |
| Spring Boot | framework backendowy | szybkie budowanie REST API i konfiguracja aplikacji |
| Spring Web | warstwa REST | implementacja kontrolerów i endpointów |
| Spring Data JPA | warstwa dostępu do danych | wygodne mapowanie encji i relacji do bazy |
| Spring Security | bezpieczeństwo i role | kontrola dostępu do endpointów i obsługa autoryzacji |
| Oracle Database | baza danych | zgodna z założeniami przedmiotu IO |
| Lombok | redukcja boilerplate | uproszczenie modeli i DTO |
| Maven | budowanie projektu | standardowe zarządzanie zależnościami |
| Swagger / OpenAPI | dokumentacja API | szybka prezentacja i testowanie endpointów |
| JUnit 5 | testy jednostkowe | standardowy framework testowy dla Java |
| Mockito | mockowanie w testach | testowanie serwisów i logiki biznesowej |

## Technologie planowane na dalszy etap

| Technologia | Planowane zastosowanie |
|---|---|
| OAuth2 / Google Login | logowanie użytkowników przez zewnętrznego dostawcę |
| RabbitMQ lub Kafka | asynchroniczne przetwarzanie powiadomień i zdarzeń |
| System płatności sandbox | płatności online za przesyłki |
| Flyway | wersjonowanie migracji bazy danych |
| Testcontainers | testy integracyjne z bazą danych |

## Uzasadnienie architektury
Wybrany zestaw technologii pozwala zrealizować:
- REST API,
- model klient–serwer,
- pracę z relacyjną bazą danych,
- logikę obiektową i wzorce projektowe,
- późniejsze dodanie asynchroniczności, OAuth2 i płatności.
