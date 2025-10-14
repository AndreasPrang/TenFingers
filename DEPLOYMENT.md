# TenFingers - VPS Deployment Guide

## Voraussetzungen

### VPS-Anforderungen
- Ubuntu 20.04 LTS oder höher (empfohlen: Ubuntu 22.04)
- Mindestens 2 GB RAM
- 20 GB freier Speicherplatz
- Root- oder Sudo-Zugriff

### Software auf dem VPS
- **Nur Docker Engine und Docker Compose benötigt!**
- Nginx läuft als Docker-Container (keine lokale Installation nötig)
- Certbot läuft als Docker-Container (keine lokale Installation nötig)

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

## Schritt 3: Repository klonen

```bash
# Arbeitsverzeichnis erstellen
mkdir -p /var/www
cd /var/www

# Repository klonen
git clone https://github.com/AndreasPrang/TenFingers.git
cd TenFingers
```

---

## Schritt 4: Environment-Variablen konfigurieren

### Production .env erstellen
```bash
cd /var/www/TenFingers
cp .env.production.example .env.production
nano .env.production
```

Trage folgende Werte ein (siehe .env.production.example für vollständige Anleitung):
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

# React App (API URL)
REACT_APP_API_URL=https://deine-domain.de/api

# Mail-Server (Postfix)
MAIL_HOST=mailserver
MAIL_PORT=25
MAIL_FROM=noreply@deine-domain.de
```

**Sichere Passwörter generieren:**
```bash
# Für DB_PASSWORD
openssl rand -base64 32

# Für JWT_SECRET
openssl rand -base64 64
```

---

## Schritt 5: Domain konfigurieren

Die Domain wird in der nginx.conf konfiguriert:
```bash
cd /var/www/TenFingers
nano nginx.conf
```

Ersetze `deine-domain.de` mit deiner echten Domain (oder nutze das deploy.sh Skript, das dies automatisch macht).

---

## Schritt 6: Anwendung starten

```bash
cd /var/www/TenFingers

# Docker Images von GitHub Container Registry laden
docker-compose -f docker-compose.prod.yml pull

# Container starten (inkl. Nginx und Certbot als Container)
docker-compose -f docker-compose.prod.yml up -d

# Logs überprüfen
docker-compose -f docker-compose.prod.yml logs -f

# Status überprüfen
docker-compose -f docker-compose.prod.yml ps
```

**Wichtig:**
- Die Docker Images werden automatisch von GitHub Container Registry geladen
- Nginx und Certbot laufen als Docker-Container
- Keine lokale Installation von Software nötig (außer Docker)
- Standardmäßig wird das `latest` Image verwendet
- Für spezifische Versionen: Setze `IMAGE_TAG=v1.0.0` in `.env.production`

---

## Schritt 7: SSL-Zertifikat mit Let's Encrypt einrichten

```bash
cd /var/www/TenFingers

# SSL-Zertifikat über den Certbot Docker-Container erstellen
docker-compose -f docker-compose.prod.yml run --rm certbot \
  certonly --webroot --webroot-path=/var/www/certbot \
  -d deine-domain.de \
  --email deine-email@example.com \
  --agree-tos \
  --no-eff-email

# SSL-Konfiguration in nginx.conf aktivieren (auskommentieren)
nano nginx.conf
# Entferne die Kommentare (#) vor den ssl_certificate Zeilen

# Nginx-Container neu starten
docker-compose -f docker-compose.prod.yml restart nginx
```

**Automatische Erneuerung:** Der Certbot-Container erneuert die Zertifikate automatisch alle 12 Stunden.

---

## Schritt 8: Datenbank initialisieren

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

## Schritt 9: Mail-Server konfigurieren (DNS & SPF)

TenFingers enthält einen integrierten Postfix Mail-Relay für Passwort-Reset-E-Mails.

### DNS-Einstellungen

Für zuverlässigen E-Mail-Versand solltest du folgende DNS-Einträge konfigurieren:

**1. Reverse DNS (PTR Record)**
- Bei deinem VPS-Provider/Hoster einrichten
- `VPS-IP` → `deine-domain.de`
- Beispiel: `89.58.13.117` → `tenfingers.pra.ng`

**2. SPF-Record (TXT Record)**
- Bei deinem DNS-Provider einrichten
- Typ: `TXT`
- Name: `@` oder `deine-domain.de`
- Wert: `v=spf1 ip4:DEINE-VPS-IP -all`
- Beispiel: `v=spf1 ip4:89.58.13.117 -all`

**3. (Optional) DKIM und DMARC**
- Für erweiterte E-Mail-Authentifizierung
- Erhöht die Zustellbarkeit

### Mail-Server testen

```bash
# Mail-Server Logs überprüfen
docker-compose -f docker-compose.prod.yml logs mailserver

# Test-E-Mail über API senden
curl -X POST https://deine-domain.de/api/mail/test \
  -H "Content-Type: application/json" \
  -d '{"to":"deine-email@example.com","subject":"Test","text":"Test-Mail"}'
```

### Hinweise

- Der Mailserver läuft als Docker-Container und ist nur intern erreichbar
- E-Mails werden von `MAIL_FROM` (noreply@deine-domain.de) versendet
- Passwort-Reset-E-Mails werden automatisch versendet
- Für Accounts ohne E-Mail-Adresse werden keine Reset-E-Mails versendet

---

## Schritt 10: Ersten Lehrer-Account erstellen

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

# Nur Nginx
docker-compose -f docker-compose.prod.yml logs -f nginx

# Nur Certbot
docker-compose -f docker-compose.prod.yml logs -f certbot

# Nur Mailserver
docker-compose -f docker-compose.prod.yml logs -f mailserver
```

### Container neustarten
```bash
# Alle Container
docker-compose -f docker-compose.prod.yml restart

# Nur Nginx (z.B. nach Konfigurationsänderung)
docker-compose -f docker-compose.prod.yml restart nginx
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

#### Automatisches Update-Script (empfohlen)

Das mitgelieferte `update.sh` Script automatisiert den gesamten Update-Prozess:

```bash
cd /var/www/TenFingers
sudo ./update.sh
```

Das Script führt folgende Schritte aus:
1. **Backup erstellen** (optional, aber empfohlen)
2. **Git Repository aktualisieren** - Wähle Branch/Tag (z.B. main, v1.0.0)
3. **Docker Image Version wählen** - Wähle Image Tag (latest oder spezifische Version)
4. **Neue Images laden** - Von GitHub Container Registry
5. **Services neu starten** - Mit Zero-Downtime
6. **Health Check** - Prüft ob Services erreichbar sind
7. **Status-Report** - Zeigt aktuelle Versionen an

**Vorteile:**
- Automatisches Backup vor dem Update
- Interaktive Auswahl von Git-Version und Docker-Tag
- Health-Checks nach dem Update
- Umfassende Fehlerprüfung
- Detaillierter Status-Report

---

#### Manuelle Updates

**Option 1: Neueste Version (latest)**
```bash
cd /var/www/TenFingers

# Neueste Images laden
docker-compose -f docker-compose.prod.yml pull

# Container neu starten
docker-compose -f docker-compose.prod.yml up -d
```

**Option 2: Spezifische Version**
```bash
cd /var/www/TenFingers

# Version in .env.production setzen
echo "IMAGE_TAG=v1.0.0" >> .env.production

# Images laden und neu starten
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

**Option 3: Code-Änderungen (nginx.conf, etc.)**
```bash
cd /var/www/TenFingers

# Repository aktualisieren
git pull origin main

# Container neu starten (falls Konfiguration geändert)
docker-compose -f docker-compose.prod.yml restart nginx
```

### Verfügbare Versionen

Alle verfügbaren Versionen findest du auf:
- GitHub Releases: https://github.com/AndreasPrang/TenFingers/releases
- Container Registry: https://github.com/AndreasPrang/TenFingers/pkgs/container/tenfingers-backend

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
sudo lsof -i :80
sudo lsof -i :443

# Falls eine lokale Nginx-Installation läuft, stoppe sie
sudo systemctl stop nginx
sudo systemctl disable nginx

# Oder entferne sie komplett
sudo apt remove nginx nginx-common
```

### SSL-Zertifikat Probleme
```bash
# Certbot Container-Logs überprüfen
docker-compose -f docker-compose.prod.yml logs certbot

# Manuell SSL-Zertifikat erneuern
docker-compose -f docker-compose.prod.yml run --rm certbot renew --force-renewal

# Nginx nach SSL-Erneuerung neu starten
docker-compose -f docker-compose.prod.yml restart nginx

# SSL-Zertifikate manuell testen
docker-compose -f docker-compose.prod.yml exec nginx ls -la /etc/letsencrypt/live/
```

### Nginx-Container startet nicht
```bash
# Nginx-Logs überprüfen
docker-compose -f docker-compose.prod.yml logs nginx

# Nginx-Konfiguration im Container testen
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Nginx-Container neu bauen
docker-compose -f docker-compose.prod.yml up -d --build nginx
```

### E-Mail-Versand funktioniert nicht

```bash
# Mailserver-Logs überprüfen
docker-compose -f docker-compose.prod.yml logs mailserver

# Backend-Logs für E-Mail-Fehler überprüfen
docker-compose -f docker-compose.prod.yml logs backend | grep -i mail

# DNS-Einstellungen überprüfen
dig +short deine-domain.de TXT  # SPF-Record prüfen
host DEINE-VPS-IP              # Reverse DNS prüfen

# Mailserver-Konfiguration testen
docker exec tenfingers-mailserver postconf mynetworks
docker exec tenfingers-mailserver postconf myhostname

# Test-E-Mail senden
curl -X POST http://localhost:4000/api/mail/test \
  -H "Content-Type: application/json" \
  -d '{"to":"deine-email@example.com","subject":"Test","text":"Test-Nachricht"}'

# Mailserver neu starten
docker-compose -f docker-compose.prod.yml restart mailserver
```

**Häufige Ursachen:**
- Fehlende oder falsche DNS-Einträge (SPF, Reverse DNS)
- E-Mails landen im Spam (SPF/DKIM nicht konfiguriert)
- Port 25 vom Provider blockiert (manche Provider blocken ausgehenden SMTP)
- Falsche MAIL_FROM Adresse in .env.production
- Account hat keine E-Mail-Adresse hinterlegt

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
