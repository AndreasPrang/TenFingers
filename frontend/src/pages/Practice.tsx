import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonsAPI, progressAPI, badgesAPI } from '../services/api';
import { Lesson, TypingStats, Badge } from '../types';
import { useAuth } from '../context/AuthContext';
import Keyboard from '../components/Keyboard';
import BadgeUnlockModal from '../components/BadgeUnlockModal';
import HighscoreModal from '../components/HighscoreModal';
import RunnerGame from '../components/RunnerGame';
import '../styles/Practice.css';

const Practice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showError, setShowError] = useState(false);
  const [practiceText, setPracticeText] = useState('');
  const [errorAttempts, setErrorAttempts] = useState(0);
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);
  const [previousBadgeLevel, setPreviousBadgeLevel] = useState<number>(0);
  const [highscore, setHighscore] = useState<{ wpm: number; accuracy: number } | null>(null);
  const [newHighscore, setNewHighscore] = useState<{ newWpm: number; oldWpm: number; accuracy: number } | null>(null);
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    totalChars: 0,
  });
  const [gameKey, setGameKey] = useState(0);

  const startTime = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset all states when lesson changes
    setStarted(false);
    setFinished(false);
    setCurrentIndex(0);
    setUserInput('');
    setErrorAttempts(0);
    setPracticeText('');
    startTime.current = 0;
    setStats({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: 0,
    });
    setLoading(true);

    loadLesson();
  }, [id]);

  // Lade Highscore wenn sich Auth-Status ändert
  useEffect(() => {
    const loadHighscoreForAuth = async () => {
      if (isAuthenticated && id && !loading) {
        try {
          const highscoreData = await progressAPI.getLessonHighscore(Number(id));
          console.log('🔄 Highscore reload on auth change:', highscoreData);
          if (highscoreData.hasHighscore && highscoreData.highscore) {
            console.log('✅ Setze Highscore nach Auth-Change:', highscoreData.highscore);
            setHighscore({
              wpm: highscoreData.highscore.wpm,
              accuracy: highscoreData.highscore.accuracy
            });
          } else {
            console.log('❌ Kein Highscore nach Auth-Change');
            setHighscore(null);
          }
        } catch (err) {
          console.error('Fehler beim Laden des Highscores nach Auth-Change:', err);
        }
      }
    };

    loadHighscoreForAuth();
  }, [isAuthenticated, id, loading]);

  // Auto-start nach dem Laden der Lektion
  useEffect(() => {
    if (lesson && !started && !finished) {
      handleStart();
    }
  }, [lesson]);

  useEffect(() => {
    if (started && !finished && inputRef.current) {
      inputRef.current.focus();
    }
  }, [started, finished]);

  useEffect(() => {
    if (!finished) return;

    const handleKeyPress = async (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();

        // Runner-Modus: Reset mit gameKey und Highscore-Reload
        if (lesson && lesson.lesson_type === 'runner') {
          setFinished(false);
          setNewHighscore(null);

          // Lade Highscore neu, um sicherzustellen, dass er aktuell ist
          if (isAuthenticated) {
            try {
              const highscoreData = await progressAPI.getLessonHighscore(Number(id));
              console.log('🔄 Highscore RELOAD (Spacebar) für Lektion', id, ':', highscoreData);
              if (highscoreData.hasHighscore && highscoreData.highscore) {
                console.log('✅ Setze Highscore nach Reload:', highscoreData.highscore);
                setHighscore({
                  wpm: highscoreData.highscore.wpm,
                  accuracy: highscoreData.highscore.accuracy
                });
              } else {
                console.log('❌ Kein Highscore nach Reload, setze auf null');
                setHighscore(null);
              }
            } catch (err) {
              console.error('Fehler beim Laden des Highscores:', err);
            }
          }

          setGameKey(prev => prev + 1); // Erhöhe Key, um RunnerGame neu zu mounten
        } else {
          // Normaler Modus: Verwende handleStart
          handleStart();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const nextLesson = getNextLesson();
        if (nextLesson) {
          handleNextLesson();
        } else {
          navigate('/lessons');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [finished, lesson, isAuthenticated, id]);

  const loadLesson = async () => {
    try {
      const [lessonData, allLessonsData] = await Promise.all([
        lessonsAPI.getLessonById(Number(id)),
        lessonsAPI.getAllLessons(),
      ]);
      setLesson(lessonData);
      setAllLessons(allLessonsData);

      // Lade Highscore für eingeloggte User
      if (isAuthenticated) {
        try {
          const highscoreData = await progressAPI.getLessonHighscore(Number(id));
          console.log('📊 Highscore geladen für Lektion', id, ':', highscoreData);
          if (highscoreData.hasHighscore && highscoreData.highscore) {
            console.log('✅ Setze Highscore:', highscoreData.highscore);
            setHighscore({
              wpm: highscoreData.highscore.wpm,
              accuracy: highscoreData.highscore.accuracy
            });
          } else {
            console.log('❌ Kein Highscore vorhanden, setze auf null');
            setHighscore(null);
          }
        } catch (err) {
          console.error('Fehler beim Laden des Highscores:', err);
        }
      }
    } catch (err) {
      console.error('Fehler beim Laden der Lektion:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePracticeText = (targetKeys: string): string => {
    // Entferne "alle" falls vorhanden und verwende alle Buchstaben
    if (targetKeys === 'alle') {
      const allLetters = 'abcdefghijklmnopqrstuvwxyz';
      return generateRandomText(allLetters.split(''), 60);
    }

    // Zerlege target_keys in einzelne Zeichen
    const keys = targetKeys.replace(/\s+/g, '').split('');
    return generateRandomText(keys, 50);
  };

  const generateRandomText = (chars: string[], length: number): string => {
    const words: string[] = [];
    let currentLength = 0;
    const targetLength = length;

    // Shuffle chars für mehr Variation
    const shuffledChars = [...chars].sort(() => Math.random() - 0.5);

    while (currentLength < targetLength) {
      // Variiere Wortlänge zwischen 2-6 Zeichen für mehr Abwechslung
      const wordLength = Math.floor(Math.random() * 5) + 2;
      let word = '';

      // Vermeide zu viele gleiche Buchstaben direkt hintereinander
      let lastChar = '';
      for (let i = 0; i < wordLength; i++) {
        let randomChar;
        let attempts = 0;
        do {
          randomChar = shuffledChars[Math.floor(Math.random() * shuffledChars.length)];
          attempts++;
        } while (randomChar === lastChar && attempts < 3 && shuffledChars.length > 1);

        word += randomChar;
        lastChar = randomChar;
      }

      words.push(word);
      currentLength += word.length + 1; // +1 für Leerzeichen
    }

    return words.join(' ').substring(0, targetLength);
  };

  const handleStart = () => {
    if (!lesson) return;

    let newText: string;

    // Level 0 (Freies Training): Wähle einen zufälligen Text aus dem text_content
    if (lesson.level === 0 && lesson.text_content.includes('|')) {
      const texts = lesson.text_content.split('|');
      const randomIndex = Math.floor(Math.random() * texts.length);
      newText = texts[randomIndex];
    } else {
      // Andere Lektionen: Generiere IMMER neuen zufälligen Text (auch wenn text_content existiert)
      // Dies sorgt für Variation bei jedem Durchgang
      newText = generatePracticeText(lesson.target_keys);
    }

    setPracticeText(newText);

    setStarted(true);
    startTime.current = Date.now();
    setCurrentIndex(0);
    setUserInput('');
    setErrorAttempts(0);
    setFinished(false);
    setStats({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: 0,
    });
  };

  const calculateStats = (input: string): TypingStats => {
    if (!practiceText) return stats;

    const correctChars = input.length; // Alle akzeptierten Zeichen sind korrekt (Strict Mode)
    const totalAttempts = correctChars + errorAttempts; // Korrekte + Fehlerversuche

    // Genauigkeit: Verhältnis von korrekten Eingaben zu allen Versuchen
    const accuracy = totalAttempts > 0 ? (correctChars / totalAttempts) * 100 : 100;

    // WPM berechnen (Words Per Minute)
    const elapsedMinutes = (Date.now() - startTime.current) / 60000;
    const words = correctChars / 5; // Standard: 5 Zeichen = 1 Wort
    const wpm = elapsedMinutes > 0 ? words / elapsedMinutes : 0;

    return {
      wpm,
      accuracy,
      correctChars,
      incorrectChars: errorAttempts,
      totalChars: correctChars,
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!practiceText || finished) return;

    const newInput = e.target.value;

    // STRICT MODE: Prüfe ob der letzte eingegebene Buchstabe korrekt ist
    const lastIndex = newInput.length - 1;
    if (lastIndex >= 0 && newInput[lastIndex] !== practiceText[lastIndex]) {
      // Blockiere falsche Eingabe und zähle Fehlerversuch
      const newErrorCount = errorAttempts + 1;
      setErrorAttempts(newErrorCount);

      // Aktualisiere Stats mit neuem Fehlercount
      const updatedStats = calculateStatsWithErrors(userInput, newErrorCount);
      setStats(updatedStats);

      setShowError(true);
      setTimeout(() => setShowError(false), 300); // Visuelles Feedback für 300ms
      return; // Verhindere die Eingabe
    }

    // Eingabe ist korrekt - akzeptiere sie
    const newStats = calculateStats(newInput);
    setStats(newStats);

    setCurrentIndex(newInput.length);
    setUserInput(newInput);

    // Prüfe ob die Übung abgeschlossen ist
    if (newInput.length >= practiceText.length) {
      finishPractice(newStats);
    }
  };

  const calculateStatsWithErrors = (input: string, errors: number): TypingStats => {
    if (!practiceText) return stats;

    const correctChars = input.length;
    const totalAttempts = correctChars + errors;
    const accuracy = totalAttempts > 0 ? (correctChars / totalAttempts) * 100 : 100;

    const elapsedMinutes = (Date.now() - startTime.current) / 60000;
    const words = correctChars / 5;
    const wpm = elapsedMinutes > 0 ? words / elapsedMinutes : 0;

    return {
      wpm,
      accuracy,
      correctChars,
      incorrectChars: errors,
      totalChars: correctChars,
    };
  };

  const finishPractice = async (finalStats: TypingStats) => {
    setFinished(true);

    // Bestimme ob die Lektion als abgeschlossen gilt (z.B. >80% Genauigkeit)
    const completed = finalStats.accuracy >= 80;

    try {
      // Hole aktuelles Badge-Level VOR dem Speichern (nur für eingeloggte User)
      if (isAuthenticated) {
        try {
          const currentBadgeData = await badgesAPI.getCurrentBadge();
          setPreviousBadgeLevel(currentBadgeData.currentBadge?.level || 0);
        } catch (err) {
          console.error('Fehler beim Abrufen des aktuellen Badges:', err);
        }
      }

      // Speichere Fortschritt für alle (eingeloggte und anonyme Nutzer)
      await progressAPI.saveProgress(
        Number(id),
        finalStats.wpm,
        finalStats.accuracy,
        completed,
        !isAuthenticated // is_anonymous = true wenn nicht eingeloggt
      );

      // Prüfe nach dem Speichern, ob ein neues Badge erreicht wurde (nur für eingeloggte User)
      if (isAuthenticated && completed) {
        try {
          const updatedBadgeData = await badgesAPI.getCurrentBadge();
          const newBadgeLevel = updatedBadgeData.currentBadge?.level || 0;

          // Wenn das Badge-Level gestiegen ist, zeige Unlock-Animation
          if (newBadgeLevel > previousBadgeLevel && updatedBadgeData.currentBadge) {
            setUnlockedBadge(updatedBadgeData.currentBadge);
          }
        } catch (err) {
          console.error('Fehler beim Prüfen des Badge-Fortschritts:', err);
        }
      }
    } catch (err) {
      console.error('Fehler beim Speichern des Fortschritts:', err);
    }
  };

  const getCurrentKey = (): string => {
    if (!practiceText || currentIndex >= practiceText.length) return '';
    return practiceText[currentIndex];
  };

  const getDisplayText = () => {
    if (!practiceText) return { before: '', current: '', after: '' };

    const before = practiceText.substring(0, currentIndex);
    const current = practiceText[currentIndex] || '';
    const after = practiceText.substring(currentIndex + 1);

    return { before, current, after };
  };

  const getNextLesson = (): Lesson | null => {
    if (!lesson || allLessons.length === 0) return null;

    const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
    if (currentIndex === -1 || currentIndex === allLessons.length - 1) return null;

    return allLessons[currentIndex + 1];
  };

  const handleNextLesson = () => {
    const nextLesson = getNextLesson();
    if (nextLesson) {
      navigate(`/practice/${nextLesson.id}`);
    }
  };

  if (loading) {
    return (
      <div className="practice-container">
        <div className="loading">Lade Lektion...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="practice-container">
        <div className="error-message">Lektion nicht gefunden</div>
      </div>
    );
  }

  const displayText = getDisplayText();

  // Handler für Runner-Game-Over
  const handleRunnerGameOver = async (gameStats: { correctPresses: number; missedObstacles: number; totalObstacles: number; elapsedTimeMs: number; score: number }) => {
    const accuracy = gameStats.totalObstacles > 0
      ? (gameStats.correctPresses / gameStats.totalObstacles) * 100
      : 0;

    // Verwende Score als primäre Metrik (statt WPM)
    const wpm = gameStats.score; // Score wird als "WPM" für die Highscore-Logik verwendet

    const finalStats: TypingStats = {
      wpm,
      accuracy,
      correctChars: gameStats.correctPresses,
      incorrectChars: gameStats.missedObstacles,
      totalChars: gameStats.totalObstacles,
    };

    setStats(finalStats);

    // Prüfe ob neuer Highscore erreicht wurde (nur für eingeloggte User)
    // Verwende Score statt WPM für Vergleich - feiere jeden Score im Runner-Modus!
    if (isAuthenticated) {
      console.log('🎮 Highscore Check:', {
        currentScore: gameStats.score,
        existingHighscore: highscore?.wpm,
        hasHighscore: !!highscore
      });

      if (highscore) {
        // Bestehender Highscore - prüfe ob übertroffen
        if (gameStats.score > highscore.wpm) {
          console.log('🎉 NEUER HIGHSCORE!', gameStats.score, '>', highscore.wpm);
          setNewHighscore({
            newWpm: gameStats.score,
            oldWpm: highscore.wpm,
            accuracy
          });
          // Update Highscore
          setHighscore({ wpm: gameStats.score, accuracy });
        } else {
          console.log('❌ Kein neuer Highscore:', gameStats.score, '<=', highscore.wpm);
        }
      } else {
        // Erster Versuch - feiere!
        console.log('🎉 ERSTER VERSUCH - Feiere!', gameStats.score);
        setNewHighscore({
          newWpm: gameStats.score,
          oldWpm: 0,
          accuracy
        });
        // Setze initialen Highscore
        setHighscore({ wpm: gameStats.score, accuracy });
      }
    }

    finishPractice(finalStats);
  };

  // Runner-Modus
  if (lesson && lesson.lesson_type === 'runner') {
    return (
      <div className="practice-container">
        {unlockedBadge && (
          <BadgeUnlockModal
            badge={unlockedBadge}
            onClose={() => setUnlockedBadge(null)}
          />
        )}

        {newHighscore && (
          <HighscoreModal
            newWpm={newHighscore.newWpm}
            oldWpm={newHighscore.oldWpm}
            accuracy={newHighscore.accuracy}
            onClose={() => setNewHighscore(null)}
          />
        )}

        <header className="practice-header">
          <button className="btn-back" onClick={() => navigate('/lessons')}>
            ← Zurück zu Lektionen
          </button>
          <div className="lesson-info">
            <h2>{lesson.title}</h2>
            <p>{lesson.description}</p>
          </div>
        </header>

        <RunnerGame
          key={gameKey}
          targetKeys={lesson.target_keys}
          highscore={highscore}
          onGameOver={handleRunnerGameOver}
        />

        {finished && (
          <div className="practice-result-overlay">
            <div className="practice-result-modal">
              <h2>Spiel beendet!</h2>
              <div className="result-stats">
                <div className="result-stat">
                  <div className="result-stat-label">Score</div>
                  <div className="result-stat-value">{Math.round(stats.wpm)}</div>
                </div>
                <div className="result-stat">
                  <div className="result-stat-label">Genauigkeit</div>
                  <div className="result-stat-value">{stats.accuracy.toFixed(1)}%</div>
                </div>
                <div className="result-stat">
                  <div className="result-stat-label">Korrekte Sprünge</div>
                  <div className="result-stat-value">{stats.correctChars}</div>
                </div>
              </div>

              {!isAuthenticated && (
                <div className="guest-info-message">
                  💡 <strong>Tipp:</strong> Registriere dich kostenlos, um deinen Fortschritt zu speichern und zu verfolgen!
                </div>
              )}

              {stats.accuracy >= 80 ? (
                <div className="success-message">
                  Großartig! Du hast diese Lektion erfolgreich abgeschlossen!
                  {!isAuthenticated && ' (Als Gast - Fortschritt nicht gespeichert)'}
                </div>
              ) : (
                <div className="try-again-message">
                  Versuche es nochmal, um eine höhere Genauigkeit zu erreichen (mind. 80%)
                </div>
              )}

              <div className="result-actions">
                {!isAuthenticated && (
                  <button className="btn-register-prompt" onClick={() => navigate('/register')}>
                    Jetzt registrieren
                  </button>
                )}
                <button className="btn-retry" onClick={async () => {
                  setFinished(false);
                  setNewHighscore(null);

                  // Lade Highscore neu, um sicherzustellen, dass er aktuell ist
                  if (isAuthenticated) {
                    try {
                      const highscoreData = await progressAPI.getLessonHighscore(Number(id));
                      console.log('🔄 Highscore RELOAD (Button) für Lektion', id, ':', highscoreData);
                      if (highscoreData.hasHighscore && highscoreData.highscore) {
                        console.log('✅ Setze Highscore nach Reload:', highscoreData.highscore);
                        setHighscore({
                          wpm: highscoreData.highscore.wpm,
                          accuracy: highscoreData.highscore.accuracy
                        });
                      } else {
                        console.log('❌ Kein Highscore nach Reload, setze auf null');
                        setHighscore(null);
                      }
                    } catch (err) {
                      console.error('Fehler beim Laden des Highscores:', err);
                    }
                  }

                  setGameKey(prev => prev + 1); // Erhöhe Key, um RunnerGame neu zu mounten
                }}>
                  Nochmal versuchen
                </button>
                {getNextLesson() ? (
                  <button className="btn-next-lesson" onClick={handleNextLesson}>
                    Nächste Lektion →
                  </button>
                ) : (
                  <button className="btn-next" onClick={() => navigate('/lessons')}>
                    Zur Lektionsübersicht
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Normaler Modus
  return (
    <div className="practice-container">
      {unlockedBadge && (
        <BadgeUnlockModal
          badge={unlockedBadge}
          onClose={() => setUnlockedBadge(null)}
        />
      )}

      <header className="practice-header">
        <button className="btn-back" onClick={() => navigate('/lessons')}>
          ← Zurück zu Lektionen
        </button>
        <div className="lesson-info">
          <h2>{lesson.title}</h2>
          <p>{lesson.description}</p>
        </div>
      </header>

      {started && (
        <>
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-label">WPM</span>
              <span className="stat-value">{stats.wpm.toFixed(1)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Genauigkeit</span>
              <span className="stat-value">{stats.accuracy.toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Fortschritt</span>
              <span className="stat-value">
                {currentIndex}/{practiceText.length}
              </span>
            </div>
          </div>

          <div className="text-display">
            <div className="text-content">
              <span className="text-typed">{displayText.before}</span>
              <span className="text-current">{displayText.current}</span>
              <span className="text-remaining">{displayText.after}</span>
            </div>
          </div>

          <div className="input-area">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              disabled={finished}
              placeholder="Beginne zu tippen..."
              className={`typing-input ${showError ? 'input-error' : ''}`}
            />
          </div>

          <Keyboard
            currentKey={getCurrentKey()}
            highlightKeys={lesson.target_keys.split(' ')}
          />
        </>
      )}

      {finished && (
        <div className="practice-result-overlay">
          <div className="practice-result-modal">
            <h2>Übung abgeschlossen!</h2>
            <div className="result-stats">
              <div className="result-stat">
                <div className="result-stat-label">Geschwindigkeit</div>
                <div className="result-stat-value">{stats.wpm.toFixed(1)} WPM</div>
              </div>
              <div className="result-stat">
                <div className="result-stat-label">Genauigkeit</div>
                <div className="result-stat-value">{stats.accuracy.toFixed(1)}%</div>
              </div>
              <div className="result-stat">
                <div className="result-stat-label">Fehler</div>
                <div className="result-stat-value">{stats.incorrectChars}</div>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="guest-info-message">
                💡 <strong>Tipp:</strong> Registriere dich kostenlos, um deinen Fortschritt zu speichern und zu verfolgen!
              </div>
            )}

            {stats.accuracy >= 80 ? (
              <div className="success-message">
                Großartig! Du hast diese Lektion erfolgreich abgeschlossen!
                {!isAuthenticated && ' (Als Gast - Fortschritt nicht gespeichert)'}
              </div>
            ) : (
              <div className="try-again-message">
                Versuche es nochmal, um eine höhere Genauigkeit zu erreichen (mind. 80%)
              </div>
            )}

            <div className="result-actions">
              {!isAuthenticated && (
                <button className="btn-register-prompt" onClick={() => navigate('/register')}>
                  Jetzt registrieren
                </button>
              )}
              <button className="btn-retry" onClick={handleStart}>
                Nochmal versuchen
              </button>
              {getNextLesson() ? (
                <button className="btn-next-lesson" onClick={handleNextLesson}>
                  Nächste Lektion →
                </button>
              ) : (
                <button className="btn-next" onClick={() => navigate('/lessons')}>
                  Zur Lektionsübersicht
                </button>
              )}
            </div>
            <div className="keyboard-shortcuts-hint">
              Drücke <kbd>Leertaste</kbd> zum Wiederholen oder <kbd>Enter</kbd> zum Fortfahren
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Practice;
