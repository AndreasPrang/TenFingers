require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialisiere Datenbank
initDatabase();

// API Routes
const authRoutes = require('./routes/auth');
const lessonsRoutes = require('./routes/lessons');
const progressRoutes = require('./routes/progress');
const classesRoutes = require('./routes/classes');

app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/classes', classesRoutes);

// Swagger API Dokumentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TenFingers API Documentation'
}));

// OpenAPI Spec als JSON verfügbar machen
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    // Prüfe Datenbank-Verbindung
    const { pool } = require('./config/database');
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      message: 'TenFingers API läuft',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Datenbank nicht verfügbar',
      timestamp: new Date().toISOString()
    });
  }
});

// Legacy health endpoint (für Kompatibilität)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TenFingers API läuft' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint nicht gefunden' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Interner Serverfehler' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   TenFingers API Server läuft auf Port ${PORT}     ║
║                                                   ║
║   API Dokumentation: http://localhost:${PORT}/api-docs  ║
║   Health Check: http://localhost:${PORT}/health        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
