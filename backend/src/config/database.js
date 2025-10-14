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
      target_keys: 'alle'
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
      target_keys: 'alle'
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
          'INSERT INTO lessons (title, description, level, text_content, target_keys) VALUES ($1, $2, $3, $4, $5)',
          [lesson.title, lesson.description, lesson.level, lesson.text_content, lesson.target_keys]
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

    // Statistiken Tabelle
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        total_lessons_completed INTEGER DEFAULT 0,
        average_wpm DECIMAL(5,2) DEFAULT 0,
        average_accuracy DECIMAL(5,2) DEFAULT 0,
        total_practice_time INTEGER DEFAULT 0,
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
      'INSERT INTO lessons (title, description, level, text_content, target_keys) VALUES ($1, $2, $3, $4, $5)',
      [lesson.title, lesson.description, lesson.level, lesson.text_content, lesson.target_keys]
    );
  }

  console.log('✓ Default-Lektionen eingefügt');
};

module.exports = { pool, initDatabase };
