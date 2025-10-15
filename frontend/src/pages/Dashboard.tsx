import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { progressAPI } from '../services/api';
import { UserStats } from '../types';
import { useNavigate } from 'react-router-dom';
import BadgeCarousel from '../components/BadgeCarousel';
import BadgeProgress from '../components/BadgeProgress';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const statsData = await progressAPI.getUserStats();
      setStats(statsData);
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
        <BadgeCarousel />

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
