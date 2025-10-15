import React, { useEffect, useState } from 'react';
import { BadgeProgressResponse } from '../types';
import { badgesAPI } from '../services/api';
import Badge from './Badge';
import '../styles/Badge.css';

const BadgeProgress: React.FC = () => {
  const [progress, setProgress] = useState<BadgeProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await badgesAPI.getProgress();
      setProgress(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden des Badge-Fortschritts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="badge-progress-loading">Lade Badge-Fortschritt...</div>;
  }

  if (error) {
    return <div className="badge-progress-error">{error}</div>;
  }

  if (!progress) {
    return null;
  }

  // Maximales Level erreicht
  if (progress.isMaxLevel) {
    return (
      <div className="badge-progress-max">
        <h3>{progress.message}</h3>
        <p>Du hast alle Badges gemeistert! 🎉</p>
      </div>
    );
  }

  const { nextBadge, requirements, overallProgress } = progress;

  if (!nextBadge || !requirements) {
    return null;
  }

  return (
    <div className="badge-progress-container">
      <div className="badge-progress-header">
        <h3>Nächstes Badge: {nextBadge.name}</h3>
        <Badge badge={nextBadge} size="medium" />
      </div>

      <div className="badge-progress-overall">
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${overallProgress || 0}%` }}>
            <span className="progress-text">{Math.round(overallProgress || 0)}%</span>
          </div>
        </div>
      </div>

      <div className="badge-requirements-progress">
        <div className="requirement-progress">
          <div className="requirement-header">
            <span className="requirement-icon">📚</span>
            <span className="requirement-label">{requirements.lessons.description}</span>
            <span className={`requirement-status ${requirements.lessons.met ? 'met' : 'unmet'}`}>
              {requirements.lessons.current} / {requirements.lessons.required}
            </span>
          </div>
          <div className="progress-bar-container">
            <div
              className={`progress-bar ${requirements.lessons.met ? 'met' : ''}`}
              style={{ width: `${requirements.lessons.progress}%` }}
            />
          </div>
        </div>

        <div className="requirement-progress">
          <div className="requirement-header">
            <span className="requirement-icon">⚡</span>
            <span className="requirement-label">{requirements.wpm.description}</span>
            <span className={`requirement-status ${requirements.wpm.met ? 'met' : 'unmet'}`}>
              {Math.round(requirements.wpm.current)} / {requirements.wpm.required}
            </span>
          </div>
          <div className="progress-bar-container">
            <div
              className={`progress-bar ${requirements.wpm.met ? 'met' : ''}`}
              style={{ width: `${requirements.wpm.progress}%` }}
            />
          </div>
        </div>

        <div className="requirement-progress">
          <div className="requirement-header">
            <span className="requirement-icon">🎯</span>
            <span className="requirement-label">{requirements.accuracy.description}</span>
            <span className={`requirement-status ${requirements.accuracy.met ? 'met' : 'unmet'}`}>
              {Math.round(requirements.accuracy.current)}% / {requirements.accuracy.required}%
            </span>
          </div>
          <div className="progress-bar-container">
            <div
              className={`progress-bar ${requirements.accuracy.met ? 'met' : ''}`}
              style={{ width: `${requirements.accuracy.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgeProgress;
