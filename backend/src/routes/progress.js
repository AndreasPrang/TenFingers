const express = require('express');
const router = express.Router();
const {
  saveProgress,
  getUserProgress,
  getLessonProgress,
  getUserStats
} = require('../controllers/progressController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/progress:
 *   post:
 *     summary: Fortschritt speichern
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
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
 *               wpm:
 *                 type: number
 *                 format: float
 *                 example: 42.5
 *               accuracy:
 *                 type: number
 *                 format: float
 *                 example: 96.8
 *               completed:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Fortschritt erfolgreich gespeichert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Progress'
 *       400:
 *         description: Validierungsfehler
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticateToken, saveProgress);

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
