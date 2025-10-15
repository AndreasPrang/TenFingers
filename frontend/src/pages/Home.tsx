import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Keyboard from '../components/Keyboard';
import '../styles/Home.css';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [practiceText, setPracticeText] = useState('Lade Text...');
  const [userInput, setUserInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showError, setShowError] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100 });
  const startTime = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorCount = useRef<number>(0);

  // Lade einen zufälligen Übungstext
  const loadRandomText = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/practice/random');
      const data = await response.json();
      if (data.success) {
        setPracticeText(data.text);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Textes:', error);
      // Fallback zu einem zufälligen Text aus einer Liste
      const fallbackTexts = [
        'Das schnelle braune Pferd springt über den faulen Hund',
        'Übung macht den Meister und bringt Erfolg',
        'Tippen lernen ist einfacher als du denkst',
        'Konzentration und Geduld führen zum Erfolg',
        'Jeden Tag ein bisschen besser werden'
      ];
      const randomIndex = Math.floor(Math.random() * fallbackTexts.length);
      setPracticeText(fallbackTexts[randomIndex]);
    }
  };

  useEffect(() => {
    loadRandomText();
  }, []);

  useEffect(() => {
    if (userInput.length === 1 && startTime.current === 0) {
      startTime.current = Date.now();
    }
  }, [userInput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (completed) return;

    const newInput = e.target.value;
    const lastIndex = newInput.length - 1;

    if (lastIndex >= 0 && newInput[lastIndex] !== practiceText[lastIndex]) {
      setShowError(true);
      setTimeout(() => setShowError(false), 300);
      errorCount.current++;

      // Calculate stats after error
      if (startTime.current > 0) {
        const elapsedMinutes = (Date.now() - startTime.current) / 60000;
        const words = userInput.length / 5;
        const wpm = elapsedMinutes > 0 ? words / elapsedMinutes : 0;
        // Calculate accuracy: correct keystrokes / total keystrokes * 100
        const totalKeystrokes = userInput.length + errorCount.current;
        const accuracy = totalKeystrokes > 0 ? (userInput.length / totalKeystrokes) * 100 : 100;
        setStats({ wpm, accuracy });
      }
      return;
    }

    setUserInput(newInput);
    setCurrentIndex(newInput.length);

    // Calculate stats
    if (startTime.current > 0) {
      const elapsedMinutes = (Date.now() - startTime.current) / 60000;
      const words = newInput.length / 5;
      const wpm = elapsedMinutes > 0 ? words / elapsedMinutes : 0;
      // Calculate accuracy: correct keystrokes / total keystrokes * 100
      const totalKeystrokes = newInput.length + errorCount.current;
      const accuracy = totalKeystrokes > 0 ? (newInput.length / totalKeystrokes) * 100 : 100;
      setStats({ wpm, accuracy });
    }

    // Check if completed - verify ALL characters match, not just length
    if (newInput.length >= practiceText.length && newInput === practiceText) {
      setCompleted(true);
    }
  };

  const handleReset = () => {
    setUserInput('');
    setCurrentIndex(0);
    setCompleted(false);
    setStats({ wpm: 0, accuracy: 100 });
    startTime.current = 0;
    errorCount.current = 0;
    loadRandomText(); // Lade einen neuen zufälligen Text
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getCurrentKey = (): string => {
    if (currentIndex >= practiceText.length) return '';
    return practiceText[currentIndex];
  };

  const getDisplayText = () => {
    const before = practiceText.substring(0, currentIndex);
    const current = practiceText[currentIndex] || '';
    const after = practiceText.substring(currentIndex + 1);
    return { before, current, after };
  };

  const displayText = getDisplayText();

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Lerne das 10-Finger-System
          </h1>
          <p className="hero-subtitle">
            Probiere es gleich aus - fang einfach an zu tippen!
          </p>

          {/* Interactive Practice Widget */}
          <div className="home-practice-widget">
            {!completed ? (
              <>
                <div className="home-text-display">
                  <span className="text-typed">{displayText.before}</span>
                  <span className="text-current">{displayText.current}</span>
                  <span className="text-remaining">{displayText.after}</span>
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={handleInputChange}
                  placeholder="Klick hier und fang an zu tippen..."
                  className={`home-typing-input ${showError ? 'input-error' : ''}`}
                  autoFocus
                />

                <div className="home-stats">
                  <div className="home-stat">
                    <span className="stat-value">{stats.wpm.toFixed(0)}</span>
                    <span className="stat-label">WPM</span>
                  </div>
                  <div className="home-stat">
                    <span className="stat-value">{stats.accuracy.toFixed(0)}%</span>
                    <span className="stat-label">Genauigkeit</span>
                  </div>
                </div>

                <Keyboard
                  currentKey={getCurrentKey()}
                  highlightKeys={['a', 's', 'd', 'f', 'j', 'k', 'l']}
                />
              </>
            ) : (
              <div className="home-completion">
                <h3>Gut gemacht! 🎉</h3>
                <div className="completion-stats">
                  <div className="completion-stat">
                    <span className="stat-value">{stats.wpm.toFixed(0)}</span>
                    <span className="stat-label">WPM</span>
                  </div>
                  <div className="completion-stat">
                    <span className="stat-value">{stats.accuracy.toFixed(0)}%</span>
                    <span className="stat-label">Genauigkeit</span>
                  </div>
                </div>
                <div className="completion-actions">
                  <button onClick={handleReset} className="btn-reset">
                    Nochmal versuchen
                  </button>
                  <button onClick={() => navigate('/lessons')} className="btn-more-lessons">
                    Alle Lektionen ansehen
                  </button>
                  {!isAuthenticated && (
                    <button onClick={() => navigate('/register')} className="btn-register-cta">
                      Registrieren & Fortschritt speichern
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">Warum TypeHero?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⌨️</div>
            <h3>Deutsche QWERTZ-Tastatur</h3>
            <p>Optimiert für die deutsche Tastaturanordnung</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Fortschritts-Tracking</h3>
            <p>Verfolge deine Verbesserungen mit detaillierten Statistiken</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Strukturierte Lektionen</h3>
            <p>Von Grundlagen bis Profi - Schritt für Schritt lernen</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Echtzeit-Feedback</h3>
            <p>Sofortiges Feedback zu Geschwindigkeit und Genauigkeit</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Modernes Design</h3>
            <p>Ansprechendes Interface für Teenager und Erwachsene</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💾</div>
            <h3>Persönliches Profil</h3>
            <p>Speichere deinen Fortschritt und trainiere überall</p>
          </div>
        </div>
      </section>

      <section className="school-section">
        <div className="school-content">
          <h2 className="section-title">Für Schulen und Klassen</h2>
          <p className="section-subtitle">
            TypeHero ist perfekt für den Einsatz im Informatikunterricht
          </p>

          <div className="school-grid">
            <div className="school-feature">
              <div className="school-icon">👨‍🏫</div>
              <h3>Lehrer-Dashboard</h3>
              <p>
                Erstelle und verwalte Klassen, lege Schüler-Accounts an und behalte den
                Überblick über den Lernfortschritt deiner Schüler.
              </p>
            </div>

            <div className="school-feature">
              <div className="school-icon">👥</div>
              <h3>Bulk-Erstellung</h3>
              <p>
                Erstelle bis zu 35 Schüler-Accounts gleichzeitig mit automatisch generierten
                Passwörtern. Exportiere die Zugangsdaten als CSV.
              </p>
            </div>

            <div className="school-feature">
              <div className="school-icon">📈</div>
              <h3>Fortschritts-Übersicht</h3>
              <p>
                Sieh auf einen Blick, welche Schüler welche Lektionen abgeschlossen haben
                und wie ihre Leistungen sind.
              </p>
            </div>

            <div className="school-feature">
              <div className="school-icon">🔒</div>
              <h3>DSGVO-konform</h3>
              <p>
                Entwickelt mit Datenschutz im Fokus. Server in Deutschland, keine Weitergabe
                an Dritte, minimale Datenerfassung, E-Mail optional für Schüler.
              </p>
            </div>

            <div className="school-feature">
              <div className="school-icon">🆓</div>
              <h3>Kostenlos</h3>
              <p>
                Komplett kostenlos, keine versteckten Kosten, keine Werbung,
                keine Premium-Features. Ein nicht-gewerbliches Bildungsprojekt.
              </p>
            </div>

            <div className="school-feature">
              <div className="school-icon">🌐</div>
              <h3>Keine Installation</h3>
              <p>
                Funktioniert direkt im Browser auf allen Geräten. Keine Software-Installation,
                keine Updates, einfach URL aufrufen und loslegen.
              </p>
            </div>
          </div>

          <div className="school-cta">
            <h3>Datenschutz für Schulen</h3>
            <p>
              Wir nehmen Datenschutz ernst, besonders im Schulkontext. E-Mail-Adressen sind
              für Schüler optional, es werden keine Tracking-Tools verwendet, und alle Daten
              bleiben auf Servern in Deutschland. Lehrer können Schüler-Accounts jederzeit
              vollständig löschen.
            </p>
            <p>
              <Link to="/privacy" className="privacy-link">
                Vollständige Datenschutzerklärung lesen →
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="demo-section">
        <h2 className="section-title">Interaktive Tastatur</h2>
        <p className="section-subtitle">
          Unsere farbcodierte Tastatur zeigt dir, welcher Finger welche Taste drücken sollte
        </p>
        <div className="demo-keyboard">
          <Keyboard highlightKeys={['a', 's', 'd', 'f', 'j', 'k', 'l']} />
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Bereit zum Start?</h2>
          <p>Beginne jetzt deine Reise zum Tipp-Profi!</p>
          {!isAuthenticated && (
            <Link to="/register" className="btn-cta">
              Kostenlos registrieren
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
