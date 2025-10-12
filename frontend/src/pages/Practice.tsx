import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonsAPI, progressAPI } from '../services/api';
import { Lesson, TypingStats } from '../types';
import Keyboard from '../components/Keyboard';
import '../styles/Practice.css';

const Practice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [errors, setErrors] = useState<number[]>([]);
  const [showError, setShowError] = useState(false);
  const [practiceText, setPracticeText] = useState('');
  const [errorAttempts, setErrorAttempts] = useState(0);
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    totalChars: 0,
  });

  const startTime = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLesson();
  }, [id]);

  useEffect(() => {
    if (started && !finished && inputRef.current) {
      inputRef.current.focus();
    }
  }, [started, finished]);

  useEffect(() => {
    if (!finished) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handleStart();
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
  }, [finished]);

  const loadLesson = async () => {
    try {
      const [lessonData, allLessonsData] = await Promise.all([
        lessonsAPI.getLessonById(Number(id)),
        lessonsAPI.getAllLessons(),
      ]);
      setLesson(lessonData);
      setAllLessons(allLessonsData);
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

    while (currentLength < targetLength) {
      // Generiere Wörter mit 2-5 Zeichen
      const wordLength = Math.floor(Math.random() * 4) + 2;
      let word = '';

      for (let i = 0; i < wordLength; i++) {
        const randomChar = chars[Math.floor(Math.random() * chars.length)];
        word += randomChar;
      }

      words.push(word);
      currentLength += word.length + 1; // +1 für Leerzeichen
    }

    return words.join(' ').substring(0, targetLength);
  };

  const handleStart = () => {
    if (!lesson) return;

    // Generiere neuen zufälligen Text
    const newText = generatePracticeText(lesson.target_keys);
    setPracticeText(newText);

    setStarted(true);
    startTime.current = Date.now();
    setCurrentIndex(0);
    setUserInput('');
    setErrors([]);
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
      await progressAPI.saveProgress(
        Number(id),
        finalStats.wpm,
        finalStats.accuracy,
        completed
      );
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

  return (
    <div className="practice-container">
      <header className="practice-header">
        <button className="btn-back" onClick={() => navigate('/lessons')}>
          ← Zurück zu Lektionen
        </button>
        <div className="lesson-info">
          <h2>{lesson.title}</h2>
          <p>{lesson.description}</p>
        </div>
      </header>

      {!started && (
        <div className="practice-start">
          <h2>Bereit zum Üben?</h2>
          <p>Tippe den angezeigten Text so genau und schnell wie möglich.</p>
          <button className="btn-start-practice" onClick={handleStart}>
            Übung starten
          </button>
        </div>
      )}

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

            {stats.accuracy >= 80 ? (
              <div className="success-message">
                Großartig! Du hast diese Lektion erfolgreich abgeschlossen!
              </div>
            ) : (
              <div className="try-again-message">
                Versuche es nochmal, um eine höhere Genauigkeit zu erreichen (mind. 80%)
              </div>
            )}

            <div className="result-actions">
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
