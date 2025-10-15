import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Passwort-Validierung
  const validatePassword = (pwd: string) => {
    const hasMinLength = pwd.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    return {
      hasMinLength,
      hasLetter,
      hasNumber,
      isValid: hasMinLength && hasLetter && hasNumber
    };
  };

  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validierung
    if (!acceptedPrivacy) {
      setError('Bitte akzeptiere die Datenschutzerklärung');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (!passwordValidation.isValid) {
      setError('Passwort erfüllt nicht alle Anforderungen');
      return;
    }

    // E-Mail ist Pflicht für Lehrer
    if (isTeacher && !email) {
      setError('E-Mail ist für Lehrer-Accounts erforderlich');
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password, isTeacher ? 'teacher' : 'student', displayName || undefined);
      navigate(isTeacher ? '/teacher' : '/lessons');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registrierung fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Konto erstellen</h1>
        <p className="auth-subtitle">Starte deine Reise zum 10-Finger-Profi!</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Benutzername</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Wähle einen Benutzernamen"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="displayName">Anzeigename (optional)</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="z.B. Max Mustermann"
              disabled={loading}
              maxLength={100}
            />
            <small className="form-hint">
              Dein Anzeigename wird deinem Lehrer angezeigt. Wenn du keinen angibst, wird dein Benutzername verwendet.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="email">
              E-Mail {isTeacher ? '(Pflicht für Lehrer)' : '(optional für Schüler)'}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isTeacher ? 'deine@email.de' : 'optional - nur für Passwort-Reset'}
              required={isTeacher}
              disabled={loading}
            />
            {!isTeacher && (
              <small className="form-hint">
                Für Schüler ist die E-Mail optional. Sie wird nur für Passwort-Resets benötigt.
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen, Buchstabe + Zahl"
              required
              disabled={loading}
            />
            {password && (
              <div className="password-requirements">
                <small className={passwordValidation.hasMinLength ? 'requirement-met' : 'requirement-unmet'}>
                  {passwordValidation.hasMinLength ? '✓' : '○'} Mindestens 8 Zeichen
                </small>
                <small className={passwordValidation.hasLetter ? 'requirement-met' : 'requirement-unmet'}>
                  {passwordValidation.hasLetter ? '✓' : '○'} Mindestens ein Buchstabe
                </small>
                <small className={passwordValidation.hasNumber ? 'requirement-met' : 'requirement-unmet'}>
                  {passwordValidation.hasNumber ? '✓' : '○'} Mindestens eine Zahl
                </small>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Passwort bestätigen</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort erneut eingeben"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isTeacher}
                onChange={(e) => setIsTeacher(e.target.checked)}
                disabled={loading}
              />
              <span>Ich bin Lehrer und möchte Klassen verwalten</span>
            </label>
          </div>

          <div className="form-group checkbox-group privacy-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                disabled={loading}
                required
              />
              <span>
                Ich habe die <Link to="/privacy" target="_blank" className="privacy-link">Datenschutzerklärung</Link> gelesen
                und stimme der Verarbeitung meiner Daten zu. {!isTeacher && 'Für Schüler unter 16 Jahren ist die Einwilligung der Eltern erforderlich.'}
              </span>
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registrierung läuft...' : 'Registrieren'}
          </button>
        </form>

        <p className="auth-link">
          Bereits ein Konto? <Link to="/login">Jetzt anmelden</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
