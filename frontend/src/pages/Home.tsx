import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Keyboard from '../components/Keyboard';
import '../styles/Home.css';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Lerne das 10-Finger-System
          </h1>
          <p className="hero-subtitle">
            Verbessere deine Tippgeschwindigkeit und -genauigkeit mit unserem interaktiven Trainer
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-hero-primary">
                Zum Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-hero-primary">
                  Jetzt starten
                </Link>
                <Link to="/login" className="btn-hero-secondary">
                  Anmelden
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">Warum TenFingers?</h2>
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
            TenFingers ist perfekt für den Einsatz im Informatikunterricht
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
