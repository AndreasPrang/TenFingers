import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { progressAPI, badgesAPI } from '../services/api';
import { UserStats, CurrentBadgeResponse } from '../types';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import BadgeProgress from '../components/BadgeProgress';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [currentBadge, setCurrentBadge] = useState<CurrentBadgeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, badgeData] = await Promise.all([
        progressAPI.getUserStats(),
        badgesAPI.getCurrentBadge(),
      ]);
      setStats(statsData);
      setCurrentBadge(badgeData);
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
      </header>

      <div className="dashboard-content">
        {currentBadge?.currentBadge && (
          <div className="dashboard-badge-section">
            <Badge badge={currentBadge.currentBadge} size="large" showDetails={true} />
          </div>
        )}

        <div className="dashboard-grid">
          <div className="stats-card">
            <div className="stats-card-icon">📊</div>
            <div className="stats-card-content">
              <h3>Lektionen</h3>
              <div className="stats-card-value">{stats?.total_lessons_completed || 0}</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-icon">⚡</div>
            <div className="stats-card-content">
              <h3>Geschwindigkeit</h3>
              <div className="stats-card-value">
                {stats?.average_wpm ? Number(stats.average_wpm).toFixed(1) : '0.0'} <span className="unit">WPM</span>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-icon">🎯</div>
            <div className="stats-card-content">
              <h3>Genauigkeit</h3>
              <div className="stats-card-value">
                {stats?.average_accuracy ? Number(stats.average_accuracy).toFixed(1) : '0.0'} <span className="unit">%</span>
              </div>
            </div>
          </div>
        </div>

        <BadgeProgress />

        <div className="dashboard-actions">
          <button className="btn-action" onClick={() => navigate('/lessons')}>
            Zu den Lektionen
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
