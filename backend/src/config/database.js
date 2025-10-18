const { Pool } = require('pg');

// Unterstütze sowohl DATABASE_URL als auch individuelle Variablen
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'tenfingers',
        user: process.env.DB_USER || 'tenfingers_user',
        password: process.env.DB_PASSWORD,
      }
);

// Teste die Verbindung beim Start
pool.connect((err, client, release) => {
  if (err) {
    console.error('Fehler bei der Datenbankverbindung:', err.stack);
  } else {
    console.log('✓ Datenbankverbindung erfolgreich hergestellt');
    release();
  }
});

// Definition der Standard-Lektionen
const getDefaultLessons = () => {
  const homePracticeTexts = require('./homePracticeTexts');

  return [
    {
      title: 'Freies Training',
      description: 'Übe mit 110 verschiedenen jugendgerechten Sätzen - bei jedem Start wird ein zufälliger Text ausgewählt!',
      level: 0,
      text_content: homePracticeTexts.join('|'),
      target_keys: 'alle',
      lesson_type: 'normal',
      is_extra: true
    },
    {
      title: 'Grundreihe - ASDF JKL',
      description: 'Lerne die Grundposition deiner Finger auf der Tastatur',
      level: 1,
      text_content: 'asdf jkl asdf jkl fff jjj aaa lll sss kkk ddd fff jjj',
      target_keys: 'asdf jkl'
    },
    {
      title: 'Grundreihe - Erweitert',
      description: 'Übe alle Buchstaben der Grundreihe',
      level: 2,
      text_content: 'asdf jkl geh fall has das falllag glas half flak',
      target_keys: 'asdfghjkl'
    },
    {
      title: 'Obere Reihe - QWE RUI',
      description: 'Erweitere dein Können auf die obere Reihe',
      level: 3,
      text_content: 'wir euer quere rue aqua drei wer wie reihe weiss',
      target_keys: 'qwerui'
    },
    {
      title: 'Obere Reihe - Komplett',
      description: 'Alle Buchstaben der oberen Reihe',
      level: 4,
      text_content: 'quer top port zwei typ reiter port power query top',
      target_keys: 'qwertzuiop'
    },
    {
      title: 'Untere Reihe - YXC VBN',
      description: 'Lerne die untere Reihe kennen',
      level: 5,
      text_content: 'mix box cyan neben brav nova mixen babyixen',
      target_keys: 'yxcvbn'
    },
    {
      title: 'Alle Buchstaben',
      description: 'Kombiniere alle gelernten Buchstaben',
      level: 6,
      text_content: 'das schnelle braune pferd springt ueber den faulen hund',
      target_keys: 'alle'
    },
    {
      title: 'Zahlen 1-5',
      description: 'Übe die Zahlen der linken Hand',
      level: 7,
      text_content: '123 234 345 111 222 333 444 555 1234 2345 3451',
      target_keys: '12345'
    },
    {
      title: 'Zahlen 6-0',
      description: 'Übe die Zahlen der rechten Hand',
      level: 8,
      text_content: '678 789 890 666 777 888 999 000 6789 7890 8901',
      target_keys: '67890'
    },
    {
      title: 'Satzzeichen',
      description: 'Lerne die wichtigsten Satzzeichen',
      level: 9,
      text_content: 'hallo, wie geht es dir? mir geht es gut! super. toll!',
      target_keys: ',.!?'
    },
    {
      title: 'Freier Text',
      description: 'Teste deine Fähigkeiten mit einem kompletten Text',
      level: 10,
      text_content: 'übung macht den meister. je mehr du tippst, desto schneller wirst du. bleib am ball und du wirst erfolg haben!',
      target_keys: 'alle',
      lesson_type: 'normal'
    },
    {
      title: 'Dino Runner',
      description: 'Springe über Hindernisse, indem du die angezeigten Buchstaben rechtzeitig tippst! Ein spannendes Endless-Runner-Spiel.',
      level: 11,
      text_content: 'asdfghjkl',
      target_keys: 'asdfghjkl',
      lesson_type: 'runner',
      is_extra: true
    }
  ];
};

// Migrationen für bestehende Datenbanken
const runMigrations = async () => {
  try {
    // Migration: Füge role und class_id zu users hinzu, falls nicht vorhanden
    const checkRole = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='users' AND column_name='role'
    `);

    if (checkRole.rows.length === 0) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN role VARCHAR(20) DEFAULT 'student',
        ADD COLUMN class_id INTEGER
      `);
      console.log('✓ Migration: role und class_id zu users hinzugefügt');
    }

    // Migration: Mache email-Feld optional für Schüler
    const checkEmailConstraint = await pool.query(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name='users' AND column_name='email'
    `);

    if (checkEmailConstraint.rows.length > 0 && checkEmailConstraint.rows[0].is_nullable === 'NO') {
      await pool.query(`
        ALTER TABLE users
        ALTER COLUMN email DROP NOT NULL
      `);
      console.log('✓ Migration: email-Feld ist jetzt optional');
    }

    // Migration: Füge display_name zu users hinzu, falls nicht vorhanden
    const checkDisplayName = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='users' AND column_name='display_name'
    `);

    if (checkDisplayName.rows.length === 0) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN display_name VARCHAR(100)
      `);
      console.log('✓ Migration: display_name zu users hinzugefügt');
    }

    // Migration: Füge is_anonymous zu progress hinzu, falls nicht vorhanden
    const checkIsAnonymous = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='progress' AND column_name='is_anonymous'
    `);

    if (checkIsAnonymous.rows.length === 0) {
      await pool.query(`
        ALTER TABLE progress
        ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE
      `);
      console.log('✓ Migration: is_anonymous zu progress hinzugefügt');
    }

    // Migration: user_id in progress optional machen für anonyme Sessions
    const checkUserIdConstraint = await pool.query(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name='progress' AND column_name='user_id'
    `);

    if (checkUserIdConstraint.rows.length > 0 && checkUserIdConstraint.rows[0].is_nullable === 'NO') {
      await pool.query(`
        ALTER TABLE progress
        ALTER COLUMN user_id DROP NOT NULL
      `);
      console.log('✓ Migration: user_id in progress ist jetzt optional');
    }

    // Migration: Badge-System Spalten zu user_stats hinzufügen
    const checkBadgeLevel = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='user_stats' AND column_name='current_badge_level'
    `);

    if (checkBadgeLevel.rows.length === 0) {
      await pool.query(`
        ALTER TABLE user_stats
        ADD COLUMN IF NOT EXISTS current_badge_level INT DEFAULT 0 CHECK (current_badge_level >= 0 AND current_badge_level <= 8),
        ADD COLUMN IF NOT EXISTS lessons_completed_count INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS lessons_completed_above_80 INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS lessons_completed_above_85 INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS lessons_completed_above_90 INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS lessons_completed_above_95 INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS lessons_completed_above_98 INT DEFAULT 0
      `);
      console.log('✓ Migration: Badge-System-Spalten zu user_stats hinzugefügt');
    }

    // Migration: user_badges Tabelle erstellen, falls nicht vorhanden
    const checkUserBadgesTable = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name='user_badges'
    `);

    if (checkUserBadgesTable.rows.length === 0) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_badges (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          badge_level INT NOT NULL CHECK (badge_level >= 1 AND badge_level <= 8),
          earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, badge_level)
        )
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC)
      `);
      console.log('✓ Migration: user_badges Tabelle erstellt');
    }

    // Migration: Füge lesson_type zu lessons hinzu, falls nicht vorhanden
    const checkLessonType = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='lessons' AND column_name='lesson_type'
    `);

    if (checkLessonType.rows.length === 0) {
      await pool.query(`
        ALTER TABLE lessons
        ADD COLUMN lesson_type VARCHAR(20) DEFAULT 'normal'
      `);
      console.log('✓ Migration: lesson_type zu lessons hinzugefügt');
    }

    // Migration: Füge is_extra zu lessons hinzu, falls nicht vorhanden
    const checkIsExtra = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='lessons' AND column_name='is_extra'
    `);

    if (checkIsExtra.rows.length === 0) {
      await pool.query(`
        ALTER TABLE lessons
        ADD COLUMN is_extra BOOLEAN DEFAULT FALSE
      `);
      console.log('✓ Migration: is_extra zu lessons hinzugefügt');

      // Markiere die Extra-Lektionen (Freies Training = level 0, Tastatur-Runner = level 11)
      await pool.query(`
        UPDATE lessons
        SET is_extra = TRUE
        WHERE level IN (0, 11)
      `);
      console.log('✓ Migration: Extra-Lektionen markiert (level 0 und 11)');
    }

    // Migration: Badge-Berechnungs-Funktion erstellen/aktualisieren
    await pool.query(`
      CREATE OR REPLACE FUNCTION calculate_user_badge_level(p_user_id INT)
      RETURNS INT AS $$
      DECLARE
        v_avg_wpm DECIMAL(5,2);
        v_avg_accuracy DECIMAL(5,2);
        v_lessons_completed INT;
        v_badge_level INT := 0;
      BEGIN
        SELECT
          COALESCE(AVG(wpm), 0),
          COALESCE(AVG(accuracy), 0),
          COUNT(DISTINCT lesson_id)
        INTO v_avg_wpm, v_avg_accuracy, v_lessons_completed
        FROM progress
        WHERE user_id = p_user_id
          AND completed = true
          AND is_anonymous = false;

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

        IF v_lessons_completed >= 11 AND v_avg_wpm >= 80 AND v_avg_accuracy >= 98 AND
           (SELECT lessons_completed_above_98 FROM user_stats WHERE user_id = p_user_id) >= 11
        THEN
          v_badge_level := 8;
        ELSIF v_lessons_completed >= 11 AND v_avg_wpm >= 70 AND v_avg_accuracy >= 95 AND
              (SELECT lessons_completed_above_95 FROM user_stats WHERE user_id = p_user_id) >= 11
        THEN
          v_badge_level := 7;
        ELSIF v_lessons_completed >= 11 AND v_avg_wpm >= 60 AND v_avg_accuracy >= 92 AND
              (SELECT lessons_completed_above_90 FROM user_stats WHERE user_id = p_user_id) >= 11
        THEN
          v_badge_level := 6;
        ELSIF v_lessons_completed >= 9 AND v_avg_wpm >= 50 AND v_avg_accuracy >= 90 AND
              (SELECT lessons_completed_above_90 FROM user_stats WHERE user_id = p_user_id) >= 9
        THEN
          v_badge_level := 5;
        ELSIF v_lessons_completed >= 7 AND v_avg_wpm >= 40 AND v_avg_accuracy >= 87 AND
              (SELECT lessons_completed_above_85 FROM user_stats WHERE user_id = p_user_id) >= 7
        THEN
          v_badge_level := 4;
        ELSIF v_lessons_completed >= 3 AND v_avg_wpm >= 30 AND v_avg_accuracy >= 85 AND
              (SELECT lessons_completed_above_85 FROM user_stats WHERE user_id = p_user_id) >= 3
        THEN
          v_badge_level := 3;
        ELSIF v_lessons_completed >= 5 AND v_avg_wpm >= 20 AND v_avg_accuracy >= 82 AND
              (SELECT lessons_completed_above_80 FROM user_stats WHERE user_id = p_user_id) >= 5
        THEN
          v_badge_level := 2;
        ELSIF v_lessons_completed >= 3 AND v_avg_wpm >= 10 AND v_avg_accuracy >= 80 AND
              (SELECT lessons_completed_above_80 FROM user_stats WHERE user_id = p_user_id) >= 3
        THEN
          v_badge_level := 1;
        ELSE
          v_badge_level := 0;
        END IF;

        UPDATE user_stats
        SET current_badge_level = v_badge_level
        WHERE user_id = p_user_id;

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
    `);
    console.log('✓ Migration: Badge-Berechnungs-Funktion erstellt/aktualisiert');

    // Migration: Synchronisiere Standard-Lektionen
    await syncDefaultLessons();
  } catch (error) {
    console.error('Fehler bei Migrationen:', error);
  }
};

// Synchronisiere Standard-Lektionen mit der Datenbank
const syncDefaultLessons = async () => {
  try {
    const defaultLessons = getDefaultLessons();

    // Hole alle existierenden Lektionen
    const existingLessons = await pool.query('SELECT level FROM lessons');
    const existingLevels = new Set(existingLessons.rows.map(row => row.level));

    let addedCount = 0;

    // Füge fehlende Lektionen hinzu
    for (const lesson of defaultLessons) {
      if (!existingLevels.has(lesson.level)) {
        await pool.query(
          'INSERT INTO lessons (title, description, level, text_content, target_keys, lesson_type, is_extra) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [lesson.title, lesson.description, lesson.level, lesson.text_content, lesson.target_keys, lesson.lesson_type || 'normal', lesson.is_extra || false]
        );
        addedCount++;
        console.log(`✓ Lektion ${lesson.level} hinzugefügt: ${lesson.title}`);
      }
    }

    if (addedCount > 0) {
      console.log(`✓ ${addedCount} neue Lektion(en) zur Datenbank hinzugefügt`);
    }
  } catch (error) {
    console.error('Fehler beim Synchronisieren der Lektionen:', error);
  }
};

// Initialisiere Datenbank-Schema
const initDatabase = async () => {
  try {
    // Users Tabelle
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
        class_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Classes Tabelle
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Lessons Tabelle
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        level INTEGER NOT NULL,
        text_content TEXT NOT NULL,
        target_keys VARCHAR(50),
        lesson_type VARCHAR(20) DEFAULT 'normal',
        is_extra BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Progress Tabelle
    await pool.query(`
      CREATE TABLE IF NOT EXISTS progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        wpm DECIMAL(5,2),
        accuracy DECIMAL(5,2),
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP,
        is_anonymous BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Statistiken Tabelle (mit Badge-System)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        total_lessons_completed INTEGER DEFAULT 0,
        average_wpm DECIMAL(5,2) DEFAULT 0,
        average_accuracy DECIMAL(5,2) DEFAULT 0,
        total_practice_time INTEGER DEFAULT 0,
        current_badge_level INT DEFAULT 0 CHECK (current_badge_level >= 0 AND current_badge_level <= 8),
        lessons_completed_count INT DEFAULT 0,
        lessons_completed_above_80 INT DEFAULT 0,
        lessons_completed_above_85 INT DEFAULT 0,
        lessons_completed_above_90 INT DEFAULT 0,
        lessons_completed_above_95 INT DEFAULT 0,
        lessons_completed_above_98 INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Password Reset Tokens Tabelle
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User Badges Tabelle
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_level INT NOT NULL CHECK (badge_level >= 1 AND badge_level <= 8),
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, badge_level)
      )
    `);

    // Erstelle Indizes für user_badges
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC)
    `);

    // Badge-Berechnungs-Funktion
    await pool.query(`
      CREATE OR REPLACE FUNCTION calculate_user_badge_level(p_user_id INT)
      RETURNS INT AS $$
      DECLARE
        v_avg_wpm DECIMAL(5,2);
        v_avg_accuracy DECIMAL(5,2);
        v_lessons_completed INT;
        v_badge_level INT := 0;
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
        -- Level 1: Anfänger
        ELSIF v_lessons_completed >= 3 AND v_avg_wpm >= 10 AND v_avg_accuracy >= 80 AND
              (SELECT lessons_completed_above_80 FROM user_stats WHERE user_id = p_user_id) >= 3
        THEN
          v_badge_level := 1;
        ELSE
          v_badge_level := 0;
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
    `);

    console.log('✓ Badge-System-Tabellen und Funktionen erstellt');

    // Erstelle Default-Lektionen, falls nicht vorhanden
    const lessonCheck = await pool.query('SELECT COUNT(*) FROM lessons');
    if (lessonCheck.rows[0].count === '0') {
      await insertDefaultLessons();
    }

    // Führe Migrationen aus
    await runMigrations();

    console.log('✓ Datenbank-Schema initialisiert');
  } catch (error) {
    console.error('Fehler beim Initialisieren der Datenbank:', error);
  }
};

const insertDefaultLessons = async () => {
  const lessons = getDefaultLessons();

  for (const lesson of lessons) {
    await pool.query(
      'INSERT INTO lessons (title, description, level, text_content, target_keys, lesson_type, is_extra) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [lesson.title, lesson.description, lesson.level, lesson.text_content, lesson.target_keys, lesson.lesson_type || 'normal', lesson.is_extra || false]
    );
  }

  console.log('✓ Default-Lektionen eingefügt');
};

module.exports = { pool, initDatabase };
