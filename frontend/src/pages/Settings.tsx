import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../styles/Settings.css';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    // Validation
    if (newPassword !== confirmPassword) {
      setPasswordError('Die Passwörter stimmen nicht überein');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Neues Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await authAPI.changePassword(currentPassword, newPassword);
      setPasswordMessage(response.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordError(
        error.response?.data?.error || 'Fehler beim Ändern des Passworts'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await authAPI.deleteAccount();
      logout();
      navigate('/');
    } catch (error: any) {
      setDeleting(false);
      setShowDeleteConfirm(false);
      alert(
        error.response?.data?.error ||
          'Fehler beim Löschen des Accounts. Bitte versuche es erneut.'
      );
    }
  };

  return (
    <div className="settings-container">
      <header className="settings-header">
        <h1>Account-Einstellungen</h1>
        <p>Verwalte dein Passwort und deine Kontodaten</p>
      </header>

      <div className="settings-content">
        {/* Passwort ändern */}
        <section className="settings-section">
          <h2>Passwort ändern</h2>
          <p className="section-description">
            Ändere dein Passwort, um dein Konto zu schützen
          </p>

          <form onSubmit={handlePasswordChange} className="password-form">
            {passwordError && <div className="error-message">{passwordError}</div>}
            {passwordMessage && <div className="success-message">{passwordMessage}</div>}

            <div className="form-group">
              <label htmlFor="currentPassword">Aktuelles Passwort</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={changingPassword}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">Neues Passwort</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                disabled={changingPassword}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Neues Passwort bestätigen</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={changingPassword}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={changingPassword}
            >
              {changingPassword ? 'Wird geändert...' : 'Passwort ändern'}
            </button>
          </form>
        </section>

        {/* Account löschen - nur für selbst-registrierte Nutzer */}
        {user && user.class_id === null && (
          <section className="settings-section danger-section">
            <h2>Account löschen</h2>
            <p className="section-description">
              Wenn du deinen Account löschst, werden alle deine Daten unwiderruflich gelöscht.
              Dies umfasst deinen Fortschritt, Statistiken und alle gespeicherten Informationen.
            </p>

            <button
              className="btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
            >
              Account löschen
            </button>
          </section>
        )}
      </div>

      {/* Bestätigungsdialog für Account-Löschung */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Account wirklich löschen?</h2>
            <p>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Daten
              werden permanent gelöscht.
            </p>
            <p className="warning-text">
              Bist du sicher, dass du deinen Account <strong>{user?.username}</strong> löschen möchtest?
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Abbrechen
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? 'Wird gelöscht...' : 'Ja, Account löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
