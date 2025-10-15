import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Badge } from '../types';
import '../styles/BadgeUnlockModal.css';

interface BadgeUnlockModalProps {
  badge: Badge;
  onClose: () => void;
}

const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({ badge, onClose }) => {
  useEffect(() => {
    // Confetti-Animation starten
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti von links
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });

      // Confetti von rechts
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="badge-unlock-overlay" onClick={onClose}>
      <div className="badge-unlock-modal" onClick={(e) => e.stopPropagation()}>
        <div className="badge-unlock-header">
          <h2>🎉 Neues Badge freigeschaltet! 🎉</h2>
        </div>

        <div className="badge-unlock-content">
          <div className="badge-unlock-icon">
            {badge.icon}
          </div>

          <h3 className="badge-unlock-name">{badge.name}</h3>
          <p className="badge-unlock-level">Level {badge.level}</p>

          <div className="badge-unlock-requirements">
            <h4>Anforderungen erfüllt:</h4>
            <div className="requirement-list">
              <div className="requirement-item">
                <span className="requirement-icon">⚡</span>
                <span>{badge.minWpm} WPM</span>
              </div>
              <div className="requirement-item">
                <span className="requirement-icon">🎯</span>
                <span>{badge.minAccuracy}% Genauigkeit</span>
              </div>
              <div className="requirement-item">
                <span className="requirement-icon">📚</span>
                <span>{badge.minLessons} Lektionen ({badge.minLessonAccuracy}%+)</span>
              </div>
            </div>
          </div>

          <button className="badge-unlock-close-btn" onClick={onClose}>
            Weiter üben!
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadgeUnlockModal;
