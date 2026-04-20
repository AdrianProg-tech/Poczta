# Projekt na zaliczenie

## Uruchomienie projektu

### Backend

Wymagania:
- Docker
- Java 17
- IntelliJ IDEA lub inne IDE z obsługą Lombok

Konfiguracja IDE:
- zainstaluj wtyczkę `Lombok`
- włącz `Annotation Processing`

1. Uruchom bazę danych:

```powershell
cd H:\poczta
docker compose up -d oracle-db
docker compose ps
```

2. Uruchom backend:

```powershell
cd H:\poczta\backend\poczta-backend
.\mvnw.cmd spring-boot:run
```

Backend uruchamia się na `http://localhost:8081`.
'http://localhost:8081/swagger-ui.html'
Przydatne komendy:

```powershell
docker compose logs -f oracle-db
docker compose down
```

### Frontend

Wymagania:
- Node.js
- npm

1. Zainstaluj zależności:

```powershell
cd H:\poczta\frontend
npm install
```

2. Uruchom frontend:

```powershell
cd H:\poczta\frontend
npm run dev
```

Frontend będzie zwykle dostępny pod adresem `http://localhost:5173`.
