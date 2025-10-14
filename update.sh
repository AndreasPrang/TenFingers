#!/bin/bash

# TenFingers - Production Update Script
# Dieses Script aktualisiert einen bereits laufenden TenFingers Service in Production

set -e  # Bei Fehler abbrechen

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║                                                   ║"
echo "║        TenFingers Production Update Script       ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Funktion für Success-Meldungen
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Funktion für Error-Meldungen
error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# Funktion für Info-Meldungen
info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# Prüfe ob Script als Root läuft
if [ "$EUID" -ne 0 ]; then
    error "Bitte führe dieses Script als root aus (sudo ./update.sh)"
fi

# Standard-Verzeichnis
WORK_DIR="/var/www/TenFingers"

# Prüfe ob Verzeichnis existiert
if [ ! -d "$WORK_DIR" ]; then
    error "TenFingers ist nicht in $WORK_DIR installiert. Bitte führe zuerst deploy.sh aus."
fi

cd $WORK_DIR

# Prüfe ob docker-compose läuft
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    error "Docker Container scheinen nicht zu laufen. Bitte prüfe den Status mit: docker-compose -f docker-compose.prod.yml ps"
fi

# ======================
# 1. Backup erstellen (optional aber empfohlen)
# ======================
echo -e "${YELLOW}"
read -p "Möchtest du vor dem Update ein Datenbank-Backup erstellen? (empfohlen) (j/n): " CREATE_BACKUP
echo -e "${NC}"

if [ "$CREATE_BACKUP" = "j" ] || [ "$CREATE_BACKUP" = "J" ]; then
    info "Erstelle Datenbank-Backup..."
    BACKUP_DIR="/var/backups/tenfingers"
    mkdir -p $BACKUP_DIR
    DATE=$(date +%Y%m%d_%H%M%S)

    if docker exec tenfingers-postgres pg_dump -U tenfingers_user tenfingers > "$BACKUP_DIR/backup_before_update_$DATE.sql"; then
        success "Backup erstellt: $BACKUP_DIR/backup_before_update_$DATE.sql"
    else
        error "Backup fehlgeschlagen. Update wird abgebrochen."
    fi
fi

# ======================
# 2. Git Repository aktualisieren
# ======================
info "Aktualisiere Code aus Git Repository..."
git fetch origin

# Zeige verfügbare Tags
echo -e "${YELLOW}"
echo "Verfügbare Versionen:"
git tag -l | tail -10
echo ""
echo "Aktueller Branch/Tag: $(git describe --tags --always)"
echo -e "${NC}"

echo -e "${YELLOW}"
read -p "Welchen Branch/Tag möchtest du deployen? (z.B. 'main', 'v1.0.0') [main]: " GIT_REF
GIT_REF=${GIT_REF:-main}
echo -e "${NC}"

info "Wechsle zu $GIT_REF..."
git checkout $GIT_REF
git pull origin $GIT_REF || git pull || true
success "Code aktualisiert auf $GIT_REF"

# ======================
# 3. Docker Image Version wählen
# ======================

# Finde die richtige .env Datei (entweder .env oder .env.production)
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE=".env.production"
fi

if [ ! -f "$ENV_FILE" ]; then
    error "Keine .env Datei gefunden! Bitte erstelle .env oder .env.production"
fi

echo -e "${YELLOW}"
echo "Welche Docker Image Version möchtest du deployen?"
echo "  - 'latest' für die neueste Version vom main Branch"
echo "  - Eine spezifische Version wie 'v1.0.0'"
if grep -q "^IMAGE_TAG=" $ENV_FILE 2>/dev/null; then
    echo "  - Aktuell konfiguriert: $(grep '^IMAGE_TAG=' $ENV_FILE | cut -d= -f2)"
else
    echo "  - Aktuell: IMAGE_TAG nicht gesetzt"
fi
read -p "Image Tag [latest]: " IMAGE_TAG
IMAGE_TAG=${IMAGE_TAG:-latest}
echo -e "${NC}"

# Aktualisiere IMAGE_TAG in der .env Datei
if grep -q "^IMAGE_TAG=" $ENV_FILE; then
    sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$IMAGE_TAG/" $ENV_FILE
    success "IMAGE_TAG in $ENV_FILE auf '$IMAGE_TAG' gesetzt"
else
    echo "IMAGE_TAG=$IMAGE_TAG" >> $ENV_FILE
    success "IMAGE_TAG in $ENV_FILE hinzugefügt: '$IMAGE_TAG'"
fi

# ======================
# 4. Environment-Variablen laden
# ======================
info "Lade Environment-Variablen aus $ENV_FILE..."
set -a
source $ENV_FILE
set +a
success "Environment-Variablen geladen"

# ======================
# 5. Docker Images aktualisieren
# ======================
info "Lade neue Docker Images von GitHub Container Registry..."
info "Backend:  ghcr.io/andreasprang/tenfingers-backend:$IMAGE_TAG"
info "Frontend: ghcr.io/andreasprang/tenfingers-frontend:$IMAGE_TAG"

if docker-compose -f docker-compose.prod.yml pull; then
    success "Docker Images erfolgreich geladen"
else
    error "Fehler beim Laden der Docker Images. Stelle sicher, dass die Images existieren."
fi

# ======================
# 6. Services neustarten
# ======================
info "Starte Services neu mit neuen Images..."
info "Dies kann einige Sekunden dauern..."

docker-compose -f docker-compose.prod.yml up -d --remove-orphans

success "Services werden neu gestartet"

# ======================
# 7. Auf gesunde Container warten
# ======================
info "Warte auf Container-Start (max. 60 Sekunden)..."

TIMEOUT=60
ELAPSED=0

while [ $ELAPSED -lt $TIMEOUT ]; do
    HEALTHY_COUNT=$(docker-compose -f docker-compose.prod.yml ps | grep "(healthy)" | wc -l)
    RUNNING_COUNT=$(docker-compose -f docker-compose.prod.yml ps | grep "Up" | wc -l)

    if [ $RUNNING_COUNT -ge 3 ]; then
        success "Container laufen erfolgreich"
        break
    fi

    echo -n "."
    sleep 2
    ELAPSED=$((ELAPSED + 2))
done

echo ""

# ======================
# 8. Status anzeigen
# ======================
info "Aktueller Container-Status:"
docker-compose -f docker-compose.prod.yml ps

# ======================
# 9. Health Check
# ======================
info "Prüfe Service-Verfügbarkeit..."

sleep 5

# Backend Health Check
if curl -f -s http://localhost/api/health > /dev/null; then
    success "Backend ist erreichbar (http://localhost/api/health)"
else
    error "Backend Health Check fehlgeschlagen!"
fi

# Frontend Check
if curl -f -s http://localhost > /dev/null; then
    success "Frontend ist erreichbar (http://localhost)"
else
    error "Frontend Check fehlgeschlagen!"
fi

# ======================
# 10. Logs anzeigen (letzte 50 Zeilen)
# ======================
echo -e "${YELLOW}"
read -p "Möchtest du die aktuellen Logs anzeigen? (j/n): " SHOW_LOGS
echo -e "${NC}"

if [ "$SHOW_LOGS" = "j" ] || [ "$SHOW_LOGS" = "J" ]; then
    info "Zeige letzte 50 Log-Zeilen..."
    docker-compose -f docker-compose.prod.yml logs --tail=50
fi

# ======================
# Fertig!
# ======================
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║                                                   ║"
echo "║          Update erfolgreich! 🎉                   ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${BLUE}Zusammenfassung:${NC}"
echo ""
echo "  Git Version:     $GIT_REF"
echo "  Docker Tag:      $IMAGE_TAG"
echo "  Backend Image:   ghcr.io/andreasprang/tenfingers-backend:$IMAGE_TAG"
echo "  Frontend Image:  ghcr.io/andreasprang/tenfingers-frontend:$IMAGE_TAG"
echo ""
echo -e "${BLUE}Nützliche Befehle:${NC}"
echo ""
echo "  Logs verfolgen:        docker-compose -f docker-compose.prod.yml logs -f"
echo "  Container-Status:      docker-compose -f docker-compose.prod.yml ps"
echo "  Services neustarten:   docker-compose -f docker-compose.prod.yml restart"
echo "  Container stoppen:     docker-compose -f docker-compose.prod.yml down"
echo ""
echo -e "${YELLOW}Bei Problemen: Prüfe die Logs mit 'docker-compose -f docker-compose.prod.yml logs -f'${NC}"
echo ""
