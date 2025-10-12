const express = require('express');
const router = express.Router();
const {
  createClass,
  getTeacherClasses,
  getClassById,
  addStudentToClass,
  bulkCreateStudents,
  getClassStudents,
  getClassProgress,
  updateStudent,
  deleteStudent,
  deleteClass
} = require('../controllers/classesController');
const { authenticateToken } = require('../middleware/auth');

// Alle Routes benötigen Authentifizierung
router.use(authenticateToken);

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Erstelle eine neue Klasse
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Klasse erfolgreich erstellt
 */
router.post('/', createClass);

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Hole alle Klassen eines Lehrers
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste aller Klassen
 */
router.get('/', getTeacherClasses);

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Hole Details einer Klasse
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Klassendetails
 */
router.get('/:id', getClassById);

/**
 * @swagger
 * /api/classes/{id}/students:
 *   post:
 *     summary: Füge einen Schüler zur Klasse hinzu
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Schüler erfolgreich erstellt
 */
router.post('/:id/students', addStudentToClass);

/**
 * @swagger
 * /api/classes/{id}/students/bulk:
 *   post:
 *     summary: Erstelle mehrere Schüler gleichzeitig (bis zu 35)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               names:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Schüler erfolgreich erstellt mit generierten Passwörtern
 */
router.post('/:id/students/bulk', bulkCreateStudents);

/**
 * @swagger
 * /api/classes/{id}/students:
 *   get:
 *     summary: Hole alle Schüler einer Klasse
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste aller Schüler
 */
router.get('/:id/students', getClassStudents);

/**
 * @swagger
 * /api/classes/{id}/progress:
 *   get:
 *     summary: Hole Fortschritt aller Schüler einer Klasse
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fortschrittsübersicht
 */
router.get('/:id/progress', getClassProgress);

/**
 * @swagger
 * /api/classes/{classId}/students/{studentId}:
 *   put:
 *     summary: Aktualisiere Schüler-Daten
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Schüler erfolgreich aktualisiert
 */
router.put('/:classId/students/:studentId', updateStudent);

/**
 * @swagger
 * /api/classes/{classId}/students/{studentId}:
 *   delete:
 *     summary: Lösche einen Schüler
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schüler erfolgreich gelöscht
 */
router.delete('/:classId/students/:studentId', deleteStudent);

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: Lösche eine Klasse
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Klasse erfolgreich gelöscht
 */
router.delete('/:id', deleteClass);

module.exports = router;
