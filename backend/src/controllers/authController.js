const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validiere Role
    const userRole = role === 'teacher' ? 'teacher' : 'student';

    // Validierung
    if (!username || !password) {
      return res.status(400).json({ error: 'Benutzername und Passwort sind erforderlich' });
    }

    // E-Mail ist Pflicht für Lehrer
    if (userRole === 'teacher' && !email) {
      return res.status(400).json({ error: 'E-Mail ist für Lehrer-Accounts erforderlich' });
    }

    // Prüfe ob Benutzername bereits existiert
    const usernameExists = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (usernameExists.rows.length > 0) {
      return res.status(400).json({ error: 'Benutzername bereits vergeben' });
    }

    // Prüfe ob E-Mail bereits existiert (nur wenn E-Mail angegeben)
    if (email && email.trim() !== '') {
      const emailExists = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (emailExists.rows.length > 0) {
        return res.status(400).json({ error: 'E-Mail bereits vergeben' });
      }
    }

    // Passwort hashen
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // E-Mail auf null setzen wenn leer
    const userEmail = (email && email.trim() !== '') ? email : null;

    // Benutzer erstellen
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
      [username, userEmail, passwordHash, userRole]
    );

    const user = result.rows[0];

    // Erstelle user_stats Eintrag
    await pool.query(
      'INSERT INTO user_stats (user_id) VALUES ($1)',
      [user.id]
    );

    // Token erstellen
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registrierung erfolgreich',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    res.status(500).json({ error: 'Serverfehler bei der Registrierung' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validierung
    if (!username || !password) {
      return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    }

    // Benutzer finden
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const user = result.rows[0];

    // Passwort prüfen
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // Token erstellen
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login erfolgreich',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler beim Login' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.created_at,
              s.total_lessons_completed, s.average_wpm, s.average_accuracy, s.total_practice_time
       FROM users u
       LEFT JOIN user_stats s ON u.id = s.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profil-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen des Profils' });
  }
};

module.exports = { register, login, getProfile };
