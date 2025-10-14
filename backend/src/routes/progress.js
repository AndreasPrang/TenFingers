const express = require('express');
const router = express.Router();
const {
  saveProgress,
  getUserProgress,
  getLessonProgress,
  getUserStats
} = require('../controllers/progressController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

/**
 * @swagger
 * /api/progress:
 *   post:
 *     summary: Fortschritt speichern (mit oder ohne Login)
 *     description: Speichert eine Übungssession. Kann sowohl von eingeloggten Nutzern als auch anonym verwendet werden.
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lesson_id
 *               - wpm
 *               - accuracy
 *             properties:
 *               lesson_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID der absolvierten Lektion
 *               wpm:
 *                 type: number
 *                 format: float
 *                 example: 42.5
 *                 description: Wörter pro Minute
 *               accuracy:
 *                 type: number
 *                 format: float
 *                 example: 96.8
 *                 description: Genauigkeit in Prozent
 *               completed:
 *                 type: boolean
 *                 default: false
 *                 example: true
 *                 description: Ob die Lektion erfolgreich abgeschlossen wurde
 *               is_anonymous:
 *                 type: boolean
 *                 default: false
 *                 example: false
 *                 description: True wenn Session ohne Login durchgeführt wurde
 *     responses:
 *       201:
 *         description: Fortschritt erfolgreich gespeichert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Progress'
 *       400:
 *         description: Validierungsfehler (fehlende Parameter)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST kann mit oder ohne Auth (für anonyme Sessions)
router.post('/', optionalAuth, saveProgress);

/**
 * @swagger
 * /api/progress:
 *   get:
 *     summary: Gesamten Fortschritt abrufen
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste aller Fortschritte
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Progress'
 */
router.get('/', authenticateToken, getUserProgress);

/**
 * @swagger
 * /api/progress/lesson/{lessonId}:
 *   get:
 *     summary: Fortschritt für eine spezifische Lektion abrufen
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lektions-ID
 *     responses:
 *       200:
 *         description: Fortschritt für die Lektion
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Progress'
 */
router.get('/lesson/:lessonId', authenticateToken, getLessonProgress);

/**
 * @swagger
 * /api/progress/stats:
 *   get:
 *     summary: Benutzerstatistiken abrufen
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Benutzerstatistiken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStats'
 */
router.get('/stats', authenticateToken, getUserStats);

module.exports = router;
