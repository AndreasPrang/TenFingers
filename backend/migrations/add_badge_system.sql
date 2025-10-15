-- Migration: Badge System
-- Fügt Badge-System mit 8 Stufen hinzu

-- 1. Tabelle für User Badges (welche Badges ein User erreicht hat)
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_level INT NOT NULL CHECK (badge_level >= 1 AND badge_level <= 8),
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_level)
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- 2. Erweitere user_stats für Badge-Berechnung
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS current_badge_level INT DEFAULT 1 CHECK (current_badge_level >= 1 AND current_badge_level <= 8),
  ADD COLUMN IF NOT EXISTS lessons_completed_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lessons_completed_above_80 INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lessons_completed_above_85 INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lessons_completed_above_90 INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lessons_completed_above_95 INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lessons_completed_above_98 INT DEFAULT 0;

-- 3. Badge-Definitionen als View für einfache Abfrage
CREATE OR REPLACE VIEW badge_definitions AS
SELECT
  1 as level,
  'Anfänger' as name,
  '🥉' as icon,
  'bronze' as color,
  3 as min_lessons,
  10.0 as min_wpm,
  80.0 as min_accuracy,
  80.0 as min_lesson_accuracy
UNION ALL SELECT 2, 'Schreiber', '🥈', 'silver', 5, 20.0, 82.0, 80.0
UNION ALL SELECT 3, 'Tipper', '🥇', 'gold', 3, 30.0, 85.0, 85.0
UNION ALL SELECT 4, 'Schnellschreiber', '💎', 'platinum', 7, 40.0, 87.0, 85.0
UNION ALL SELECT 5, 'Tastatur-Profi', '💠', 'sapphire', 9, 50.0, 90.0, 90.0
UNION ALL SELECT 6, 'Tipp-Virtuose', '🔷', 'diamond', 11, 60.0, 92.0, 90.0
UNION ALL SELECT 7, 'Tastatur-Meister', '⭐', 'star', 11, 70.0, 95.0, 95.0
UNION ALL SELECT 8, 'Zehnfinger-Legende', '👑', 'crown', 11, 80.0, 98.0, 98.0;

-- 4. Funktion zum Neuberechnen des Badge-Levels eines Users
CREATE OR REPLACE FUNCTION calculate_user_badge_level(p_user_id INT)
RETURNS INT AS $$
DECLARE
  v_avg_wpm DECIMAL(5,2);
  v_avg_accuracy DECIMAL(5,2);
  v_lessons_completed INT;
  v_badge_level INT := 1;
BEGIN
  -- Berechne Durchschnittswerte aus abgeschlossenen Lektionen
  SELECT
    COALESCE(AVG(wpm), 0),
    COALESCE(AVG(accuracy), 0),
    COUNT(DISTINCT lesson_id)
  INTO v_avg_wpm, v_avg_accuracy, v_lessons_completed
  FROM progress
  WHERE user_id = p_user_id
    AND completed = true
    AND is_anonymous = false;

  -- Update user_stats mit aktuellen Werten
  UPDATE user_stats
  SET
    average_wpm = v_avg_wpm,
    average_accuracy = v_avg_accuracy,
    lessons_completed_count = v_lessons_completed,
    lessons_completed_above_80 = (
      SELECT COUNT(DISTINCT lesson_id)
      FROM progress
      WHERE user_id = p_user_id AND completed = true AND accuracy >= 80
    ),
    lessons_completed_above_85 = (
      SELECT COUNT(DISTINCT lesson_id)
      FROM progress
      WHERE user_id = p_user_id AND completed = true AND accuracy >= 85
    ),
    lessons_completed_above_90 = (
      SELECT COUNT(DISTINCT lesson_id)
      FROM progress
      WHERE user_id = p_user_id AND completed = true AND accuracy >= 90
    ),
    lessons_completed_above_95 = (
      SELECT COUNT(DISTINCT lesson_id)
      FROM progress
      WHERE user_id = p_user_id AND completed = true AND accuracy >= 95
    ),
    lessons_completed_above_98 = (
      SELECT COUNT(DISTINCT lesson_id)
      FROM progress
      WHERE user_id = p_user_id AND completed = true AND accuracy >= 98
    )
  WHERE user_id = p_user_id;

  -- Bestimme Badge-Level (von oben nach unten prüfen)
  -- Level 8: Zehnfinger-Legende
  IF v_lessons_completed >= 11 AND v_avg_wpm >= 80 AND v_avg_accuracy >= 98 AND
     (SELECT lessons_completed_above_98 FROM user_stats WHERE user_id = p_user_id) >= 11
  THEN
    v_badge_level := 8;
  -- Level 7: Tastatur-Meister
  ELSIF v_lessons_completed >= 11 AND v_avg_wpm >= 70 AND v_avg_accuracy >= 95 AND
        (SELECT lessons_completed_above_95 FROM user_stats WHERE user_id = p_user_id) >= 11
  THEN
    v_badge_level := 7;
  -- Level 6: Tipp-Virtuose
  ELSIF v_lessons_completed >= 11 AND v_avg_wpm >= 60 AND v_avg_accuracy >= 92 AND
        (SELECT lessons_completed_above_90 FROM user_stats WHERE user_id = p_user_id) >= 11
  THEN
    v_badge_level := 6;
  -- Level 5: Tastatur-Profi
  ELSIF v_lessons_completed >= 9 AND v_avg_wpm >= 50 AND v_avg_accuracy >= 90 AND
        (SELECT lessons_completed_above_90 FROM user_stats WHERE user_id = p_user_id) >= 9
  THEN
    v_badge_level := 5;
  -- Level 4: Schnellschreiber
  ELSIF v_lessons_completed >= 7 AND v_avg_wpm >= 40 AND v_avg_accuracy >= 87 AND
        (SELECT lessons_completed_above_85 FROM user_stats WHERE user_id = p_user_id) >= 7
  THEN
    v_badge_level := 4;
  -- Level 3: Tipper
  ELSIF v_lessons_completed >= 3 AND v_avg_wpm >= 30 AND v_avg_accuracy >= 85 AND
        (SELECT lessons_completed_above_85 FROM user_stats WHERE user_id = p_user_id) >= 3
  THEN
    v_badge_level := 3;
  -- Level 2: Schreiber
  ELSIF v_lessons_completed >= 5 AND v_avg_wpm >= 20 AND v_avg_accuracy >= 82 AND
        (SELECT lessons_completed_above_80 FROM user_stats WHERE user_id = p_user_id) >= 5
  THEN
    v_badge_level := 2;
  -- Level 1: Anfänger (Standard)
  ELSIF v_lessons_completed >= 3 AND v_avg_wpm >= 10 AND v_avg_accuracy >= 80 AND
        (SELECT lessons_completed_above_80 FROM user_stats WHERE user_id = p_user_id) >= 3
  THEN
    v_badge_level := 1;
  ELSE
    v_badge_level := 1; -- Standard: Level 1 (noch nicht erreicht, aber Platzhalter für UI)
  END IF;

  -- Update Badge-Level in user_stats
  UPDATE user_stats
  SET current_badge_level = v_badge_level
  WHERE user_id = p_user_id;

  -- Füge Badge zu user_badges hinzu wenn erreicht
  IF v_badge_level >= 1 AND
     v_lessons_completed >= 3 AND v_avg_wpm >= 10 AND v_avg_accuracy >= 80 AND
     (SELECT lessons_completed_above_80 FROM user_stats WHERE user_id = p_user_id) >= 3
  THEN
    INSERT INTO user_badges (user_id, badge_level)
    VALUES (p_user_id, v_badge_level)
    ON CONFLICT (user_id, badge_level) DO NOTHING;
  END IF;

  RETURN v_badge_level;
END;
$$ LANGUAGE plpgsql;

-- Kommentar für Dokumentation
COMMENT ON FUNCTION calculate_user_badge_level IS 'Berechnet das aktuelle Badge-Level eines Users basierend auf abgeschlossenen Lektionen, WPM und Genauigkeit';
