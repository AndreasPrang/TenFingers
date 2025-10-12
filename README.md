# TenFingers ⌨️

Ein interaktiver 10-Finger-Schreibtrainer für die deutsche QWERTZ-Tastatur.

## Features

### Für Schüler
- 📚 **10 strukturierte Lektionen** - Von der Grundreihe bis zu komplexen Texten
- ⚡ **Echtzeit-Feedback** - Sofortige Anzeige von WPM und Genauigkeit
- 🎯 **Fortschritts-Tracking** - Detaillierte Statistiken zu deiner Entwicklung
- 🎨 **Interaktive Tastatur** - Farbcodierte Tastatur zeigt richtige Fingerpositionen
- ✅ **Strict Mode** - Verhindert Weitergehen bei Fehlern für besseres Lernen

### Für Lehrer
- 👥 **Klassenverwaltung** - Erstelle und verwalte mehrere Klassen
- 📊 **Schüler-Übersicht** - Detaillierter Fortschritt aller Schüler auf einen Blick
- ➕ **Bulk-Erstellung** - Bis zu 35 Schüler gleichzeitig mit generierten Passwörtern erstellen
- ✏️ **Schüler bearbeiten** - Namen, E-Mail und Passwörter ändern
- 🗑️ **Schüler löschen** - Mit Sicherheitsbestätigung
- 📥 **CSV-Export** - Zugangsdaten als CSV-Datei herunterladen
- 📧 **Optionale E-Mail** - E-Mail-Adressen sind für Schüler optional

## Technologie-Stack

- **Frontend**: React 18 mit TypeScript, React Router
- **Backend**: Node.js mit Express
- **Datenbank**: PostgreSQL
- **Containerisierung**: Docker & Docker Compose
- **Authentifizierung**: JWT (JSON Web Tokens)

## Installation & Start

### Voraussetzungen
- Docker & Docker Compose installiert

### Setup

1. Repository klonen:
```bash
git clone https://github.com/AndreasPrang/TenFingers.git
cd TenFingers
```

2. Backend-Umgebungsvariablen erstellen:
```bash
cd backend
cp .env.example .env
# Bearbeite .env mit deinen Werten
```

3. Docker Container starten:
```bash
docker-compose up --build
```

4. Anwendung öffnen:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Dokumentation: http://localhost:4000/api-docs

## Projekt-Struktur

```
tenfingers/
├── frontend/          # React Frontend
│   ├── src/
│   │   ├── components/    # React Komponenten
│   │   ├── pages/         # Seiten/Views
│   │   ├── services/      # API Services
│   │   ├── context/       # React Context (Auth)
│   │   ├── types/         # TypeScript Typen
│   │   └── styles/        # CSS Dateien
│   └── Dockerfile
├── backend/           # Express Backend
│   ├── src/
│   │   ├── config/        # Datenbank-Konfiguration
│   │   ├── controllers/   # Request Handler
│   │   ├── routes/        # API Routes
│   │   └── middleware/    # Auth Middleware
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## API-Endpunkte

### Authentifizierung
- `POST /api/auth/register` - Neuen Nutzer registrieren
- `POST /api/auth/login` - Einloggen
- `GET /api/auth/profile` - Profil abrufen

### Lektionen
- `GET /api/lessons` - Alle Lektionen abrufen
- `GET /api/lessons/:id` - Einzelne Lektion abrufen

### Fortschritt
- `POST /api/progress` - Fortschritt speichern
- `GET /api/progress` - Eigenen Fortschritt abrufen
- `GET /api/progress/stats` - Statistiken abrufen

### Klassenverwaltung (Lehrer)
- `POST /api/classes` - Neue Klasse erstellen
- `GET /api/classes` - Alle eigenen Klassen abrufen
- `GET /api/classes/:id` - Klasse abrufen
- `POST /api/classes/:id/students` - Einzelnen Schüler hinzufügen
- `POST /api/classes/:id/students/bulk` - Mehrere Schüler erstellen
- `PUT /api/classes/:classId/students/:studentId` - Schüler bearbeiten
- `DELETE /api/classes/:classId/students/:studentId` - Schüler löschen
- `GET /api/classes/:id/students` - Alle Schüler einer Klasse
- `GET /api/classes/:id/progress` - Fortschritt aller Schüler

## Datenbank-Schema

### Users
- `id`, `username`, `email` (optional), `password_hash`, `role` (teacher/student), `class_id`

### Classes
- `id`, `name`, `teacher_id`

### Lessons
- `id`, `title`, `description`, `level`, `text_content`, `target_keys`

### Progress
- `id`, `user_id`, `lesson_id`, `wpm`, `accuracy`, `completed`

### User Stats
- `id`, `user_id`, `total_lessons_completed`, `average_wpm`, `average_accuracy`

## Entwickelt mit ❤️

Dieses Projekt wurde entwickelt, um Schülern das 10-Finger-System auf unterhaltsame und effektive Weise beizubringen.

## Lizenz

MIT License
