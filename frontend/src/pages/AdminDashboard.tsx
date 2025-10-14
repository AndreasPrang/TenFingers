import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import '../styles/AdminDashboard.css';

interface DashboardStats {
  users: {
    total: number;
    students: number;
    teachers: number;
    admins: number;
  };
  classes: {
    total: number;
  };
  lessons: {
    available: number;
    practiced: number;
  };
  progress: {
    totalSessions: number;
    completedSessions: number;
    averageWpm: number;
    averageAccuracy: number;
  };
  activity: {
    activeUsers7d: number;
    practiceSessions7d: number;
    activeUsers30d: number;
    practiceSessions30d: number;
    registrations7d: number;
  };
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [registrationsData, setRegistrationsData] = useState<any[]>([]);
  const [practiceSessionsData, setPracticeSessionsData] = useState<any[]>([]);
  const [activeUsersData, setActiveUsersData] = useState<any[]>([]);
  const [performanceDistribution, setPerformanceDistribution] = useState<any>(null);
  const [popularLessons, setPopularLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Lade alle Daten parallel
      const [
        dashboardStats,
        registrations,
        practiceSessions,
        activeUsers,
        perfDist,
        lessons
      ] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getTimeSeriesData('registrations', timeRange),
        adminAPI.getTimeSeriesData('practice_sessions', timeRange),
        adminAPI.getTimeSeriesData('active_users', timeRange),
        adminAPI.getPerformanceDistribution(),
        adminAPI.getPopularLessons()
      ]);

      setStats(dashboardStats);
      setRegistrationsData(registrations.data);
      setPracticeSessionsData(practiceSessions.data);
      setActiveUsersData(activeUsers.data);
      setPerformanceDistribution(perfDist);
      setPopularLessons(lessons.lessons);
    } catch (err: any) {
      console.error('Fehler beim Laden der Dashboard-Daten:', err);
      setError(err.response?.data?.error || 'Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Lade Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Bereite Daten für User-Verteilungs-PieChart vor
  const userDistributionData = [
    { name: 'Schüler', value: stats.users.students },
    { name: 'Lehrer', value: stats.users.teachers },
    { name: 'Admins', value: stats.users.admins }
  ];

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Anonymisierte Nutzungsstatistiken</p>
      </header>

      {/* Zeitraum-Auswahl */}
      <div className="time-range-selector">
        <label>Zeitraum für Graphen:</label>
        <select value={timeRange} onChange={(e) => setTimeRange(Number(e.target.value))}>
          <option value={7}>7 Tage</option>
          <option value={14}>14 Tage</option>
          <option value={30}>30 Tage</option>
          <option value={90}>90 Tage</option>
        </select>
      </div>

      {/* Übersichtskarten */}
      <section className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.users.total}</h3>
            <p>Gesamt Nutzer</p>
            <small>{stats.users.students} Schüler, {stats.users.teachers} Lehrer</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div className="stat-content">
            <h3>{stats.classes.total}</h3>
            <p>Klassen</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>{stats.lessons.practiced}/{stats.lessons.available}</h3>
            <p>Genutzte Lektionen</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✍️</div>
          <div className="stat-content">
            <h3>{stats.progress.totalSessions}</h3>
            <p>Übungssessions</p>
            <small>{stats.progress.completedSessions} abgeschlossen</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>{stats.progress.averageWpm.toFixed(1)}</h3>
            <p>Ø WPM</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>{stats.progress.averageAccuracy.toFixed(1)}%</h3>
            <p>Ø Genauigkeit</p>
          </div>
        </div>
      </section>

      {/* Aktivitäts-Statistiken */}
      <section className="activity-stats">
        <div className="activity-card">
          <h3>Letzte 7 Tage</h3>
          <div className="activity-metrics">
            <div>
              <span className="metric-value">{stats.activity.activeUsers7d}</span>
              <span className="metric-label">Aktive Nutzer</span>
            </div>
            <div>
              <span className="metric-value">{stats.activity.practiceSessions7d}</span>
              <span className="metric-label">Übungssessions</span>
            </div>
            <div>
              <span className="metric-value">{stats.activity.registrations7d}</span>
              <span className="metric-label">Neue Registrierungen</span>
            </div>
          </div>
        </div>

        <div className="activity-card">
          <h3>Letzte 30 Tage</h3>
          <div className="activity-metrics">
            <div>
              <span className="metric-value">{stats.activity.activeUsers30d}</span>
              <span className="metric-label">Aktive Nutzer</span>
            </div>
            <div>
              <span className="metric-value">{stats.activity.practiceSessions30d}</span>
              <span className="metric-label">Übungssessions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Graphen */}
      <section className="charts-grid">
        {/* Registrierungen */}
        <div className="chart-card">
          <h3>Neue Registrierungen</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={registrationsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#6366f1" name="Registrierungen" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Übungssessions */}
        <div className="chart-card">
          <h3>Tägliche Übungssessions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={practiceSessionsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#10b981" name="Sessions" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Aktive Nutzer */}
        <div className="chart-card">
          <h3>Tägliche aktive Nutzer</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activeUsersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#f59e0b" name="Aktive Nutzer" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User-Verteilung */}
        <div className="chart-card">
          <h3>Nutzer-Verteilung</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {userDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Leistungsverteilungen */}
      {performanceDistribution && (
        <section className="distribution-section">
          <h2>Leistungsverteilungen (Anonymisiert)</h2>

          <div className="charts-grid">
            {/* WPM-Verteilung */}
            <div className="chart-card">
              <h3>WPM-Verteilung</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceDistribution.wpmDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="wpm_range" label={{ value: 'WPM', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Anzahl Nutzer', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" name="Nutzer" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Genauigkeits-Verteilung */}
            <div className="chart-card">
              <h3>Genauigkeits-Verteilung</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceDistribution.accuracyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="accuracy_range" label={{ value: 'Genauigkeit', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Anzahl Nutzer', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" name="Nutzer" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Lektionen-Fortschritt-Verteilung */}
            <div className="chart-card">
              <h3>Abgeschlossene Lektionen</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceDistribution.lessonsDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lessons_range" label={{ value: 'Anzahl Lektionen', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Anzahl Nutzer', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" name="Nutzer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Beliebteste Lektionen */}
      {popularLessons.length > 0 && (
        <section className="popular-lessons-section">
          <h2>Beliebteste Lektionen</h2>
          <div className="lessons-table">
            <table>
              <thead>
                <tr>
                  <th>Lektion</th>
                  <th>Level</th>
                  <th>Einzigartige Nutzer</th>
                  <th>Versuche gesamt</th>
                  <th>Abgeschlossen</th>
                  <th>Ø WPM</th>
                  <th>Ø Genauigkeit</th>
                </tr>
              </thead>
              <tbody>
                {popularLessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td>{lesson.title}</td>
                    <td>{lesson.level}</td>
                    <td>{lesson.uniqueUsers}</td>
                    <td>{lesson.totalAttempts}</td>
                    <td>{lesson.completedCount}</td>
                    <td>{lesson.averageWpm.toFixed(1)}</td>
                    <td>{lesson.averageAccuracy.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminDashboard;
