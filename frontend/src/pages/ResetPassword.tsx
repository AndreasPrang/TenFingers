import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('Kein gültiger Reset-Token gefunden. Bitte fordere einen neuen Link an.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/reset-password`,
        { token, newPassword }
      );
      setMessage(response.data.message);

      // Nach 2 Sekunden zur Login-Seite weiterleiten
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        'Fehler beim Zurücksetzen des Passworts. Der Link könnte abgelaufen sein.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Neues Passwort setzen</h1>
        <p className="auth-subtitle">
          Gib dein neues Passwort ein. Es muss mindestens 6 Zeichen lang sein.
        </p>

        {error && <div className="error-message">{error}</div>}
        {message && (
          <div className="success-message">
            <p>{message}</p>
            <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
              Du wirst in Kürze zur Anmeldeseite weitergeleitet...
            </p>
          </div>
        )}

        {!message && token && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="newPassword">Neues Passwort</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Passwort bestätigen</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Wird gespeichert...' : 'Passwort zurücksetzen'}
            </button>
          </form>
        )}

        <p className="auth-link">
          Zurück zur <Link to="/login">Anmeldung</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
