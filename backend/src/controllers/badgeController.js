const { pool } = require('../config/database');

/**
 * Badge-Definitionen (entspricht badge_definitions View in DB)
 */
const BADGE_DEFINITIONS = [
  { level: 1, name: 'Anfänger', icon: '🥉', color: 'bronze', minLessons: 3, minWpm: 10, minAccuracy: 80, minLessonAccuracy: 80 },
  { level: 2, name: 'Schreiber', icon: '🥈', color: 'silver', minLessons: 5, minWpm: 20, minAccuracy: 82, minLessonAccuracy: 80 },
  { level: 3, name: 'Tipper', icon: '🥇', color: 'gold', minLessons: 3, minWpm: 30, minAccuracy: 85, minLessonAccuracy: 85 },
  { level: 4, name: 'Schnellschreiber', icon: '💎', color: 'platinum', minLessons: 7, minWpm: 40, minAccuracy: 87, minLessonAccuracy: 85 },
  { level: 5, name: 'Tastatur-Profi', icon: '💠', color: 'sapphire', minLessons: 9, minWpm: 50, minAccuracy: 90, minLessonAccuracy: 90 },
  { level: 6, name: 'Tipp-Virtuose', icon: '🔷', color: 'diamond', minLessons: 11, minWpm: 60, minAccuracy: 92, minLessonAccuracy: 90 },
  { level: 7, name: 'Tastatur-Meister', icon: '⭐', color: 'star', minLessons: 11, minWpm: 70, minAccuracy: 95, minLessonAccuracy: 95 },
  { level: 8, name: 'Zehnfinger-Legende', icon: '👑', color: 'crown', minLessons: 11, minWpm: 80, minAccuracy: 98, minLessonAccuracy: 98 }
];

/**
 * Gibt alle Badge-Definitionen zurück
 */
const getBadgeDefinitions = async (req, res) => {
  try {
    res.json(BADGE_DEFINITIONS);
  } catch (error) {
    console.error('Fehler beim Abrufen der Badge-Definitionen:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Badge-Definitionen' });
  }
};

/**
 * Gibt das aktuelle Badge des eingeloggten Users zurück
 */
const getCurrentBadge = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Badge-Level neu berechnen
    await pool.query('SELECT calculate_user_badge_level($1)', [userId]);

    // Hole aktuelles Badge mit allen Details
    const result = await pool.query(
      `SELECT
        us.current_badge_level,
        us.average_wpm,
        us.average_accuracy,
        us.lessons_completed_count,
        us.lessons_completed_above_80,
        us.lessons_completed_above_85,
        us.lessons_completed_above_90,
        us.lessons_completed_above_95,
        us.lessons_completed_above_98,
        (SELECT earned_at FROM user_badges WHERE user_id = $1 AND badge_level = us.current_badge_level ORDER BY earned_at DESC LIMIT 1) as earned_at
      FROM user_stats us
      WHERE us.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Keine Statistiken gefunden' });
    }

    const stats = result.rows[0];
    const currentLevel = stats.current_badge_level;

    // Finde Badge-Definition
    const currentBadge = BADGE_DEFINITIONS.find(b => b.level === currentLevel);
    const nextBadge = BADGE_DEFINITIONS.find(b => b.level === currentLevel + 1);

    res.json({
      currentBadge: currentBadge ? {
        ...currentBadge,
        earnedAt: stats.earned_at
      } : null,
      nextBadge: nextBadge || null,
      stats: {
        avgWpm: parseFloat(stats.average_wpm) || 0,
        avgAccuracy: parseFloat(stats.average_accuracy) || 0,
        lessonsCompleted: stats.lessons_completed_count || 0,
        lessonsAbove80: stats.lessons_completed_above_80 || 0,
        lessonsAbove85: stats.lessons_completed_above_85 || 0,
        lessonsAbove90: stats.lessons_completed_above_90 || 0,
        lessonsAbove95: stats.lessons_completed_above_95 || 0,
        lessonsAbove98: stats.lessons_completed_above_98 || 0
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des aktuellen Badges:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen des Badges' });
  }
};

/**
 * Gibt Fortschritt zum nächsten Badge zurück
 */
const getBadgeProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Hole aktuelle Stats
    const result = await pool.query(
      `SELECT
        us.current_badge_level,
        us.average_wpm,
        us.average_accuracy,
        us.lessons_completed_count,
        us.lessons_completed_above_80,
        us.lessons_completed_above_85,
        us.lessons_completed_above_90,
        us.lessons_completed_above_95,
        us.lessons_completed_above_98
      FROM user_stats us
      WHERE us.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Keine Statistiken gefunden' });
    }

    const stats = result.rows[0];
    const currentLevel = stats.current_badge_level;
    const nextBadge = BADGE_DEFINITIONS.find(b => b.level === currentLevel + 1);

    if (!nextBadge) {
      return res.json({
        isMaxLevel: true,
        message: 'Du hast das höchste Badge erreicht! 👑'
      });
    }

    // Bestimme welche Lessons-Spalte relevant ist
    let lessonsCompletedKey = 'lessons_completed_above_80';
    if (nextBadge.minLessonAccuracy >= 98) lessonsCompletedKey = 'lessons_completed_above_98';
    else if (nextBadge.minLessonAccuracy >= 95) lessonsCompletedKey = 'lessons_completed_above_95';
    else if (nextBadge.minLessonAccuracy >= 90) lessonsCompletedKey = 'lessons_completed_above_90';
    else if (nextBadge.minLessonAccuracy >= 85) lessonsCompletedKey = 'lessons_completed_above_85';

    const currentLessons = stats[lessonsCompletedKey] || 0;
    const currentWpm = parseFloat(stats.average_wpm) || 0;
    const currentAccuracy = parseFloat(stats.average_accuracy) || 0;

    // Berechne Fortschritt in Prozent für jede Anforderung
    const lessonsProgress = Math.min(100, (currentLessons / nextBadge.minLessons) * 100);
    const wpmProgress = Math.min(100, (currentWpm / nextBadge.minWpm) * 100);
    const accuracyProgress = Math.min(100, (currentAccuracy / nextBadge.minAccuracy) * 100);

    res.json({
      nextBadge,
      requirements: {
        lessons: {
          current: currentLessons,
          required: nextBadge.minLessons,
          progress: lessonsProgress,
          met: currentLessons >= nextBadge.minLessons,
          description: `${nextBadge.minLessons} Lektionen mit ${nextBadge.minLessonAccuracy}%+ Genauigkeit`
        },
        wpm: {
          current: currentWpm,
          required: nextBadge.minWpm,
          progress: wpmProgress,
          met: currentWpm >= nextBadge.minWpm,
          description: `${nextBadge.minWpm} WPM Durchschnitt`
        },
        accuracy: {
          current: currentAccuracy,
          required: nextBadge.minAccuracy,
          progress: accuracyProgress,
          met: currentAccuracy >= nextBadge.minAccuracy,
          description: `${nextBadge.minAccuracy}% Genauigkeit Durchschnitt`
        }
      },
      overallProgress: (lessonsProgress + wpmProgress + accuracyProgress) / 3
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Badge-Fortschritts:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen des Fortschritts' });
  }
};

/**
 * Gibt alle erreichten Badges eines Users zurück
 */
const getUserBadges = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT badge_level, earned_at
      FROM user_badges
      WHERE user_id = $1
      ORDER BY badge_level ASC`,
      [userId]
    );

    const earnedBadges = result.rows.map(row => ({
      ...BADGE_DEFINITIONS.find(b => b.level === row.badge_level),
      earnedAt: row.earned_at
    }));

    // Alle Badges mit Status (earned/locked)
    const allBadges = BADGE_DEFINITIONS.map(badge => ({
      ...badge,
      earned: earnedBadges.some(b => b.level === badge.level),
      earnedAt: earnedBadges.find(b => b.level === badge.level)?.earnedAt || null
    }));

    res.json({
      badges: allBadges,
      earnedCount: earnedBadges.length,
      totalCount: BADGE_DEFINITIONS.length
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der User-Badges:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Badges' });
  }
};

module.exports = {
  getBadgeDefinitions,
  getCurrentBadge,
  getBadgeProgress,
  getUserBadges
};
