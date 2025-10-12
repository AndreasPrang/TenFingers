import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lessonsAPI, progressAPI } from '../services/api';
import { Lesson, Progress } from '../types';
import '../styles/Lessons.css';

const Lessons: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [lessonsData, progressData] = await Promise.all([
        lessonsAPI.getAllLessons(),
        progressAPI.getUserProgress(),
      ]);
      setLessons(lessonsData);
      setUserProgress(progressData);
    } catch (err) {
      setError('Fehler beim Laden der Lektionen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLessonProgress = (lessonId: number) => {
    const lessonAttempts = userProgress.filter(p => p.lesson_id === lessonId);
    if (lessonAttempts.length === 0) return null;

    const completed = lessonAttempts.some(p => p.completed);
    const bestAttempt = lessonAttempts.reduce((best, current) => {
      return current.wpm > best.wpm ? current : best;
    });

    return {
      completed,
      bestWpm: bestAttempt.wpm,
      bestAccuracy: bestAttempt.accuracy,
      attempts: lessonAttempts.length,
    };
  };

  if (loading) {
    return (
      <div className="lessons-container">
        <div className="loading">Lade Lektionen...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lessons-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="lessons-container">
      <header className="lessons-header">
        <h1>Lektionen</h1>
        <p>Wähle eine Lektion aus, um mit dem Üben zu beginnen</p>
      </header>

      <div className="lessons-grid">
        {lessons.map((lesson) => {
          const progress = getLessonProgress(lesson.id);

          return (
            <div
              key={lesson.id}
              className={`lesson-card ${progress?.completed ? 'completed' : ''}`}
              onClick={() => navigate(`/practice/${lesson.id}`)}
            >
              <div className="lesson-level">Level {lesson.level}</div>
              <h3 className="lesson-title">{lesson.title}</h3>
              <p className="lesson-description">{lesson.description}</p>

              {progress && (
                <div className="lesson-stats">
                  <div className="stat">
                    <span className="stat-label">Beste WPM</span>
                    <span className="stat-value">{Number(progress.bestWpm).toFixed(1)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Genauigkeit</span>
                    <span className="stat-value">{Number(progress.bestAccuracy).toFixed(1)}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Versuche</span>
                    <span className="stat-value">{progress.attempts}</span>
                  </div>
                </div>
              )}

              {progress?.completed && (
                <div className="completed-badge">✓ Abgeschlossen</div>
              )}

              <div className="lesson-target-keys">
                <strong>Ziel-Tasten:</strong> {lesson.target_keys}
              </div>

              <button className="btn-start">Starten</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Lessons;
