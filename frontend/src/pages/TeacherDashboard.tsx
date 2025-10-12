import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { classesAPI } from '../services/api';
import { Class } from '../types';
import '../styles/Teacher.css';

const TeacherDashboard: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await classesAPI.getTeacherClasses();
      setClasses(data);
    } catch (error) {
      console.error('Fehler beim Laden der Klassen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await classesAPI.createClass(newClassName);
      setNewClassName('');
      setShowCreateModal(false);
      loadClasses();
    } catch (error) {
      console.error('Fehler beim Erstellen der Klasse:', error);
      alert('Fehler beim Erstellen der Klasse');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="teacher-container">
        <div className="loading">Lade Klassen...</div>
      </div>
    );
  }

  return (
    <div className="teacher-container">
      <header className="teacher-header">
        <h1>Meine Klassen</h1>
        <button className="btn-create" onClick={() => setShowCreateModal(true)}>
          + Neue Klasse erstellen
        </button>
      </header>

      {classes.length === 0 ? (
        <div className="empty-state">
          <h2>Keine Klassen vorhanden</h2>
          <p>Erstelle deine erste Klasse, um Schüler zu verwalten.</p>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            Erste Klasse erstellen
          </button>
        </div>
      ) : (
        <div className="classes-grid">
          {classes.map((cls) => (
            <div key={cls.id} className="class-card" onClick={() => navigate(`/teacher/class/${cls.id}`)}>
              <h3>{cls.name}</h3>
              <div className="class-stats">
                <div className="stat">
                  <span className="stat-label">Schüler</span>
                  <span className="stat-value">{cls.student_count || 0}</span>
                </div>
              </div>
              <div className="class-actions">
                <button className="btn-view">Details anzeigen →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Neue Klasse erstellen</h2>
            <form onSubmit={handleCreateClass}>
              <div className="form-group">
                <label htmlFor="className">Klassenname</label>
                <input
                  type="text"
                  id="className"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="z.B. 5a, Informatik 2024, etc."
                  required
                  disabled={creating}
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Abbrechen
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Erstelle...' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
