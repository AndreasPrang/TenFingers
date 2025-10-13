const express = require('express');
const router = express.Router();
const { getRandomPracticeText } = require('../controllers/practiceController');

/**
 * @swagger
 * /api/practice/random:
 *   get:
 *     summary: Get random practice text
 *     description: Returns a random German text for typing practice on the home page
 *     tags: [Practice]
 *     responses:
 *       200:
 *         description: Random practice text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 text:
 *                   type: string
 */
router.get('/random', getRandomPracticeText);

module.exports = router;
