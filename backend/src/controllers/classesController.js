const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

// Erstelle eine neue Klasse
const createClass = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { name } = req.body;

    // Validierung
    if (!name) {
      return res.status(400).json({ error: 'Klassenname ist erforderlich' });
    }

    // Prüfe ob User ein Lehrer ist
    const teacherCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [teacherId]
    );

    if (teacherCheck.rows.length === 0 || teacherCheck.rows[0].role !== 'teacher') {
      return res.status(403).json({ error: 'Nur Lehrer können Klassen erstellen' });
    }

    // Erstelle Klasse
    const result = await pool.query(
      'INSERT INTO classes (name, teacher_id) VALUES ($1, $2) RETURNING id, name, teacher_id, created_at',
      [name, teacherId]
    );

    res.status(201).json({
      message: 'Klasse erfolgreich erstellt',
      class: result.rows[0]
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der Klasse:', error);
    res.status(500).json({ error: 'Serverfehler beim Erstellen der Klasse' });
  }
};

// Alle Klassen eines Lehrers abrufen
const getTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    const result = await pool.query(
      `SELECT c.id, c.name, c.created_at,
              COUNT(u.id) as student_count
       FROM classes c
       LEFT JOIN users u ON u.class_id = c.id
       WHERE c.teacher_id = $1
       GROUP BY c.id, c.name, c.created_at
       ORDER BY c.created_at DESC`,
      [teacherId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Klassen:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Klassen' });
  }
};

// Einzelne Klasse mit Details abrufen
const getClassById = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.id, c.name, c.created_at, c.teacher_id
       FROM classes c
       WHERE c.id = $1 AND c.teacher_id = $2`,
      [id, teacherId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Klasse nicht gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen der Klasse:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Klasse' });
  }
};

// Schüler zur Klasse hinzufügen
const addStudentToClass = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;
    const { username, email, password } = req.body;

    // Validierung - nur Benutzername und Passwort sind erforderlich
    if (!username || !password) {
      return res.status(400).json({ error: 'Benutzername und Passwort sind erforderlich' });
    }

    // Prüfe ob Klasse dem Lehrer gehört
    const classCheck = await pool.query(
      'SELECT * FROM classes WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Klasse nicht gefunden oder keine Berechtigung' });
    }

    // Prüfe ob Benutzername bereits existiert
    const usernameCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Benutzername bereits vergeben' });
    }

    // Prüfe ob E-Mail bereits existiert (nur wenn E-Mail angegeben wurde)
    if (email) {
      const emailCheck = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'E-Mail bereits vergeben' });
      }
    }

    // Passwort hashen
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Erstelle Schüler-Account
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role, class_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, class_id, created_at',
      [username, email || null, passwordHash, 'student', id]
    );

    const student = result.rows[0];

    // Erstelle user_stats Eintrag
    await pool.query(
      'INSERT INTO user_stats (user_id) VALUES ($1)',
      [student.id]
    );

    res.status(201).json({
      message: 'Schüler erfolgreich erstellt',
      student: {
        id: student.id,
        username: student.username,
        email: student.email,
        role: student.role,
        classId: student.class_id,
        createdAt: student.created_at
      }
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Schülers:', error);
    res.status(500).json({ error: 'Serverfehler beim Erstellen des Schülers' });
  }
};

// Alle Schüler einer Klasse abrufen
const getClassStudents = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;

    // Prüfe ob Klasse dem Lehrer gehört
    const classCheck = await pool.query(
      'SELECT * FROM classes WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Klasse nicht gefunden oder keine Berechtigung' });
    }

    // Hole alle Schüler der Klasse
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.created_at,
              s.total_lessons_completed, s.average_wpm, s.average_accuracy
       FROM users u
       LEFT JOIN user_stats s ON u.id = s.user_id
       WHERE u.class_id = $1
       ORDER BY u.username ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Schüler:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Schüler' });
  }
};

// Fortschritt aller Schüler einer Klasse abrufen
const getClassProgress = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;

    // Prüfe ob Klasse dem Lehrer gehört
    const classCheck = await pool.query(
      'SELECT * FROM classes WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Klasse nicht gefunden oder keine Berechtigung' });
    }

    // Hole detaillierten Fortschritt aller Schüler
    const result = await pool.query(
      `SELECT
        u.id as student_id,
        u.username,
        s.total_lessons_completed,
        s.average_wpm,
        s.average_accuracy,
        s.total_practice_time,
        COUNT(DISTINCT p.lesson_id) as lessons_attempted,
        MAX(p.created_at) as last_practice
       FROM users u
       LEFT JOIN user_stats s ON u.id = s.user_id
       LEFT JOIN progress p ON u.id = p.user_id
       WHERE u.class_id = $1
       GROUP BY u.id, u.username, s.total_lessons_completed, s.average_wpm, s.average_accuracy, s.total_practice_time
       ORDER BY s.total_lessons_completed DESC, s.average_wpm DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen des Klassenfortschritts:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen des Klassenfortschritts' });
  }
};

// Mehrere Schüler gleichzeitig zur Klasse hinzufügen
const bulkCreateStudents = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;
    const { names } = req.body;

    // Validierung
    if (!names || !Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ error: 'Namen-Array ist erforderlich' });
    }

    if (names.length > 35) {
      return res.status(400).json({ error: 'Maximal 35 Schüler können gleichzeitig erstellt werden' });
    }

    // Prüfe ob Klasse dem Lehrer gehört
    const classCheck = await pool.query(
      'SELECT * FROM classes WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Klasse nicht gefunden oder keine Berechtigung' });
    }

    // Funktion zum Generieren sicherer Passwörter
    const generatePassword = () => {
      const length = 10;
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
      let password = '';
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
      }
      return password;
    };

    const createdStudents = [];
    const errors = [];

    // Erstelle jeden Schüler einzeln
    for (const name of names) {
      try {
        const trimmedName = name.trim();

        if (!trimmedName) {
          errors.push({ name: name, error: 'Name ist leer' });
          continue;
        }

        // Prüfe ob Benutzername bereits existiert
        const usernameCheck = await pool.query(
          'SELECT * FROM users WHERE username = $1',
          [trimmedName]
        );

        if (usernameCheck.rows.length > 0) {
          errors.push({ name: trimmedName, error: 'Benutzername bereits vergeben' });
          continue;
        }

        // Generiere Passwort
        const generatedPassword = generatePassword();
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(generatedPassword, saltRounds);

        // Erstelle Schüler-Account
        const result = await pool.query(
          'INSERT INTO users (username, password_hash, role, class_id) VALUES ($1, $2, $3, $4) RETURNING id, username, created_at',
          [trimmedName, passwordHash, 'student', id]
        );

        const student = result.rows[0];

        // Erstelle user_stats Eintrag
        await pool.query(
          'INSERT INTO user_stats (user_id) VALUES ($1)',
          [student.id]
        );

        // Speichere ungehashtes Passwort für Rückgabe
        createdStudents.push({
          id: student.id,
          username: student.username,
          password: generatedPassword,
          createdAt: student.created_at
        });
      } catch (error) {
        console.error(`Fehler beim Erstellen von Schüler ${name}:`, error);
        errors.push({ name: name, error: 'Fehler beim Erstellen' });
      }
    }

    res.status(201).json({
      message: `${createdStudents.length} Schüler erfolgreich erstellt`,
      students: createdStudents,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Fehler beim Bulk-Erstellen von Schülern:', error);
    res.status(500).json({ error: 'Serverfehler beim Erstellen der Schüler' });
  }
};

// Schüler bearbeiten
const updateStudent = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { classId, studentId } = req.params;
    const { username, email, password } = req.body;

    // Validierung
    if (!username) {
      return res.status(400).json({ error: 'Benutzername ist erforderlich' });
    }

    // Prüfe ob Klasse dem Lehrer gehört
    const classCheck = await pool.query(
      'SELECT * FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Klasse nicht gefunden oder keine Berechtigung' });
    }

    // Prüfe ob Schüler zur Klasse gehört
    const studentCheck = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND class_id = $2',
      [studentId, classId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Schüler nicht gefunden oder gehört nicht zur Klasse' });
    }

    // Prüfe ob Benutzername bereits von anderem User verwendet wird
    const usernameCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND id != $2',
      [username, studentId]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Benutzername bereits vergeben' });
    }

    // Prüfe ob E-Mail bereits von anderem User verwendet wird (wenn angegeben)
    if (email) {
      const emailCheck = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND id != $2',
        [email, studentId]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'E-Mail bereits vergeben' });
      }
    }

    // Update Schüler-Daten
    let updateQuery = 'UPDATE users SET username = $1, email = $2';
    let queryParams = [username, email || null, studentId];

    // Wenn Passwort angegeben wurde, auch dieses aktualisieren
    if (password) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      updateQuery = 'UPDATE users SET username = $1, email = $2, password_hash = $3 WHERE id = $4 RETURNING id, username, email, role, class_id, created_at';
      queryParams = [username, email || null, passwordHash, studentId];
    } else {
      updateQuery = 'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email, role, class_id, created_at';
    }

    const result = await pool.query(updateQuery, queryParams);

    res.json({
      message: 'Schüler erfolgreich aktualisiert',
      student: result.rows[0]
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Schülers:', error);
    res.status(500).json({ error: 'Serverfehler beim Aktualisieren des Schülers' });
  }
};

// Schüler löschen
const deleteStudent = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { classId, studentId } = req.params;

    // Prüfe ob Klasse dem Lehrer gehört
    const classCheck = await pool.query(
      'SELECT * FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Klasse nicht gefunden oder keine Berechtigung' });
    }

    // Prüfe ob Schüler zur Klasse gehört
    const studentCheck = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND class_id = $2',
      [studentId, classId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Schüler nicht gefunden oder gehört nicht zur Klasse' });
    }

    // Lösche Schüler (CASCADE löscht automatisch progress und user_stats)
    await pool.query(
      'DELETE FROM users WHERE id = $1',
      [studentId]
    );

    res.json({ message: 'Schüler erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Schülers:', error);
    res.status(500).json({ error: 'Serverfehler beim Löschen des Schülers' });
  }
};

// Klasse löschen
const deleteClass = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;

    // Prüfe ob Klasse dem Lehrer gehört
    const classCheck = await pool.query(
      'SELECT * FROM classes WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Klasse nicht gefunden oder keine Berechtigung' });
    }

    // Setze class_id aller Schüler auf NULL (anstatt sie zu löschen)
    await pool.query(
      'UPDATE users SET class_id = NULL WHERE class_id = $1',
      [id]
    );

    // Lösche Klasse
    await pool.query(
      'DELETE FROM classes WHERE id = $1',
      [id]
    );

    res.json({ message: 'Klasse erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Klasse:', error);
    res.status(500).json({ error: 'Serverfehler beim Löschen der Klasse' });
  }
};

module.exports = {
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
};
