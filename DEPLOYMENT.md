# TenFingers - VPS Deployment Guide

## Voraussetzungen

### VPS-Anforderungen
- Ubuntu 20.04 LTS oder höher (empfohlen: Ubuntu 22.04)
- Mindestens 2 GB RAM
- 20 GB freier Speicherplatz
- Root- oder Sudo-Zugriff

### Software auf dem VPS
- Docker Engine
- Docker Compose
- Nginx (als Reverse Proxy)
- Certbot (für SSL-Zertifikate)

### Domain
- Eine Domain oder Subdomain, die auf die IP deines VPS zeigt
- DNS A-Record: `deine-domain.de` → `VPS-IP-ADRESSE`

---

## Schritt 1: VPS vorbereiten

### Mit VPS verbinden
```bash
ssh root@DEINE-VPS-IP
```

### System aktualisieren
```bash
apt update && apt upgrade -y
```

### Firewall einrichten
```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## Schritt 2: Docker installieren

```bash
# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose installieren
apt install docker-compose -y

# Docker beim Boot starten
systemctl enable docker
systemctl start docker

# Überprüfen
docker --version
docker-compose --version
```

---

## Schritt 3: Nginx installieren

```bash
apt install nginx -y
systemctl enable nginx
systemctl start nginx
```

---

## Schritt 4: Repository klonen

```bash
# Arbeitsverzeichnis erstellen
mkdir -p /var/www
cd /var/www

# Repository klonen
git clone https://github.com/AndreasPrang/TenFingers.git
cd TenFingers
```

---

## Schritt 5: Environment-Variablen konfigurieren

### Backend .env erstellen
```bash
cd /var/www/TenFingers/backend
cp .env.example .env
nano .env
```

Trage folgende Werte ein:
```env
# PostgreSQL Datenbank
DB_HOST=postgres
DB_PORT=5432
DB_NAME=tenfingers
DB_USER=tenfingers_user
DB_PASSWORD=SICHERES_PASSWORT_HIER  # Ändere dies!

# JWT Secret (generiere einen zufälligen String)
JWT_SECRET=DEIN_SEHR_LANGER_GEHEIMER_JWT_STRING  # Ändere dies!

# Server
PORT=4000
NODE_ENV=production

# Frontend URL (deine Domain)
FRONTEND_URL=https://deine-domain.de
```

**Sichere Passwörter generieren:**
```bash
# Für DB_PASSWORD
openssl rand -base64 32

# Für JWT_SECRET
openssl rand -base64 64
```

### Frontend .env erstellen
```bash
cd /var/www/TenFingers/frontend
nano .env
```

```env
REACT_APP_API_URL=https://deine-domain.de/api
```

---

## Schritt 6: Production Docker Compose erstellen

```bash
cd /var/www/TenFingers
nano docker-compose.prod.yml
```

Siehe `docker-compose.prod.yml` Datei im Repository.

---

## Schritt 7: Nginx Reverse Proxy konfigurieren

```bash
nano /etc/nginx/sites-available/tenfingers
```

Siehe `nginx.conf` Datei im Repository.

```bash
# Symlink erstellen
ln -s /etc/nginx/sites-available/tenfingers /etc/nginx/sites-enabled/

# Standard-Site deaktivieren
rm /etc/nginx/sites-enabled/default

# Nginx-Konfiguration testen
nginx -t

# Nginx neu laden
systemctl reload nginx
```

---

## Schritt 8: SSL-Zertifikat mit Let's Encrypt

```bash
# Certbot installieren
apt install certbot python3-certbot-nginx -y

# SSL-Zertifikat erhalten und automatisch konfigurieren
certbot --nginx -d deine-domain.de

# Automatische Erneuerung testen
certbot renew --dry-run
```

---

## Schritt 9: Anwendung starten

```bash
cd /var/www/TenFingers

# Container bauen und starten
docker-compose -f docker-compose.prod.yml up -d --build

# Logs überprüfen
docker-compose -f docker-compose.prod.yml logs -f

# Status überprüfen
docker-compose -f docker-compose.prod.yml ps
```

---

## Schritt 10: Datenbank initialisieren

Die Datenbank wird automatisch beim ersten Start initialisiert. Überprüfe die Logs:

```bash
docker-compose -f docker-compose.prod.yml logs backend
```

Du solltest sehen:
```
✓ Datenbank erfolgreich verbunden
✓ Tabellen erstellt
✓ Lektionen eingefügt
```

---

## Schritt 11: Ersten Lehrer-Account erstellen

Du kannst dich jetzt auf `https://deine-domain.de` registrieren und beim ersten Account "Lehrer" als Rolle auswählen.

---

## Wartung und Verwaltung

### Container-Status überprüfen
```bash
cd /var/www/TenFingers
docker-compose -f docker-compose.prod.yml ps
```

### Logs anzeigen
```bash
# Alle Logs
docker-compose -f docker-compose.prod.yml logs -f

# Nur Backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Nur Frontend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Nur Datenbank
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Container neustarten
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Anwendung stoppen
```bash
docker-compose -f docker-compose.prod.yml down
```

### Anwendung komplett entfernen (inkl. Datenbank)
```bash
docker-compose -f docker-compose.prod.yml down -v
```

### Updates einspielen
```bash
cd /var/www/TenFingers

# Code aktualisieren
git pull origin main

# Container neu bauen und starten
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Datenbank-Backup

### Backup erstellen
```bash
docker exec tenfingers-postgres pg_dump -U tenfingers_user tenfingers > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Backup wiederherstellen
```bash
docker exec -i tenfingers-postgres psql -U tenfingers_user tenfingers < backup_DATUM.sql
```

### Automatisches Backup einrichten (Cron)
```bash
crontab -e
```

Füge hinzu (täglich um 2 Uhr morgens):
```
0 2 * * * cd /var/www/TenFingers && docker exec tenfingers-postgres pg_dump -U tenfingers_user tenfingers > /var/backups/tenfingers_$(date +\%Y\%m\%d).sql
```

---

## Monitoring

### Ressourcen-Nutzung
```bash
docker stats
```

### Disk-Space
```bash
df -h
docker system df
```

### System-Logs
```bash
journalctl -u docker -f
```

---

## Troubleshooting

### Container startet nicht
```bash
# Logs überprüfen
docker-compose -f docker-compose.prod.yml logs

# Container neu bauen
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate
```

### Datenbank-Verbindungsfehler
```bash
# PostgreSQL Container überprüfen
docker-compose -f docker-compose.prod.yml logs postgres

# In PostgreSQL Container einloggen
docker exec -it tenfingers-postgres psql -U tenfingers_user tenfingers
```

### Port bereits belegt
```bash
# Prüfen, welcher Prozess Port 80/443 nutzt
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# Nginx stoppen falls nötig
systemctl stop nginx
```

### SSL-Zertifikat Probleme
```bash
# Certbot-Logs überprüfen
journalctl -u certbot -f

# Manuell erneuern
certbot renew --force-renewal
```

---

## Sicherheit

### Regelmäßige Updates
```bash
apt update && apt upgrade -y
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Fail2Ban einrichten (optional)
```bash
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

### Docker-Logs begrenzen
Editiere `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
systemctl restart docker
```

---

## Performance-Optimierung

### PostgreSQL Tuning
In `docker-compose.prod.yml` kannst du PostgreSQL-Parameter anpassen:
```yaml
environment:
  POSTGRES_SHARED_BUFFERS: 256MB
  POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
```

### Nginx Caching
Bereits in der mitgelieferten nginx.conf konfiguriert.

---

## Support

Bei Problemen:
1. Logs überprüfen: `docker-compose -f docker-compose.prod.yml logs`
2. GitHub Issues: https://github.com/AndreasPrang/TenFingers/issues
3. Container-Status: `docker-compose -f docker-compose.prod.yml ps`

---

## Schnellstart-Cheatsheet

```bash
# Status
docker-compose -f docker-compose.prod.yml ps

# Starten
docker-compose -f docker-compose.prod.yml up -d

# Stoppen
docker-compose -f docker-compose.prod.yml down

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Neustart
docker-compose -f docker-compose.prod.yml restart

# Update
git pull && docker-compose -f docker-compose.prod.yml up -d --build
```
