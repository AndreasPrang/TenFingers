import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>TenFingers</h3>
          <p>Kostenloser Tipptrainer für das 10-Finger-System</p>
          <p className="footer-tagline">Ein nicht-gewerbliches Bildungsprojekt</p>
        </div>

        <div className="footer-section">
          <h4>Rechtliches</h4>
          <ul className="footer-links">
            <li>
              <Link to="/privacy">Datenschutzerklärung</Link>
            </li>
            <li>
              <Link to="/impressum">Impressum</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Für Schulen</h4>
          <ul className="footer-links">
            <li>
              <Link to="/register">Als Lehrer registrieren</Link>
            </li>
            <li>
              <Link to="/privacy#schulen">Datenschutz für Schulen</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Technologie</h4>
          <ul className="footer-info">
            <li>🔒 Server in Deutschland</li>
            <li>🚫 Keine Cookies oder Tracking</li>
            <li>✅ DSGVO-konform</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} TenFingers. Alle Rechte vorbehalten.</p>
        <p className="footer-note">
          Entwickelt mit ❤️ für besseres Tippen
        </p>
      </div>
    </footer>
  );
};

export default Footer;
