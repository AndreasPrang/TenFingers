import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

const ForgotPassword: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/request-password-reset`,
        { usernameOrEmail }
      );
      setMessage(response.data.message);
      setUsernameOrEmail('');
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        'Fehler beim Senden der Passwort-Reset-E-Mail. Bitte versuche es später erneut.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Passwort vergessen?</h1>
        <p className="auth-subtitle">
          Gib deinen Benutzernamen oder deine E-Mail-Adresse ein. Falls ein Account
          existiert, senden wir dir einen Link zum Zurücksetzen deines Passworts.
        </p>

        {error && <div className="error-message">{error}</div>}
        {message && (
          <div className="success-message">
            <p>{message}</p>
            <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
              Überprüfe dein E-Mail-Postfach (auch den Spam-Ordner).
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="usernameOrEmail">Benutzername oder E-Mail</label>
            <input
              type="text"
              id="usernameOrEmail"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="max@example.com oder maxmustermann"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Wird gesendet...' : 'Passwort-Reset anfordern'}
          </button>
        </form>

        <p className="auth-link">
          Zurück zur <Link to="/login">Anmeldung</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
