const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount,
  changePassword,
  requestPasswordReset,
  resetPassword
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Neuen Benutzer registrieren
 *     description: Registriert einen neuen Benutzer. E-Mail ist nur für Lehrer erforderlich, für Schüler optional.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: maxmustermann
 *               email:
 *                 type: string
 *                 example: max@example.com
 *                 description: Optional für Schüler, Pflicht für Lehrer
 *               password:
 *                 type: string
 *                 example: sicheres-passwort
 *               displayName:
 *                 type: string
 *                 example: Max Mustermann
 *                 description: Optional - Anzeigename für persönliche Ansprache
 *               role:
 *                 type: string
 *                 enum: [student, teacher]
 *                 default: student
 *                 example: student
 *     responses:
 *       201:
 *         description: Registrierung erfolgreich
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       400:
 *         description: Validierungsfehler
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Benutzer anmelden
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: maxmustermann
 *               password:
 *                 type: string
 *                 example: sicheres-passwort
 *     responses:
 *       200:
 *         description: Login erfolgreich
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       401:
 *         description: Ungültige Anmeldedaten
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Benutzerprofil abrufen
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - $ref: '#/components/schemas/UserStats'
 *       401:
 *         description: Nicht authentifiziert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Profil aktualisieren
 *     description: Aktualisiert das Profil des angemeldeten Benutzers (z.B. Display Name)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 example: Max Mustermann
 *                 description: Anzeigename für persönliche Ansprache
 *     responses:
 *       200:
 *         description: Profil erfolgreich aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - $ref: '#/components/schemas/UserStats'
 *       401:
 *         description: Nicht authentifiziert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/profile', authenticateToken, updateProfile);

/**
 * @swagger
 * /api/auth/account:
 *   delete:
 *     summary: Account löschen
 *     description: Löscht den eigenen Account. Nur für selbst-registrierte Nutzer (nicht für Schüler, die von Lehrern erstellt wurden).
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account erfolgreich gelöscht
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Account kann nicht gelöscht werden (von Lehrer erstellt)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Nicht authentifiziert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/account', authenticateToken, deleteAccount);

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: Passwort ändern
 *     description: Ändert das Passwort des angemeldeten Benutzers
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: altesPasswort123
 *               newPassword:
 *                 type: string
 *                 example: neuesPasswort456
 *     responses:
 *       200:
 *         description: Passwort erfolgreich geändert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validierungsfehler
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Aktuelles Passwort falsch oder nicht authentifiziert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/password', authenticateToken, changePassword);

/**
 * @swagger
 * /api/auth/request-password-reset:
 *   post:
 *     summary: Passwort-Reset anfordern
 *     description: Sendet eine E-Mail mit Reset-Link, falls ein Account mit der angegebenen E-Mail oder dem Benutzernamen existiert
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usernameOrEmail
 *             properties:
 *               usernameOrEmail:
 *                 type: string
 *                 example: maxmustermann
 *                 description: Benutzername oder E-Mail-Adresse
 *     responses:
 *       200:
 *         description: Request erfolgreich verarbeitet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validierungsfehler
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Serverfehler
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/request-password-reset', requestPasswordReset);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Passwort mit Token zurücksetzen
 *     description: Setzt das Passwort mit einem gültigen Reset-Token zurück
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: a1b2c3d4e5f6...
 *                 description: Reset-Token aus der E-Mail
 *               newPassword:
 *                 type: string
 *                 example: neuesPasswort123
 *                 description: Neues Passwort (mindestens 6 Zeichen)
 *     responses:
 *       200:
 *         description: Passwort erfolgreich zurückgesetzt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Ungültiger oder abgelaufener Token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Serverfehler
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-password', resetPassword);

module.exports = router;
