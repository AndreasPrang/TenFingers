const { pool } = require('../config/database');

/**
 * Middleware: Prüfe ob User Admin ist
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Zugriff verweigert. Admin-Rechte erforderlich.' });
  }
  next();
};

/**
 * Dashboard-Übersicht mit wichtigsten Kennzahlen
 */
const getDashboardStats = async (req, res) => {
  try {
    // Gesamtanzahl User nach Rollen
    const userStats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'student') as total_students,
        COUNT(*) FILTER (WHERE role = 'teacher') as total_teachers,
        COUNT(*) FILTER (WHERE role = 'admin') as total_admins,
        COUNT(*) as total_users
      FROM users
    `);

    // Gesamtanzahl Klassen
    const classStats = await pool.query(`
      SELECT COUNT(*) as total_classes
      FROM classes
    `);

    // Gesamtanzahl Lektionen und Durchschnittswerte
    const lessonStats = await pool.query(`
      SELECT
        COUNT(*) as total_lessons_available,
        COUNT(DISTINCT lesson_id) as unique_lessons_practiced
      FROM lessons
      LEFT JOIN progress ON lessons.id = progress.lesson_id
    `);

    // Progress-Statistiken
    const progressStats = await pool.query(`
      SELECT
        COUNT(*) as total_practice_sessions,
        COUNT(*) FILTER (WHERE completed = true) as completed_sessions,
        ROUND(AVG(wpm), 2) as average_wpm,
        ROUND(AVG(accuracy), 2) as average_accuracy
      FROM progress
    `);

    // Aktivitätsstatistiken (letzten 7 Tage)
    const recentActivity = await pool.query(`
      SELECT
        COUNT(DISTINCT user_id) as active_users_7d,
        COUNT(*) as practice_sessions_7d
      FROM progress
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);

    // Aktivitätsstatistiken (letzten 30 Tage)
    const monthlyActivity = await pool.query(`
      SELECT
        COUNT(DISTINCT user_id) as active_users_30d,
        COUNT(*) as practice_sessions_30d
      FROM progress
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    // Registrierungen letzten 7 Tage
    const recentRegistrations = await pool.query(`
      SELECT COUNT(*) as registrations_7d
      FROM users
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);

    res.json({
      users: {
        total: parseInt(userStats.rows[0].total_users),
        students: parseInt(userStats.rows[0].total_students),
        teachers: parseInt(userStats.rows[0].total_teachers),
        admins: parseInt(userStats.rows[0].total_admins)
      },
      classes: {
        total: parseInt(classStats.rows[0].total_classes)
      },
      lessons: {
        available: parseInt(lessonStats.rows[0].total_lessons_available),
        practiced: parseInt(lessonStats.rows[0].unique_lessons_practiced)
      },
      progress: {
        totalSessions: parseInt(progressStats.rows[0].total_practice_sessions),
        completedSessions: parseInt(progressStats.rows[0].completed_sessions),
        averageWpm: parseFloat(progressStats.rows[0].average_wpm) || 0,
        averageAccuracy: parseFloat(progressStats.rows[0].average_accuracy) || 0
      },
      activity: {
        activeUsers7d: parseInt(recentActivity.rows[0].active_users_7d),
        practiceSessions7d: parseInt(recentActivity.rows[0].practice_sessions_7d),
        activeUsers30d: parseInt(monthlyActivity.rows[0].active_users_30d),
        practiceSessions30d: parseInt(monthlyActivity.rows[0].practice_sessions_30d),
        registrations7d: parseInt(recentRegistrations.rows[0].registrations_7d)
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Dashboard-Statistiken:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Statistiken' });
  }
};

/**
 * Zeitverlauf-Daten für Graphen
 * Liefert tägliche Statistiken für die letzten 30 Tage
 */
const getTimeSeriesData = async (req, res) => {
  try {
    const { metric, days } = req.query;
    const daysInt = parseInt(days) || 30;

    if (daysInt > 365) {
      return res.status(400).json({ error: 'Maximaler Zeitraum: 365 Tage' });
    }

    let query;

    switch (metric) {
      case 'registrations':
        query = `
          SELECT
            DATE(created_at) as date,
            COUNT(*) as value
          FROM users
          WHERE created_at >= NOW() - INTERVAL '${daysInt} days'
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        break;

      case 'practice_sessions':
        query = `
          SELECT
            DATE(created_at) as date,
            COUNT(*) as value
          FROM progress
          WHERE created_at >= NOW() - INTERVAL '${daysInt} days'
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        break;

      case 'active_users':
        query = `
          SELECT
            DATE(created_at) as date,
            COUNT(DISTINCT user_id) as value
          FROM progress
          WHERE created_at >= NOW() - INTERVAL '${daysInt} days'
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        break;

      case 'average_wpm':
        query = `
          SELECT
            DATE(created_at) as date,
            ROUND(AVG(wpm), 2) as value
          FROM progress
          WHERE created_at >= NOW() - INTERVAL '${daysInt} days'
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        break;

      case 'average_accuracy':
        query = `
          SELECT
            DATE(created_at) as date,
            ROUND(AVG(accuracy), 2) as value
          FROM progress
          WHERE created_at >= NOW() - INTERVAL '${daysInt} days'
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        break;

      default:
        return res.status(400).json({
          error: 'Ungültige Metrik. Verfügbar: registrations, practice_sessions, active_users, average_wpm, average_accuracy'
        });
    }

    const result = await pool.query(query);

    res.json({
      metric,
      days: daysInt,
      data: result.rows.map(row => ({
        date: row.date,
        value: metric.includes('average') ? parseFloat(row.value) : parseInt(row.value)
      }))
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Zeitverlauf-Daten:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Zeitverlauf-Daten' });
  }
};

/**
 * Leistungsverteilungen (anonymisiert)
 * Zeigt Verteilung von WPM und Accuracy über alle User
 */
const getPerformanceDistribution = async (req, res) => {
  try {
    // WPM-Verteilung in 10er-Schritten
    const wpmDistribution = await pool.query(`
      SELECT
        CASE
          WHEN average_wpm < 10 THEN '0-10'
          WHEN average_wpm < 20 THEN '10-20'
          WHEN average_wpm < 30 THEN '20-30'
          WHEN average_wpm < 40 THEN '30-40'
          WHEN average_wpm < 50 THEN '40-50'
          WHEN average_wpm < 60 THEN '50-60'
          WHEN average_wpm < 70 THEN '60-70'
          WHEN average_wpm < 80 THEN '70-80'
          ELSE '80+'
        END as wpm_range,
        COUNT(*) as count
      FROM user_stats
      WHERE average_wpm > 0
      GROUP BY wpm_range
      ORDER BY wpm_range
    `);

    // Accuracy-Verteilung in 10%-Schritten
    const accuracyDistribution = await pool.query(`
      SELECT
        CASE
          WHEN average_accuracy < 60 THEN '0-60%'
          WHEN average_accuracy < 70 THEN '60-70%'
          WHEN average_accuracy < 80 THEN '70-80%'
          WHEN average_accuracy < 90 THEN '80-90%'
          ELSE '90-100%'
        END as accuracy_range,
        COUNT(*) as count
      FROM user_stats
      WHERE average_accuracy > 0
      GROUP BY accuracy_range
      ORDER BY accuracy_range
    `);

    // Lektionen-Fortschritt-Verteilung
    const lessonsDistribution = await pool.query(`
      SELECT
        CASE
          WHEN total_lessons_completed = 0 THEN '0'
          WHEN total_lessons_completed <= 3 THEN '1-3'
          WHEN total_lessons_completed <= 6 THEN '4-6'
          WHEN total_lessons_completed <= 9 THEN '7-9'
          ELSE '10+'
        END as lessons_range,
        COUNT(*) as count
      FROM user_stats
      GROUP BY lessons_range
      ORDER BY lessons_range
    `);

    res.json({
      wpmDistribution: wpmDistribution.rows,
      accuracyDistribution: accuracyDistribution.rows,
      lessonsDistribution: lessonsDistribution.rows
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Leistungsverteilung:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Leistungsverteilung' });
  }
};

/**
 * Beliebteste Lektionen (anonymisiert)
 */
const getPopularLessons = async (req, res) => {
  try {
    const popularLessons = await pool.query(`
      SELECT
        l.id,
        l.title,
        l.level,
        COUNT(DISTINCT p.user_id) as unique_users,
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE p.completed = true) as completed_count,
        ROUND(AVG(p.wpm), 2) as average_wpm,
        ROUND(AVG(p.accuracy), 2) as average_accuracy
      FROM lessons l
      LEFT JOIN progress p ON l.id = p.lesson_id
      GROUP BY l.id, l.title, l.level
      ORDER BY unique_users DESC, total_attempts DESC
      LIMIT 10
    `);

    res.json({
      lessons: popularLessons.rows.map(row => ({
        id: row.id,
        title: row.title,
        level: row.level,
        uniqueUsers: parseInt(row.unique_users) || 0,
        totalAttempts: parseInt(row.total_attempts) || 0,
        completedCount: parseInt(row.completed_count) || 0,
        averageWpm: parseFloat(row.average_wpm) || 0,
        averageAccuracy: parseFloat(row.average_accuracy) || 0
      }))
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der beliebtesten Lektionen:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der beliebtesten Lektionen' });
  }
};

module.exports = {
  requireAdmin,
  getDashboardStats,
  getTimeSeriesData,
  getPerformanceDistribution,
  getPopularLessons
};
