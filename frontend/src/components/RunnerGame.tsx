import React, { useEffect, useRef, useState, useCallback } from 'react';
import '../styles/RunnerGame.css';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  letter: string;
  passed: boolean;
  cactusType: number; // 0, 1, oder 2 für verschiedene Kaktus-Arten
}

interface RunnerGameProps {
  targetKeys: string;
  highscore?: { wpm: number; accuracy: number } | null;
  onGameOver: (stats: { correctPresses: number; missedObstacles: number; totalObstacles: number; elapsedTimeMs: number }) => void;
}

const RunnerGame: React.FC<RunnerGameProps> = ({ targetKeys, highscore, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  // Game state refs (nicht im React State, da sie sich oft ändern)
  const gameStateRef = useRef({
    playerY: 0,
    playerVelocity: 0,
    isJumping: false,
    obstacles: [] as Obstacle[],
    gameSpeed: 3,
    frameCount: 0,
    correctPresses: 0,
    missedObstacles: 0,
    totalObstacles: 0,
    gameOver: false,
    nextObstacleIn: 0,
    difficultyLevel: 0,
    startTime: 0,
    pointsPerJump: 10, // Dynamische Punkte pro Sprung
  });

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;
  const GROUND_Y = CANVAS_HEIGHT - 50;
  const PLAYER_X = 100;
  const PLAYER_SIZE = 40;
  const JUMP_STRENGTH = -12;
  const GRAVITY = 0.5;
  const OBSTACLE_WIDTH = 40;
  const OBSTACLE_HEIGHT = 50;
  const MIN_OBSTACLE_SPACING = 80;
  const MAX_OBSTACLE_SPACING = 120;

  // Progressive Buchstaben-Sets wie bei den Lektionen
  const getKeysForLevel = useCallback((level: number): string[] => {
    switch (level) {
      case 0:
        return ['a', 's', 'd', 'f', 'j', 'k', 'l']; // Äußere Grundreihe
      case 1:
        return ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l']; // + Mittlere Grundreihe
      case 2:
        return ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'q', 'w', 'e', 'r', 'u', 'i']; // + Äußere obere Reihe
      case 3:
        return ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p']; // + Mittlere obere Reihe
      case 4:
        return ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'y', 'x', 'c', 'v', 'b', 'n']; // + Untere Reihe
      case 5:
        return ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'y', 'x', 'c', 'v', 'b', 'n', 'm']; // + m (alle Buchstaben)
      default:
        return ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'y', 'x', 'c', 'v', 'b', 'n', 'm'];
    }
  }, []);

  // Zufälliger Buchstabe für Hindernis basierend auf Schwierigkeitsgrad
  const getRandomLetter = useCallback((difficultyLevel: number) => {
    const availableKeys = getKeysForLevel(difficultyLevel);
    const baseLetter = availableKeys[Math.floor(Math.random() * availableKeys.length)];
    return baseLetter;
  }, [getKeysForLevel]);

  // Tasteneingabe Handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Verhindere Browser-Scroll bei Leertaste
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
      }

      // Starten mit Leertaste wenn noch nicht gestartet
      if (!gameStarted && (e.key === ' ' || e.key === 'Spacebar')) {
        setGameStarted(true);
        gameStateRef.current.gameOver = false;
        gameStateRef.current.startTime = Date.now();
        return;
      }

      if (gameStateRef.current.gameOver) {
        return;
      }

      const pressedKey = e.key; // CASE SENSITIVE - kein toLowerCase()!
      const state = gameStateRef.current;

      // Finde das nächste Hindernis mit passendem Buchstaben (exakte Übereinstimmung)
      // KEINE Distanzbeschränkung mehr - lass immer springen!
      const nextObstacle = state.obstacles.find(
        obs => !obs.passed && obs.letter === pressedKey
      );

      if (nextObstacle && !state.isJumping) {
        // Richtiger Buchstabe - Spring!
        state.isJumping = true;
        state.playerVelocity = JUMP_STRENGTH;
        state.correctPresses++;
        setScore(prev => prev + state.pointsPerJump);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, getRandomLetter]);

  // Start Screen
  useEffect(() => {
    if (gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Hintergrund
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Boden
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    // "Drücke Leertaste zum Starten" Text
    ctx.fillStyle = '#000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Drücke Leertaste zum Starten', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }, [gameStarted, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y]);

  // Game Loop
  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const gameLoop = () => {
      const state = gameStateRef.current;

      if (state.gameOver) {
        return;
      }

      state.frameCount++;

      // Hintergrund
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Boden
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      // Dino zeichnen (Chrome-Dino Style)
      const dinoX = PLAYER_X;
      const dinoY = state.playerY;
      const legAnimation = Math.floor(state.frameCount / 8) % 2; // Bein-Animation alle 8 Frames

      ctx.fillStyle = '#535353'; // Dunkelgrau wie Chrome Dino

      // Hinterbeine (2 Beine mit Animation)
      if (state.isJumping) {
        // Im Sprung: Beide Beine nach hinten
        ctx.fillRect(dinoX + 22, dinoY + 26, 4, 12);
        ctx.fillRect(dinoX + 18, dinoY + 26, 4, 12);
      } else {
        // Beim Laufen: Alternierende Beine
        if (legAnimation === 0) {
          ctx.fillRect(dinoX + 22, dinoY + 26, 4, 12); // Rechtes Bein unten
          ctx.fillRect(dinoX + 18, dinoY + 22, 4, 12); // Linkes Bein angehoben
        } else {
          ctx.fillRect(dinoX + 18, dinoY + 26, 4, 12); // Linkes Bein unten
          ctx.fillRect(dinoX + 22, dinoY + 22, 4, 12); // Rechtes Bein angehoben
        }
      }

      // Körper (Hauptteil)
      ctx.fillRect(dinoX + 10, dinoY + 12, 22, 16);

      // Hals
      ctx.fillRect(dinoX + 26, dinoY + 4, 6, 12);

      // Kopf
      ctx.fillRect(dinoX + 26, dinoY, 16, 10);

      // Schnauze
      ctx.fillRect(dinoX + 38, dinoY + 4, 6, 6);

      // Schwanz
      ctx.fillRect(dinoX + 2, dinoY + 14, 10, 8);
      ctx.fillRect(dinoX, dinoY + 18, 4, 4);

      // Auge (weiß mit schwarzer Pupille)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(dinoX + 30, dinoY + 2, 4, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(dinoX + 32, dinoY + 3, 2, 2);

      // Mund (kleine Linie)
      ctx.fillStyle = '#535353';
      ctx.fillRect(dinoX + 40, dinoY + 8, 2, 1);

      // Vorderbeine (kurze T-Rex Arme)
      ctx.fillStyle = '#535353';
      ctx.fillRect(dinoX + 18, dinoY + 16, 3, 6);
      ctx.fillRect(dinoX + 24, dinoY + 16, 3, 6);

      // Rückenzacken (3 Zacken)
      ctx.fillRect(dinoX + 14, dinoY + 10, 2, 4);
      ctx.fillRect(dinoX + 18, dinoY + 8, 2, 4);
      ctx.fillRect(dinoX + 22, dinoY + 10, 2, 4);

      // Spieler Physik
      if (state.isJumping || state.playerY < GROUND_Y - PLAYER_SIZE) {
        state.playerVelocity += GRAVITY;
        state.playerY += state.playerVelocity;

        // Landung
        if (state.playerY >= GROUND_Y - PLAYER_SIZE) {
          state.playerY = GROUND_Y - PLAYER_SIZE;
          state.isJumping = false;
          state.playerVelocity = 0;
        }
      }

      // Hindernisse spawnen
      state.nextObstacleIn--;
      if (state.nextObstacleIn <= 0) {
        const cactusType = Math.floor(Math.random() * 3); // 0, 1 oder 2
        const obstacle: Obstacle = {
          x: CANVAS_WIDTH,
          y: GROUND_Y - OBSTACLE_HEIGHT,
          width: OBSTACLE_WIDTH,
          height: OBSTACLE_HEIGHT,
          letter: getRandomLetter(state.difficultyLevel),
          passed: false,
          cactusType,
        };
        state.obstacles.push(obstacle);
        state.totalObstacles++;

        // Abstände reduzieren NACH Level 5 (erst wenn alle Buchstaben da sind)
        let minSpacing = MIN_OBSTACLE_SPACING;
        let maxSpacing = MAX_OBSTACLE_SPACING;

        if (state.difficultyLevel >= 5 && state.totalObstacles > 25) {
          // Reduziere Abstände kontinuierlich nach Anzahl der Hindernisse (alle 3 Hindernisse)
          const reductionFactor = Math.floor((state.totalObstacles - 25) / 3);
          minSpacing = Math.max(MIN_OBSTACLE_SPACING - (reductionFactor * 4), 20); // Minimum 20px
          maxSpacing = Math.max(MAX_OBSTACLE_SPACING - (reductionFactor * 6), 35); // Minimum 35px

          // Erhöhe Punkte basierend auf Schwierigkeit: 10 + (reductionFactor * 5)
          // Je kürzer die Abstände, desto mehr Punkte (max 60 Punkte)
          state.pointsPerJump = Math.min(10 + (reductionFactor * 5), 60);
        } else {
          // Normale Punkte vor erhöhter Schwierigkeit
          state.pointsPerJump = 10;
        }

        state.nextObstacleIn = minSpacing + Math.random() * (maxSpacing - minSpacing);
      }

      // Hindernisse zeichnen und bewegen
      state.obstacles.forEach((obstacle, index) => {
        obstacle.x -= state.gameSpeed;

        // Kaktus zeichnen (verschiedene Typen)
        ctx.fillStyle = '#4A7C4E'; // Grün für Kaktus

        const cactusX = obstacle.x;
        const cactusY = obstacle.y;
        const cactusH = obstacle.height;

        if (obstacle.cactusType === 0) {
          // Einfacher Kaktus
          ctx.fillRect(cactusX + 12, cactusY, 16, cactusH); // Stamm
          ctx.fillRect(cactusX + 8, cactusY + 10, 8, 15); // Linker Arm
          ctx.fillRect(cactusX + 24, cactusY + 15, 8, 15); // Rechter Arm
        } else if (obstacle.cactusType === 1) {
          // Hoher Kaktus
          ctx.fillRect(cactusX + 14, cactusY, 12, cactusH); // Stamm
          ctx.fillRect(cactusX + 6, cactusY + 15, 8, 20); // Linker Arm
        } else {
          // Breiter Kaktus mit zwei Armen
          ctx.fillRect(cactusX + 12, cactusY + 5, 16, cactusH - 5); // Stamm
          ctx.fillRect(cactusX + 4, cactusY + 12, 8, 18); // Linker Arm unten
          ctx.fillRect(cactusX + 28, cactusY + 12, 8, 18); // Rechter Arm unten
        }

        // Buchstabe unter dem Kaktus
        ctx.fillStyle = '#000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(
          obstacle.letter,
          obstacle.x + obstacle.width / 2,
          obstacle.y + obstacle.height + 5 // 5px unter dem Kaktus
        );

        // Kollisionserkennung und erfolgreiches Überspringen
        const playerBottom = state.playerY + PLAYER_SIZE;
        const playerRight = PLAYER_X + PLAYER_SIZE;
        const obstacleRight = obstacle.x + obstacle.width;

        // Wenn der Spieler horizontal mit dem Hindernis überlappt
        if (PLAYER_X < obstacleRight && playerRight > obstacle.x) {
          if (!obstacle.passed) {
            // Prüfe ob Spieler hoch genug springt (mindestens 20px über Hindernis)
            const clearanceNeeded = obstacle.y - 20;

            if (state.playerY <= clearanceNeeded) {
              // Erfolgreich übersprungen! Hindernis passiert ohne Kollision
              obstacle.passed = true;
            } else if (playerBottom > obstacle.y) {
              // Zu niedrig - Kollision!
              obstacle.passed = true;
              state.missedObstacles++;
              setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                  state.gameOver = true;
                  const elapsedTimeMs = Date.now() - state.startTime;
                  onGameOver({
                    correctPresses: state.correctPresses,
                    missedObstacles: state.missedObstacles,
                    totalObstacles: state.totalObstacles,
                    elapsedTimeMs,
                  });
                }
                return newLives;
              });
            }
          }
        }

        // Hindernis als "verpasst" markieren wenn Spieler vorbei ist (ohne zu springen)
        if (!obstacle.passed && obstacle.x + obstacle.width < PLAYER_X) {
          obstacle.passed = true;
          state.missedObstacles++;
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              state.gameOver = true;
              const elapsedTimeMs = Date.now() - state.startTime;
              onGameOver({
                correctPresses: state.correctPresses,
                missedObstacles: state.missedObstacles,
                totalObstacles: state.totalObstacles,
                elapsedTimeMs,
              });
            }
            return newLives;
          });
        }

        // Entferne Hindernisse die aus dem Bildschirm sind
        if (obstacle.x + obstacle.width < 0) {
          state.obstacles.splice(index, 1);
        }
      });

      // Schwierigkeitsgrad erhöhen (mehr Buchstaben hinzufügen)
      // Level 0: Grundreihe außen (0-4 Hindernisse)
      // Level 1: + gh (5-9 Hindernisse)
      // Level 2: + obere Reihe außen (10-14 Hindernisse)
      // Level 3: + obere Reihe mitte (15-19 Hindernisse)
      // Level 4: + untere Reihe (20-24 Hindernisse)
      // Level 5: + m, alle Buchstaben (25+ Hindernisse)
      if (state.totalObstacles >= 25 && state.difficultyLevel < 5) {
        state.difficultyLevel = 5;
      } else if (state.totalObstacles >= 20 && state.difficultyLevel < 4) {
        state.difficultyLevel = 4;
      } else if (state.totalObstacles >= 15 && state.difficultyLevel < 3) {
        state.difficultyLevel = 3;
      } else if (state.totalObstacles >= 10 && state.difficultyLevel < 2) {
        state.difficultyLevel = 2;
      } else if (state.totalObstacles >= 5 && state.difficultyLevel < 1) {
        state.difficultyLevel = 1;
      }

      // HUD
      ctx.fillStyle = '#000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 10, 30);

      // Zeige Punkte-Multiplikator wenn erhöht
      if (state.pointsPerJump > 10) {
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`+${state.pointsPerJump} pro Sprung!`, 10, 55);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`Leben: ${'❤️'.repeat(Math.max(0, lives))}`, 10, 80);
      } else {
        ctx.fillText(`Leben: ${'❤️'.repeat(Math.max(0, lives))}`, 10, 60);
      }

      // Schwierigkeitsgrad-Anzeige
      const difficultyNames = [
        'Grundreihe außen',
        'Grundreihe komplett',
        'Obere Reihe außen',
        'Obere Reihe komplett',
        'Untere Reihe',
        'Alle Buchstaben'
      ];
      const levelY = state.pointsPerJump > 10 ? 110 : 90;
      ctx.fillText(`Level: ${difficultyNames[state.difficultyLevel]}`, 10, levelY);

      // Highscore anzeigen (rechts oben)
      if (highscore) {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.fillText(`🏆 Highscore: ${highscore.wpm.toFixed(1)} WPM`, CANVAS_WIDTH - 10, 30);
        ctx.fillStyle = '#000';
      }

      if (!state.gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    // Initialisierung
    gameStateRef.current.playerY = GROUND_Y - PLAYER_SIZE;
    gameStateRef.current.nextObstacleIn = 100;

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameStarted, score, lives, onGameOver, getRandomLetter]);

  return (
    <div className="runner-game-container">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="runner-canvas"
      />
    </div>
  );
};

export default RunnerGame;
