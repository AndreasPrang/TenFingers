import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { progressAPI } from '../services/api';
import { UserStats, Progress } from '../types';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentProgress, setRecentProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, progressData] = await Promise.all([
        progressAPI.getUserStats(),
        progressAPI.getUserProgress(),
      ]);
      setStats(statsData);
      setRecentProgress(progressData.slice(0, 5)); // Zeige nur die letzten 5
    } catch (err) {
      console.error('Fehler beim Laden der Dashboard-Daten:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Lade Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Willkommen, {user?.username}!</h1>
        <p>Hier ist dein Fortschritt im Überblick</p>
      </header>

      <div className="dashboard-grid">
        <div className="stats-card">
          <div className="stats-card-icon">📊</div>
          <div className="stats-card-content">
            <h3>Abgeschlossene Lektionen</h3>
            <div className="stats-card-value">{stats?.total_lessons_completed || 0}</div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-icon">⚡</div>
          <div className="stats-card-content">
            <h3>Durchschn. Geschwindigkeit</h3>
            <div className="stats-card-value">
              {stats?.average_wpm ? Number(stats.average_wpm).toFixed(1) : '0.0'} <span className="unit">WPM</span>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-icon">🎯</div>
          <div className="stats-card-content">
            <h3>Durchschn. Genauigkeit</h3>
            <div className="stats-card-value">
              {stats?.average_accuracy ? Number(stats.average_accuracy).toFixed(1) : '0.0'} <span className="unit">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Letzte Aktivitäten</h2>
        {recentProgress.length === 0 ? (
          <div className="no-activity">
            <p>Noch keine Aktivitäten vorhanden.</p>
            <button className="btn-start-learning" onClick={() => navigate('/lessons')}>
              Jetzt mit dem Lernen beginnen
            </button>
          </div>
        ) : (
          <div className="activity-list">
            {recentProgress.map((progress) => (
              <div key={progress.id} className="activity-item">
                <div className="activity-icon">
                  {progress.completed ? '✅' : '📝'}
                </div>
                <div className="activity-details">
                  <div className="activity-title">{progress.title}</div>
                  <div className="activity-date">
                    {new Date(progress.created_at).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div className="activity-stats">
                  <span className="activity-wpm">{Number(progress.wpm).toFixed(1)} WPM</span>
                  <span className="activity-accuracy">{Number(progress.accuracy).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-actions">
        <button className="btn-action" onClick={() => navigate('/lessons')}>
          Zu den Lektionen
        </button>
        <button className="btn-settings" onClick={() => navigate('/settings')}>
          Einstellungen
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
