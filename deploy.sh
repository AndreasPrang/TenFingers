#!/bin/bash

# TenFingers - Deployment Script für VPS
# Dieses Script automatisiert das Deployment auf einem frisch aufgesetzten Ubuntu VPS

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
echo "║          TenFingers VPS Deployment Script        ║"
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
    error "Bitte führe dieses Script als root aus (sudo ./deploy.sh)"
fi

# ======================
# 1. System aktualisieren
# ======================
info "Aktualisiere System..."
apt update && apt upgrade -y
success "System aktualisiert"

# ======================
# 2. Docker installieren
# ======================
if ! command -v docker &> /dev/null; then
    info "Installiere Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    success "Docker installiert"
else
    success "Docker bereits installiert"
fi

# ======================
# 3. Docker Compose installieren
# ======================
if ! command -v docker-compose &> /dev/null; then
    info "Installiere Docker Compose..."
    apt install docker-compose -y
    success "Docker Compose installiert"
else
    success "Docker Compose bereits installiert"
fi

# ======================
# 4. Firewall konfigurieren
# ======================
if command -v ufw &> /dev/null; then
    info "Konfiguriere Firewall (ufw)..."
    ufw allow OpenSSH
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    success "Firewall konfiguriert"
else
    info "UFW nicht gefunden, überspringe Firewall-Konfiguration"
    echo -e "${YELLOW}Hinweis: Stelle sicher, dass die Ports 22, 80 und 443 in deiner Firewall geöffnet sind${NC}"
fi

# ======================
# 5. Arbeitsverzeichnis erstellen
# ======================
info "Erstelle Arbeitsverzeichnis..."
mkdir -p /var/www
cd /var/www
success "Arbeitsverzeichnis erstellt"

# ======================
# 6. Repository klonen
# ======================
if [ -d "/var/www/TenFingers" ]; then
    info "Repository existiert bereits. Aktualisiere..."
    cd /var/www/TenFingers
    git pull origin main
    success "Repository aktualisiert"
else
    info "Klone Repository..."
    git clone https://github.com/AndreasPrang/TenFingers.git
    cd /var/www/TenFingers
    success "Repository geklont"
fi

# ======================
# 7. Domain abfragen
# ======================
echo -e "${YELLOW}"
read -p "Gib deine Domain ein (z.B. example.com): " DOMAIN
echo -e "${NC}"

# ======================
# 8. Environment-Variablen erstellen/prüfen
# ======================
if [ ! -f "/var/www/TenFingers/.env.production" ]; then
    info "Erstelle .env.production mit sicheren Credentials..."

    # Generiere sichere Passwörter (hex statt base64 - keine Sonderzeichen)
    DB_PASSWORD=$(openssl rand -hex 32)
    JWT_SECRET=$(openssl rand -hex 64)

    # Erstelle .env.production
    cat > /var/www/TenFingers/.env.production <<EOF
# TenFingers Production Environment
# Automatisch generiert am $(date)

# Docker Image Version
IMAGE_TAG=latest

# PostgreSQL Datenbank
DB_HOST=postgres
DB_PORT=5432
DB_NAME=tenfingers
DB_USER=tenfingers_user
DB_PASSWORD=$DB_PASSWORD

# JWT Secret
JWT_SECRET=$JWT_SECRET

# Server Konfiguration
PORT=4000
NODE_ENV=production

# URLs (basierend auf deiner Domain: $DOMAIN)
FRONTEND_URL=https://$DOMAIN
REACT_APP_API_URL=https://$DOMAIN/api
EOF

    success ".env.production erstellt mit sicheren Credentials!"
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  WICHTIG: Speichere diese Credentials sicher!                ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}DB_PASSWORD:${NC} $DB_PASSWORD"
    echo -e "${BLUE}JWT_SECRET:${NC}  $JWT_SECRET"
    echo ""
    echo -e "${YELLOW}Diese Werte wurden in /var/www/TenFingers/.env.production gespeichert${NC}"
    echo ""
    read -p "Drücke Enter um fortzufahren..."
else
    success "Environment-Variablen gefunden"
fi

# ======================
# 9. Domain in nginx.conf konfigurieren
# ======================
info "Konfiguriere Domain in nginx.conf..."
sed -i "s/deine-domain.de/$DOMAIN/g" /var/www/TenFingers/nginx.conf
success "Domain konfiguriert: $DOMAIN"

# ======================
# 9. Docker Image Version wählen
# ======================
echo -e "${YELLOW}"
echo "Welche Version möchtest du deployen?"
echo "  - 'latest' für die neueste Version vom main Branch"
echo "  - Oder eine spezifische Version wie 'v1.0.0'"
read -p "Image Tag (Standard: latest): " IMAGE_TAG
IMAGE_TAG=${IMAGE_TAG:-latest}
echo -e "${NC}"

# Setze IMAGE_TAG in .env.production wenn es existiert
if [ -f "/var/www/TenFingers/.env.production" ]; then
    if grep -q "^IMAGE_TAG=" /var/www/TenFingers/.env.production; then
        sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$IMAGE_TAG/" /var/www/TenFingers/.env.production
    else
        echo "IMAGE_TAG=$IMAGE_TAG" >> /var/www/TenFingers/.env.production
    fi
fi

# Exportiere für docker-compose
export IMAGE_TAG

# ======================
# 10. Environment-Variablen für docker-compose laden
# ======================
info "Lade Environment-Variablen..."
set -a  # Automatisch alle Variablen exportieren
source /var/www/TenFingers/.env.production
set +a
success "Environment-Variablen geladen"

success "Image Tag: $IMAGE_TAG"

# ======================
# 11. Docker Images pullen
# ======================
info "Lade Docker Images von GitHub Container Registry..."
docker-compose -f docker-compose.prod.yml pull
success "Docker Images geladen"

# ======================
# 11. Docker Container starten
# ======================
info "Starte Docker Container..."
cd /var/www/TenFingers
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d
success "Docker Container gestartet"

# Warte auf Container-Start
info "Warte 30 Sekunden auf Container-Start..."
sleep 30

# Prüfe Container-Status
info "Prüfe Container-Status..."
docker-compose -f docker-compose.prod.yml ps

# ======================
# 10. SSL-Zertifikat einrichten (optional)
# ======================
echo -e "${YELLOW}"
read -p "Möchtest du jetzt ein SSL-Zertifikat mit Let's Encrypt einrichten? (j/n): " SETUP_SSL
echo -e "${NC}"

if [ "$SETUP_SSL" = "j" ] || [ "$SETUP_SSL" = "J" ]; then
    echo -e "${YELLOW}"
    read -p "Gib deine E-Mail für Let's Encrypt ein: " EMAIL
    echo -e "${NC}"

    info "Richte SSL-Zertifikat ein mit Dummy-Zertifikaten..."

    # Konfiguriere init-letsencrypt.sh Script
    cd /var/www/TenFingers
    cp init-letsencrypt.sh init-letsencrypt-configured.sh
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" init-letsencrypt-configured.sh
    sed -i "s/EMAIL_PLACEHOLDER/$EMAIL/g" init-letsencrypt-configured.sh
    chmod +x init-letsencrypt-configured.sh

    # Führe init-letsencrypt Script aus
    # Es erstellt:
    # 1. Dummy-Zertifikate (self-signed)
    # 2. Startet nginx mit Dummy-Certs
    # 3. Holt echte Let's Encrypt Zertifikate
    # 4. Ersetzt Dummy durch echte
    # 5. Reloaded nginx
    ./init-letsencrypt-configured.sh

    if [ $? -eq 0 ]; then
        success "SSL-Zertifikat erfolgreich erstellt und aktiviert"
        rm init-letsencrypt-configured.sh
    else
        error "SSL-Zertifikat konnte nicht erstellt werden. Bitte prüfe die DNS-Einstellungen."
    fi
fi

# ======================
# 11. Backup-Verzeichnis erstellen
# ======================
info "Erstelle Backup-Verzeichnis..."
mkdir -p /var/backups/tenfingers
chmod 700 /var/backups/tenfingers
success "Backup-Verzeichnis erstellt"

# ======================
# 12. Cron-Job für Backups einrichten
# ======================
echo -e "${YELLOW}"
read -p "Möchtest du einen täglichen Datenbank-Backup einrichten? (j/n): " SETUP_BACKUP
echo -e "${NC}"

if [ "$SETUP_BACKUP" = "j" ] || [ "$SETUP_BACKUP" = "J" ]; then
    info "Richte Backup-Cron-Job ein..."

    # Erstelle Backup-Script
    cat > /usr/local/bin/tenfingers-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/tenfingers"
DATE=$(date +%Y%m%d_%H%M%S)
# Datenbank-Backup aus Docker-Container erstellen
docker exec tenfingers-postgres pg_dump -U tenfingers_user tenfingers > "$BACKUP_DIR/backup_$DATE.sql"
# Lösche Backups älter als 7 Tage
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete
EOF

    chmod +x /usr/local/bin/tenfingers-backup.sh

    # Füge Cron-Job hinzu (täglich um 2 Uhr)
    (crontab -l 2>/dev/null | grep -v tenfingers-backup; echo "0 2 * * * /usr/local/bin/tenfingers-backup.sh") | crontab -

    success "Backup-Cron-Job eingerichtet (täglich um 2:00 Uhr)"
fi

# ======================
# Fertig!
# ======================
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║                                                   ║"
echo "║          Deployment erfolgreich! 🎉               ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${BLUE}Nächste Schritte:${NC}"
echo ""
echo "1. Öffne deine Domain im Browser"
echo "2. Registriere dich als Lehrer"
echo "3. Erstelle deine erste Klasse"
echo ""
echo -e "${BLUE}Nützliche Befehle:${NC}"
echo ""
echo "  Container-Status:      docker-compose -f docker-compose.prod.yml ps"
echo "  Logs anzeigen:         docker-compose -f docker-compose.prod.yml logs -f"
echo "  Container neustarten:  docker-compose -f docker-compose.prod.yml restart"
echo "  Images aktualisieren:  cd /var/www/TenFingers && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"
echo "  Code aktualisieren:    cd /var/www/TenFingers && git pull"
echo ""
echo -e "${YELLOW}Weitere Dokumentation: /var/www/TenFingers/DEPLOYMENT.md${NC}"
echo ""
