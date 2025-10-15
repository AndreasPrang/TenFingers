import React from 'react';
import { Badge as BadgeType } from '../types';
import '../styles/Badge.css';

interface BadgeProps {
  badge: BadgeType;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ badge, size = 'medium', showDetails = false }) => {
  const sizeClasses = {
    small: 'badge-small',
    medium: 'badge-medium',
    large: 'badge-large'
  };

  const colorClasses = {
    bronze: 'badge-bronze',
    silver: 'badge-silver',
    gold: 'badge-gold',
    platinum: 'badge-platinum',
    sapphire: 'badge-sapphire',
    diamond: 'badge-diamond',
    star: 'badge-star',
    crown: 'badge-crown'
  };

  const isEarned = badge.earned !== undefined ? badge.earned : true;

  return (
    <div className={`badge-container ${sizeClasses[size]} ${isEarned ? '' : 'badge-locked'}`}>
      <div className={`badge-icon ${colorClasses[badge.color as keyof typeof colorClasses]}`}>
        <span className="badge-emoji">{badge.icon}</span>
        {!isEarned && <div className="badge-lock-overlay">🔒</div>}
      </div>

      {showDetails && (
        <div className="badge-details">
          <h3 className="badge-name">{badge.name}</h3>
          <p className="badge-level">Level {badge.level}</p>

          <div className="badge-requirements">
            <div className="requirement">
              <span className="requirement-icon">⚡</span>
              <span>{badge.minWpm} WPM</span>
            </div>
            <div className="requirement">
              <span className="requirement-icon">🎯</span>
              <span>{badge.minAccuracy}% Genauigkeit</span>
            </div>
            <div className="requirement">
              <span className="requirement-icon">📚</span>
              <span>{badge.minLessons} Lektionen ({badge.minLessonAccuracy}%+)</span>
            </div>
          </div>

          {badge.earnedAt && (
            <p className="badge-earned-date">
              Erreicht am {new Date(badge.earnedAt).toLocaleDateString('de-DE')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Badge;
