const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  requireAdmin,
  getDashboardStats,
  getTimeSeriesData,
  getPerformanceDistribution,
  getPopularLessons
} = require('../controllers/adminController');

// Alle Admin-Routes benötigen Authentifizierung und Admin-Rechte
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard-Übersicht
router.get('/dashboard', getDashboardStats);

// Zeitverlauf-Daten für Graphen
router.get('/timeseries', getTimeSeriesData);

// Leistungsverteilungen
router.get('/performance-distribution', getPerformanceDistribution);

// Beliebteste Lektionen
router.get('/popular-lessons', getPopularLessons);

module.exports = router;
