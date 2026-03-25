# Opis backendu

## Nazwa projektu
System zarządzania przesyłkami kurierskimi i pocztowymi

## Cel backendu
Backend odpowiada za logikę biznesową systemu obsługującego pełny cykl życia przesyłki: od utworzenia etykiety i płatności, przez nadanie, śledzenie i doręczenie, aż po przekierowanie, odbiór w punkcie lub paczkomacie, reklamację i zwrot.

## Główne role systemowe
- **Klient** — tworzy przesyłki, opłaca je, śledzi status, zgłasza reklamację, przekierowuje przesyłkę.
- **Kurier** — obsługuje doręczenia, rejestruje próby doręczenia, wystawia awizo, inicjuje zwrot.
- **Pracownik punktu** — przyjmuje przesyłki, wydaje przesyłki, weryfikuje płatności i obsługuje punkt.
- **Administrator** — zarządza użytkownikami, punktami, reklamacjami, raportami i konfiguracją systemu.

## Główne moduły backendu
1. Użytkownicy i role
2. Przesyłki i etykiety
3. Zdarzenia śledzenia i statusy
4. Punkty nadania, odbioru i paczkomaty
5. Doręczenia kurierskie
6. Płatności
7. Reklamacje
8. Zwroty i przekierowania
9. Raporty i administracja

## Główne procesy biznesowe
- utworzenie przesyłki i etykiety,
- opłacenie przesyłki,
- nadanie przesyłki w punkcie lub paczkomacie,
- śledzenie przesyłki po numerze,
- przekierowanie przesyłki do innego punktu / paczkomatu,
- doręczenie przez kuriera,
- wydanie przesyłki w punkcie,
- zgłoszenie i obsługa reklamacji,
- zwrot przesyłki,
- generowanie podstawowych raportów administracyjnych.

## Założenia architektoniczne
Backend będzie zrealizowany jako aplikacja **Java + Spring Boot** udostępniająca **REST API**.
Dane będą przechowywane w **Oracle Database**.
Architektura ma być zgodna z wymaganiami przedmiotów ISI i IO:
- klient–serwer,
- warstwa REST,
- logika biznesowa w serwisach,
- model domenowy oparty na klasach,
- możliwość rozbudowy o OAuth2, płatności sandbox i kolejki komunikatów.

## Zakres na IV zajęcia
Na IV zajęcia przygotowywana jest analiza systemu obejmująca:
- architekturę backendu,
- technologie,
- model danych (ERD),
- diagram przypadków użycia,
- diagramy klas,
- diagramy aktywności,
- statusy procesów.
