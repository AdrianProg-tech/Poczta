# Technologie frontendowe

| Technologia | Rola w projekcie | Uzasadnienie wyboru |
|---|---|---|
| React | framework UI | komponentowa budowa aplikacji SPA |
| TypeScript | typowanie kodu | większa czytelność i bezpieczeństwo przy rozbudowanym systemie |
| Vite | narzędzie build/development | szybki start projektu i wygodna konfiguracja |
| React Router | routing aplikacji | obsługa części publicznej i paneli zależnych od roli |
| Context API + useReducer | state management | centralne zarządzanie stanem uwierzytelnienia i sesji |
| Fetch API | komunikacja z API | natywna integracja z backendem REST, bez dodatkowych zależności |
| React Hook Form | formularze | wygodna obsługa złożonych formularzy z walidacją |
| Tailwind CSS | stylowanie | szybkie budowanie spójnego, responsywnego interfejsu |
| next-themes | obsługa motywów | przełączanie jasny/ciemny bez migotania (ThemeProvider) |
| react-i18next | internacjonalizacja | obsługa wielu języków (PL + EN) z przełącznikiem w UI |
| Lucide Icons | ikony | czytelne oznaczenie akcji i statusów |
| Vitest + React Testing Library | testy komponentów | pokrycie kluczowych komponentów zgodnie z wymaganiami ZAF |
| ESLint + Prettier | jakość kodu | ujednolicenie stylu kodu |

## Uzasadnienie architektury

Zestaw technologii pozwala zrealizować:
- cienkiego klienta SPA z separacją warstw (routing, state, widoki),
- rozbudowany routing z ochroną tras (Protected Routes) i przekierowaniami ról,
- formularze z walidacją po stronie klienta,
- bezpośrednią integrację z backendem Java przez Fetch API z interceptorami Bearer token,
- internacjonalizację UI (PL/EN) i obsługę motywów jasny/ciemny,
- integrację z Stripe Checkout (przekierowanie na stronę płatności i weryfikacja po powrocie).
