import React, { useEffect, useState } from 'react';
import { CurrentBadgeResponse } from '../types';
import { badgesAPI } from '../services/api';
import '../styles/BadgeCarousel.css';

const BADGE_DEFINITIONS = [
  { level: 1, name: 'Anfänger', icon: '🥉', color: 'bronze' },
  { level: 2, name: 'Schreiber', icon: '🥈', color: 'silver' },
  { level: 3, name: 'Tipper', icon: '🥇', color: 'gold' },
  { level: 4, name: 'Schnellschreiber', icon: '💎', color: 'platinum' },
  { level: 5, name: 'Tastatur-Profi', icon: '💠', color: 'sapphire' },
  { level: 6, name: 'Tipp-Virtuose', icon: '🔷', color: 'diamond' },
  { level: 7, name: 'Tastatur-Meister', icon: '⭐', color: 'star' },
  { level: 8, name: 'Zehnfinger-Legende', icon: '👑', color: 'crown' },
];

const BadgeCarousel: React.FC = () => {
  const [currentBadge, setCurrentBadge] = useState<CurrentBadgeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentBadge();
  }, []);

  const loadCurrentBadge = async () => {
    try {
      const data = await badgesAPI.getCurrentBadge();
      setCurrentBadge(data);
    } catch (err) {
      console.error('Fehler beim Laden des Badge-Status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !currentBadge?.currentBadge) {
    return null;
  }

  const currentLevel = currentBadge.currentBadge.level;
  const earned = currentBadge.earnedBadges || [];

  // Bestimme welche Badges angezeigt werden sollen
  const prevBadge = currentLevel > 1 ? BADGE_DEFINITIONS[currentLevel - 2] : null;
  const currentBadgeData = BADGE_DEFINITIONS[currentLevel - 1];
  const nextBadge = currentLevel < 8 ? BADGE_DEFINITIONS[currentLevel] : null;

  const isBadgeEarned = (level: number) => {
    return earned.some(b => b.level === level);
  };

  return (
    <div className="badge-carousel">
      <div className="badge-carousel-track">
        {/* Previous Badge */}
        {prevBadge && (
          <div className="badge-carousel-item side">
            <div className={`badge-display ${isBadgeEarned(prevBadge.level) ? 'earned' : 'locked'}`}>
              <div className="badge-icon">{prevBadge.icon}</div>
              <div className="badge-name">{prevBadge.name}</div>
            </div>
          </div>
        )}

        {/* Current Badge */}
        <div className="badge-carousel-item center">
          <div className="badge-display earned">
            <div className="badge-icon">{currentBadgeData.icon}</div>
            <div className="badge-name">{currentBadgeData.name}</div>
            <div className="badge-level">Level {currentLevel}</div>
          </div>
        </div>

        {/* Next Badge */}
        {nextBadge && (
          <div className="badge-carousel-item side">
            <div className={`badge-display ${isBadgeEarned(nextBadge.level) ? 'earned' : 'locked'}`}>
              <div className="badge-icon">{nextBadge.icon}</div>
              <div className="badge-name">{nextBadge.name}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgeCarousel;
