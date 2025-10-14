import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [version, setVersion] = useState<string>('');
  const [gitCommit, setGitCommit] = useState<string>('');

  useEffect(() => {
    // Version aus Build-Zeit (Frontend)
    const frontendVersion = process.env.REACT_APP_VERSION;
    const frontendGitCommit = process.env.REACT_APP_GIT_COMMIT;

    if (frontendVersion) {
      setVersion(frontendVersion);
    }
    if (frontendGitCommit) {
      setGitCommit(frontendGitCommit);
    }

    // Hole auch Backend-Version
    fetch('/api/version')
      .then(res => res.json())
      .then(data => {
        if (data.version) {
          setVersion(data.version);
        }
        if (data.gitCommit && data.gitCommit !== 'unknown') {
          setGitCommit(data.gitCommit);
        }
      })
      .catch(() => {
        // Fallback auf Frontend-Version wenn Backend nicht erreichbar
      });
  }, []);

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
        <p>
          © {currentYear} TenFingers. Alle Rechte vorbehalten.
          {version && (
            <span
              className="version-info"
              title={gitCommit ? `Git Commit: ${gitCommit}` : undefined}
            >
              {' '}v{version}
            </span>
          )}
        </p>
        <p className="footer-note">
          Entwickelt mit ❤️ für besseres Tippen
        </p>
      </div>
    </footer>
  );
};

export default Footer;
