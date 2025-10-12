# Release Process für TenFingers

Dieser Leitfaden beschreibt den Prozess zur Erstellung eines neuen Releases.

## Voraussetzungen

- Push-Rechte auf das Repository
- Alle Tests sind erfolgreich
- Changelog ist aktualisiert

## Release-Prozess

### 1. Versionsnummer festlegen

Folge [Semantic Versioning](https://semver.org/lang/de/):

- **Major** (v1.0.0 → v2.0.0): Breaking Changes
- **Minor** (v1.0.0 → v1.1.0): Neue Features (rückwärtskompatibel)
- **Patch** (v1.0.0 → v1.0.1): Bugfixes

### 2. Lokale Änderungen vorbereiten

```bash
# Stelle sicher, dass dein main Branch aktuell ist
git checkout main
git pull origin main

# Prüfe den Status
git status
```

### 3. Git Tag erstellen

```bash
# Erstelle einen annotierten Tag
git tag -a v1.0.0 -m "Release v1.0.0: Beschreibung"

# Beispiele:
# git tag -a v1.0.0 -m "Release v1.0.0: Initiale Version"
# git tag -a v1.1.0 -m "Release v1.1.0: Neue Lehrer-Features"
# git tag -a v1.0.1 -m "Release v1.0.1: Bugfixes für Login"
```

### 4. Tag pushen

```bash
# Pushe den Tag zu GitHub
git push origin v1.0.0

# Oder alle Tags auf einmal
git push --tags
```

### 5. GitHub Actions überwacht

Nach dem Push des Tags:

1. Gehe zu: https://github.com/AndreasPrang/TenFingers/actions
2. Warte bis der "Build and Push Docker Images" Workflow abgeschlossen ist
3. Prüfe ob die Images erfolgreich gebaut wurden

### 6. Docker Images prüfen

Die gebauten Images sind verfügbar unter:

- Backend: `ghcr.io/andreasprang/tenfingers-backend:v1.0.0`
- Frontend: `ghcr.io/andreasprang/tenfingers-frontend:v1.0.0`

Prüfe die Images in der GitHub Container Registry:
- https://github.com/AndreasPrang/TenFingers/pkgs/container/tenfingers-backend
- https://github.com/AndreasPrang/TenFingers/pkgs/container/tenfingers-frontend

### 7. GitHub Release erstellen (Optional)

1. Gehe zu: https://github.com/AndreasPrang/TenFingers/releases
2. Klicke auf "Draft a new release"
3. Wähle den Tag: `v1.0.0`
4. Release Title: `v1.0.0`
5. Beschreibung:

```markdown
## What's New in v1.0.0

### Features
- Feature 1 beschreibung
- Feature 2 beschreibung

### Bugfixes
- Bugfix 1 beschreibung

### Breaking Changes
- Breaking Change 1 (nur bei Major Releases)

## Docker Images

- Backend: `ghcr.io/andreasprang/tenfingers-backend:v1.0.0`
- Frontend: `ghcr.io/andreasprang/tenfingers-frontend:v1.0.0`

## Deployment

```bash
# Auf VPS deployen
cd /var/www/TenFingers
export IMAGE_TAG=v1.0.0
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```
```

6. Klicke auf "Publish release"

### 8. Deployment auf Production

```bash
# SSH auf den VPS
ssh root@your-vps-ip

# Zum Projektverzeichnis
cd /var/www/TenFingers

# Version in .env.production setzen
echo "IMAGE_TAG=v1.0.0" >> .env.production

# Oder direkt als Environment-Variable
export IMAGE_TAG=v1.0.0

# Images laden
docker-compose -f docker-compose.prod.yml pull

# Container neu starten
docker-compose -f docker-compose.prod.yml up -d

# Logs überwachen
docker-compose -f docker-compose.prod.yml logs -f
```

### 9. Deployment testen

1. Öffne die Produktions-URL: https://deine-domain.de
2. Teste die neuen Features
3. Prüfe die Logs auf Fehler
4. Teste kritische Funktionen:
   - Login/Registrierung
   - Lektionen starten
   - Fortschritt speichern
   - (Lehrer) Schüler verwalten

### 10. Bei Problemen: Rollback

Falls Probleme auftreten, rolle zur vorherigen Version zurück:

```bash
# Zur vorherigen Version wechseln
export IMAGE_TAG=v0.9.0  # oder die letzte funktionierende Version

docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Schnell-Referenz

```bash
# Neues Release erstellen
git tag -a v1.0.0 -m "Release v1.0.0: Beschreibung"
git push origin v1.0.0

# Auf Production deployen
ssh root@vps-ip
cd /var/www/TenFingers
export IMAGE_TAG=v1.0.0
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Rollback
export IMAGE_TAG=v0.9.0
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Automatisierte Builds

GitHub Actions baut automatisch:

- **Bei Push auf `main`**:
  - Tag: `latest`, `main`, `main-{SHA}`

- **Bei Git Tag `v*`**:
  - Tag: `v1.0.0`, `v1.0`, `v1`, `latest`

## Best Practices

1. **Teste lokal vor dem Release**: Stelle sicher, dass alles funktioniert
2. **Schreibe aussagekräftige Release Notes**: Erkläre was sich geändert hat
3. **Folge Semantic Versioning**: Sei konsistent mit Versionsnummern
4. **Backup vor Major Releases**: Erstelle ein Datenbank-Backup
5. **Teste Production nach Deployment**: Verifiziere dass alles funktioniert
6. **Kommuniziere Breaking Changes**: Informiere Nutzer über wichtige Änderungen

## Troubleshooting

### GitHub Actions Workflow schlägt fehl

```bash
# Prüfe die Workflow-Logs
https://github.com/AndreasPrang/TenFingers/actions

# Häufige Probleme:
# - Docker Build Fehler: Prüfe Dockerfile
# - Permission Fehler: Prüfe GITHUB_TOKEN Permissions
# - Syntax Fehler: Prüfe workflow YAML
```

### Image kann nicht gepullt werden

```bash
# Prüfe ob Image existiert
docker manifest inspect ghcr.io/andreasprang/tenfingers-backend:v1.0.0

# Falls private: Login zu ghcr.io
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### Container startet nicht mit neuer Version

```bash
# Prüfe Logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Rollback zur vorherigen Version
export IMAGE_TAG=v0.9.0
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```
