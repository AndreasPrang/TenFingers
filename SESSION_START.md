# Session Start - Essential Information

**READ THIS FILE AT THE START OF EVERY SESSION!**

## 🌍 Documentation Language

**IMPORTANT**: All documentation in this repository MUST be written in **English**.
- README.md - English ✓
- SESSION_START.md - English ✓
- Code comments - English
- Git commit messages - English
- Any new documentation - English

---

## 🚀 Quick Start

```bash
# Start the app (if not running)
docker-compose up -d

# Check status
docker-compose ps

# Should show: 3 containers running (db, backend, frontend)
```

## 🌐 URLs

- **Frontend**: http://192.168.2.66:3000
- **Backend API**: http://192.168.2.66:4000
- **API Docs (Swagger)**: http://192.168.2.66:4000/api-docs

**Test Credentials**:
- Username: `testuser`
- Password: `test123`

---

## ⚠️ CRITICAL FIXES (ALREADY IMPLEMENTED - DO NOT CHANGE!)

### 1. TypeScript Version = 4.9.5
**File**: `frontend/package.json`
```json
"typescript": "^4.9.5"  // DO NOT upgrade to 5.x!
```
**Reason**: react-scripts 5.0.1 only supports TypeScript 4.x

### 2. PostgreSQL DECIMAL → String Problem
**Problem**: PostgreSQL returns NUMERIC/DECIMAL as **Strings**, not Numbers!

**Affected Files & Lines**:
- `frontend/src/pages/Dashboard.tsx` (Lines 63, 73, 108, 109)
- `frontend/src/pages/Lessons.tsx` (Lines 92, 96)

**Solution**: ALWAYS use `Number()` before `.toFixed()`:
```typescript
// ❌ WRONG - Runtime Error!
{stats.average_wpm.toFixed(1)}

// ✅ CORRECT
{Number(stats.average_wpm).toFixed(1)}
```

**Why**: JSON serializes PostgreSQL NUMERIC as String like `"35.50"`

---

## 🏗️ Architecture

### Docker Services
1. **tenfingers-db** (PostgreSQL 15) - Port 5432
2. **tenfingers-backend** (Node.js/Express) - Port 4000
3. **tenfingers-frontend** (React) - Port 3000

### Database
- **Auto-Init**: Schema is created automatically on startup
- **4 Tables**: users, lessons, progress, user_stats
- **10 Lessons**: Pre-installed (Basic Row to Free Text)
- **Test Data**: User "testuser" with progress exists

### API Authentication
- **JWT-based**: Bearer Token in Authorization Header
- **Public Routes**: /api/auth/register, /api/auth/login
- **Protected Routes**: All others (require token)

---

## 📁 Important Files

### Frontend
```
frontend/src/
├── pages/
│   ├── Dashboard.tsx    ⚠️ Number() Conversions (Lines 63,73,108,109)
│   ├── Lessons.tsx      ⚠️ Number() Conversions (Lines 92,96)
│   ├── Practice.tsx     ✓ No DECIMAL issues (local calculation)
│   └── Login.tsx, Register.tsx
├── components/Keyboard.tsx  # QWERTZ Layout with finger mapping
├── context/AuthContext.tsx  # JWT Token Management
├── services/api.ts          # Axios Client with auto-token
└── types/index.ts           # TypeScript Interfaces
```

### Backend
```
backend/src/
├── config/
│   ├── database.js    # Schema Init + 10 Lessons + Test User
│   └── swagger.js     # OpenAPI 3.0 Config
├── controllers/       # Business Logic
├── routes/           # Express Routes + OpenAPI Annotations
└── middleware/auth.js # JWT Verification
```

---

## 🔧 Common Commands

```bash
# Show logs
docker logs tenfingers-frontend
docker logs tenfingers-backend
docker logs tenfingers-db

# Live logs
docker logs -f tenfingers-backend

# Query database
docker exec -it tenfingers-db psql -U tenfingers -d tenfingers

# Restart container
docker-compose restart frontend
docker-compose restart backend

# Rebuild everything
docker-compose down
docker-compose up --build

# Reset database (WARNING: Deletes all data!)
docker-compose down -v
docker-compose up --build
```

---

## 🐛 Known Issues (RESOLVED)

### ✅ Dashboard Runtime Error: "toFixed is not a function"
**Status**: RESOLVED
**Fix**: Number() conversion before .toFixed() in Dashboard.tsx & Lessons.tsx

### ✅ TypeScript Build Error with TS 5.x
**Status**: RESOLVED
**Fix**: Downgrade to TypeScript 4.9.5

### ✅ Error Messages Hard to See
**Status**: RESOLVED
**Fix**: Red background (#d32f2f), white text, shake animation

### ✅ "Next Lesson" Feature Missing
**Status**: RESOLVED
**Fix**: Button implemented in Practice.tsx (Lines 283-286)

---

## 🎯 Features

- ✅ User Registration & Login (JWT Auth)
- ✅ 10 Lessons (DB auto-initialized)
- ✅ Real-time WPM & Accuracy Tracking
- ✅ QWERTZ Keyboard Visualization
- ✅ Progress Persistence
- ✅ User Stats Aggregation (Dashboard)
- ✅ "Next Lesson" Navigation
- ✅ Swagger API Documentation

---

## 📊 API Endpoints (Quick Reference)

**Public**:
- POST `/api/auth/register`
- POST `/api/auth/login`

**Protected** (JWT Bearer Token required):
- GET `/api/auth/profile`
- GET `/api/lessons` (all lessons)
- GET `/api/lessons/:id` (single lesson)
- POST `/api/progress` (save progress)
- GET `/api/progress` (own progress)
- GET `/api/progress/stats` (user statistics for dashboard)

Full documentation: http://192.168.2.66:4000/api-docs

---

## 🧪 Testing

### Quick API Test
```bash
# Health Check
curl http://192.168.2.66:4000/health

# Login & Get Token
curl -X POST http://192.168.2.66:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'

# Get User Stats (Dashboard Data)
TOKEN="<jwt-token>"
curl http://192.168.2.66:4000/api/progress/stats \
  -H "Authorization: Bearer $TOKEN"
```

### Browser Test
1. Open http://192.168.2.66:3000
2. Login with `testuser` / `test123`
3. Dashboard should show stats (35.5 WPM, 92.3% Accuracy)
4. Lessons page shows 10 lessons
5. Practice page has "Next Lesson →" button

---

## 📝 Chrome MCP

**Status**: Configured in `.mcp.json`
**Server**: chrome-devtools-mcp (installed: /opt/homebrew/bin/)
**Activation**: Session reload required

---

**Last Updated**: 2025-10-12
**Project Status**: ✅ Fully functional, all known bugs fixed
