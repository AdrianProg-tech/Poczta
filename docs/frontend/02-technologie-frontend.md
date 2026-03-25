# Technologie frontendowe

| Technologia | Rola w projekcie | Uzasadnienie wyboru |
|---|---|---|
| React | framework UI | komponentowa budowa aplikacji SPA |
| TypeScript | typowanie kodu | większa czytelność i bezpieczeństwo przy rozbudowanym systemie |
| Vite | narzędzie build/development | szybki start projektu i wygodna konfiguracja |
| React Router | routing aplikacji | obsługa części publicznej i paneli zależnych od roli |
| Redux Toolkit | state management | centralne zarządzanie stanem przesyłek, auth i płatności |
| Axios | komunikacja z API | wygodna integracja z backendem REST |
| React Hook Form | formularze | wygodna obsługa złożonych formularzy |
| Zod | walidacja danych formularzy | czytelna walidacja po stronie frontendu |
| Tailwind CSS | stylowanie | szybkie budowanie spójnego, responsywnego interfejsu |
| Lucide / Heroicons | ikony | czytelne oznaczenie akcji i statusów |
| Vitest + React Testing Library | testy komponentów | przygotowanie pod wymagania ZAF |
| ESLint + Prettier | jakość kodu | ujednolicenie stylu kodu w zespole |

## Technologie planowane na dalszy etap

| Technologia | Planowane zastosowanie |
|---|---|
| i18next | internacjonalizacja interfejsu |
| theme provider | obsługa motywów jasny/ciemny |
| Axios interceptors | obsługa tokenów, błędów i odpowiedzi API |
| Cypress / Playwright | testy E2E |
| TanStack Query (opcjonalnie) | cache danych serwerowych |

## Uzasadnienie architektury
Zestaw technologii pozwala zrealizować:
- cienkiego klienta SPA,
- rozbudowany routing,
- formularze z walidacją,
- rozdział na moduły i role,
- łatwe połączenie z backendem Java,
- przygotowanie pod dalsze funkcje wymagane na kolejnych etapach projektu.
