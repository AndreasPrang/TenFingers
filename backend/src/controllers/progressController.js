const { pool } = require('../config/database');

const saveProgress = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const { lesson_id, wpm, accuracy, completed, is_anonymous } = req.body;

    console.log('📊 SaveProgress called:', { userId, lesson_id, wpm, accuracy, completed, is_anonymous, hasUser: !!req.user });

    // Validierung
    if (!lesson_id || wpm === undefined || accuracy === undefined) {
      console.log('❌ Validation failed');
      return res.status(400).json({ error: 'Lektion-ID, WPM und Genauigkeit sind erforderlich' });
    }

    // Speichere Fortschritt
    const result = await pool.query(
      `INSERT INTO progress (user_id, lesson_id, wpm, accuracy, completed, completed_at, is_anonymous)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, lesson_id, wpm, accuracy, completed || false, completed ? new Date() : null, is_anonymous || false]
    );

    // Aktualisiere User-Statistiken nur für registrierte Nutzer
    if (userId) {
      await updateUserStats(userId);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Speichern des Fortschritts:', error);
    res.status(500).json({ error: 'Serverfehler beim Speichern des Fortschritts' });
  }
};

const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT p.*, l.title, l.level
       FROM progress p
       JOIN lessons l ON p.lesson_id = l.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen des Fortschritts:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen des Fortschritts' });
  }
};

const getLessonProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { lessonId } = req.params;

    const result = await pool.query(
      `SELECT p.*, l.title, l.level
       FROM progress p
       JOIN lessons l ON p.lesson_id = l.id
       WHERE p.user_id = $1 AND p.lesson_id = $2
       ORDER BY p.created_at DESC`,
      [userId, lessonId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen des Lektions-Fortschritts:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen des Lektions-Fortschritts' });
  }
};

const getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM user_stats WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Statistiken nicht gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen der Statistiken:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Statistiken' });
  }
};

// Hilfsfunktion zum Aktualisieren der User-Statistiken
const updateUserStats = async (userId) => {
  try {
    // Berechne Statistiken aus allen abgeschlossenen Übungen
    const stats = await pool.query(
      `SELECT
        COUNT(DISTINCT lesson_id) FILTER (WHERE completed = true) as lessons_completed,
        AVG(wpm) as avg_wpm,
        AVG(accuracy) as avg_accuracy
       FROM progress
       WHERE user_id = $1`,
      [userId]
    );

    const { lessons_completed, avg_wpm, avg_accuracy } = stats.rows[0];

    // Aktualisiere user_stats
    await pool.query(
      `UPDATE user_stats
       SET total_lessons_completed = $1,
           average_wpm = $2,
           average_accuracy = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4`,
      [lessons_completed || 0, avg_wpm || 0, avg_accuracy || 0, userId]
    );
  } catch (error) {
    console.error('Fehler beim Aktualisieren der User-Statistiken:', error);
  }
};

module.exports = {
  saveProgress,
  getUserProgress,
  getLessonProgress,
  getUserStats
};
