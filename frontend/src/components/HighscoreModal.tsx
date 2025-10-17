import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import '../styles/HighscoreModal.css';

interface HighscoreModalProps {
  newWpm: number;
  oldWpm: number;
  accuracy: number;
  onClose: () => void;
}

const HighscoreModal: React.FC<HighscoreModalProps> = ({ newWpm, oldWpm, accuracy, onClose }) => {
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

  const improvement = newWpm - oldWpm;

  return (
    <div className="highscore-unlock-overlay" onClick={onClose}>
      <div className="highscore-unlock-modal" onClick={(e) => e.stopPropagation()}>
        <div className="highscore-unlock-header">
          <h2>🎉 Neuer Highscore! 🎉</h2>
        </div>

        <div className="highscore-unlock-content">
          <div className="highscore-unlock-icon">
            🏆
          </div>

          <h3 className="highscore-unlock-score">{newWpm.toFixed(1)} WPM</h3>
          <p className="highscore-improvement">
            +{improvement.toFixed(1)} WPM besser!
          </p>

          <div className="highscore-unlock-stats">
            <div className="highscore-stat-item">
              <span className="highscore-stat-icon">⚡</span>
              <div className="highscore-stat-details">
                <span className="highscore-stat-label">Vorher</span>
                <span className="highscore-stat-value">{oldWpm.toFixed(1)} WPM</span>
              </div>
            </div>
            <div className="highscore-stat-item">
              <span className="highscore-stat-icon">🎯</span>
              <div className="highscore-stat-details">
                <span className="highscore-stat-label">Genauigkeit</span>
                <span className="highscore-stat-value">{accuracy.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <button className="highscore-unlock-close-btn" onClick={onClose}>
            Weiter üben!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HighscoreModal;
