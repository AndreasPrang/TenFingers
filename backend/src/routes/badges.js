const express = require('express');
const router = express.Router();
const {
  getBadgeDefinitions,
  getCurrentBadge,
  getBadgeProgress,
  getUserBadges
} = require('../controllers/badgeController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/badges/definitions:
 *   get:
 *     summary: Alle Badge-Definitionen abrufen
 *     tags: [Badges]
 *     responses:
 *       200:
 *         description: Liste aller Badge-Definitionen
 */
router.get('/definitions', getBadgeDefinitions);

/**
 * @swagger
 * /api/badges/current:
 *   get:
 *     summary: Aktuelles Badge des eingeloggten Users
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aktuelles Badge mit Stats
 */
router.get('/current', authenticateToken, getCurrentBadge);

/**
 * @swagger
 * /api/badges/progress:
 *   get:
 *     summary: Fortschritt zum nächsten Badge
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fortschritt mit Anforderungen
 */
router.get('/progress', authenticateToken, getBadgeProgress);

/**
 * @swagger
 * /api/badges/all:
 *   get:
 *     summary: Alle Badges des Users (erreicht und nicht erreicht)
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alle Badges mit Status
 */
router.get('/all', authenticateToken, getUserBadges);

module.exports = router;
