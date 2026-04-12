"# Projekt na zaliczenie"

# install docker DB
docker compose up -d oracle-db
# check docker status
docker compose ps
# check logs 
docker compose logs -f oracle-db

# uninstall docker DB
docker compose down

# rebuild 
cd H:\poczta\backend\poczta-backend
.\mvnw.cmd clean compile
