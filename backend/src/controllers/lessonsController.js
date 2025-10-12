const { pool } = require('../config/database');

const getAllLessons = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM lessons ORDER BY level ASC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Lektionen:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Lektionen' });
  }
};

const getLessonById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM lessons WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lektion nicht gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen der Lektion:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Lektion' });
  }
};

const getLessonsByLevel = async (req, res) => {
  try {
    const { level } = req.params;

    const result = await pool.query(
      'SELECT * FROM lessons WHERE level = $1 ORDER BY id ASC',
      [level]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Lektionen:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Lektionen' });
  }
};

module.exports = {
  getAllLessons,
  getLessonById,
  getLessonsByLevel
};
