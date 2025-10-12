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
# 4. Nginx installieren
# ======================
if ! command -v nginx &> /dev/null; then
    info "Installiere Nginx..."
    apt install nginx -y
    systemctl enable nginx
    systemctl start nginx
    success "Nginx installiert"
else
    success "Nginx bereits installiert"
fi

# ======================
# 5. Firewall konfigurieren
# ======================
info "Konfiguriere Firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
success "Firewall konfiguriert"

# ======================
# 6. Arbeitsverzeichnis erstellen
# ======================
info "Erstelle Arbeitsverzeichnis..."
mkdir -p /var/www
cd /var/www
success "Arbeitsverzeichnis erstellt"

# ======================
# 7. Repository klonen
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
# 8. Environment-Variablen prüfen
# ======================
if [ ! -f "/var/www/TenFingers/backend/.env" ]; then
    error "Backend .env Datei fehlt! Bitte erstelle /var/www/TenFingers/backend/.env"
fi

if [ ! -f "/var/www/TenFingers/frontend/.env" ]; then
    error "Frontend .env Datei fehlt! Bitte erstelle /var/www/TenFingers/frontend/.env"
fi

success "Environment-Variablen gefunden"

# ======================
# 9. Docker Container starten
# ======================
info "Starte Docker Container..."
cd /var/www/TenFingers
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d --build
success "Docker Container gestartet"

# Warte auf Container-Start
info "Warte 30 Sekunden auf Container-Start..."
sleep 30

# Prüfe Container-Status
info "Prüfe Container-Status..."
docker-compose -f docker-compose.prod.yml ps

# ======================
# 10. Nginx konfigurieren
# ======================
info "Konfiguriere Nginx..."

if [ ! -f "/etc/nginx/sites-available/tenfingers" ]; then
    # Kopiere Nginx-Konfiguration
    cp /var/www/TenFingers/nginx.conf /etc/nginx/sites-available/tenfingers

    # Frage nach Domain
    echo -e "${YELLOW}"
    read -p "Gib deine Domain ein (z.B. example.com): " DOMAIN
    echo -e "${NC}"

    # Ersetze Platzhalter in Nginx-Konfiguration
    sed -i "s/deine-domain.de/$DOMAIN/g" /etc/nginx/sites-available/tenfingers

    # Erstelle Symlink
    ln -s /etc/nginx/sites-available/tenfingers /etc/nginx/sites-enabled/

    # Entferne Default-Site
    rm -f /etc/nginx/sites-enabled/default

    # Teste Nginx-Konfiguration
    nginx -t

    # Reload Nginx
    systemctl reload nginx

    success "Nginx konfiguriert"
else
    success "Nginx bereits konfiguriert"
fi

# ======================
# 11. SSL-Zertifikat (optional)
# ======================
echo -e "${YELLOW}"
read -p "Möchtest du jetzt ein SSL-Zertifikat mit Let's Encrypt einrichten? (j/n): " SETUP_SSL
echo -e "${NC}"

if [ "$SETUP_SSL" = "j" ] || [ "$SETUP_SSL" = "J" ]; then
    if ! command -v certbot &> /dev/null; then
        info "Installiere Certbot..."
        apt install certbot python3-certbot-nginx -y
        success "Certbot installiert"
    fi

    echo -e "${YELLOW}"
    read -p "Gib deine Domain ein (z.B. example.com): " DOMAIN
    read -p "Gib deine E-Mail ein: " EMAIL
    echo -e "${NC}"

    info "Richte SSL-Zertifikat ein..."
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"
    success "SSL-Zertifikat eingerichtet"

    # Teste automatische Erneuerung
    certbot renew --dry-run
    success "SSL-Zertifikat Erneuerung getestet"
fi

# ======================
# 12. Backup-Verzeichnis erstellen
# ======================
info "Erstelle Backup-Verzeichnis..."
mkdir -p /var/backups/tenfingers
chmod 700 /var/backups/tenfingers
success "Backup-Verzeichnis erstellt"

# ======================
# 13. Cron-Job für Backups einrichten
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
echo "  Updates einspielen:    cd /var/www/TenFingers && git pull && docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
echo -e "${YELLOW}Weitere Dokumentation: /var/www/TenFingers/DEPLOYMENT.md${NC}"
echo ""
