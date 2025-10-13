const express = require('express');
const router = express.Router();
const { getAllLessons, getLessonById, getLessonsByLevel } = require('../controllers/lessonsController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/lessons:
 *   get:
 *     summary: Alle Lektionen abrufen (öffentlich zugänglich)
 *     tags: [Lessons]
 *     responses:
 *       200:
 *         description: Liste aller Lektionen
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lesson'
 */
router.get('/', getAllLessons);

/**
 * @swagger
 * /api/lessons/{id}:
 *   get:
 *     summary: Einzelne Lektion abrufen (öffentlich zugänglich)
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lektions-ID
 *     responses:
 *       200:
 *         description: Lektion gefunden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lesson'
 *       404:
 *         description: Lektion nicht gefunden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getLessonById);

/**
 * @swagger
 * /api/lessons/level/{level}:
 *   get:
 *     summary: Lektionen nach Level abrufen (öffentlich zugänglich)
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: level
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schwierigkeitsgrad
 *     responses:
 *       200:
 *         description: Liste der Lektionen
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lesson'
 */
router.get('/level/:level', getLessonsByLevel);

module.exports = router;
