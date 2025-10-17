import React, { useEffect, useRef, useState, useCallback } from 'react';
import '../styles/RunnerGame.css';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  letter: string;
  passed: boolean;
}

interface RunnerGameProps {
  targetKeys: string;
  onGameOver: (stats: { correctPresses: number; missedObstacles: number; totalObstacles: number }) => void;
}

const RunnerGame: React.FC<RunnerGameProps> = ({ targetKeys, onGameOver }) => {
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
    difficultyLevel: 0, // 0 = nur Kleinbuchstaben, 1+ = mit Großbuchstaben gemischt
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
  const MIN_OBSTACLE_SPACING = 200;
  const MAX_OBSTACLE_SPACING = 400;

  // Konvertiere targetKeys in Array
  const availableKeys = targetKeys.split('');

  // Zufälliger Buchstabe für Hindernis mit optionaler Groß-/Kleinschreibung
  const getRandomLetter = useCallback((difficultyLevel: number) => {
    const baseLetter = availableKeys[Math.floor(Math.random() * availableKeys.length)];

    // Ab Schwierigkeitsgrad 1: 50% Chance für Großbuchstaben
    // Ab Schwierigkeitsgrad 2: 70% Chance für Großbuchstaben
    if (difficultyLevel >= 1) {
      const uppercaseChance = difficultyLevel >= 2 ? 0.7 : 0.5;
      if (Math.random() < uppercaseChance) {
        return baseLetter.toUpperCase();
      }
    }

    return baseLetter;
  }, [availableKeys]);

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
        setScore(prev => prev + 10);
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
        const obstacle: Obstacle = {
          x: CANVAS_WIDTH,
          y: GROUND_Y - OBSTACLE_HEIGHT,
          width: OBSTACLE_WIDTH,
          height: OBSTACLE_HEIGHT,
          letter: getRandomLetter(state.difficultyLevel),
          passed: false,
        };
        state.obstacles.push(obstacle);
        state.totalObstacles++;
        state.nextObstacleIn =
          MIN_OBSTACLE_SPACING + Math.random() * (MAX_OBSTACLE_SPACING - MIN_OBSTACLE_SPACING);
      }

      // Hindernisse zeichnen und bewegen
      state.obstacles.forEach((obstacle, index) => {
        obstacle.x -= state.gameSpeed;

        // Hindernis zeichnen
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        // Buchstabe auf Hindernis (exakte Darstellung - mit Groß-/Kleinschreibung)
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          obstacle.letter,
          obstacle.x + obstacle.width / 2,
          obstacle.y + obstacle.height / 2
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
                  onGameOver({
                    correctPresses: state.correctPresses,
                    missedObstacles: state.missedObstacles,
                    totalObstacles: state.totalObstacles,
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
              onGameOver({
                correctPresses: state.correctPresses,
                missedObstacles: state.missedObstacles,
                totalObstacles: state.totalObstacles,
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

      // Geschwindigkeit und Schwierigkeit erhöhen mit der Zeit
      if (state.frameCount % 300 === 0) {
        state.gameSpeed += 0.5;
      }

      // Schwierigkeitsgrad erhöhen (Großbuchstaben hinzufügen)
      // Level 1: Nach 5 Hindernissen (Groß-/Kleinbuchstaben 50/50)
      // Level 2: Nach 15 Hindernissen (Groß-/Kleinbuchstaben 70/30)
      if (state.totalObstacles >= 15 && state.difficultyLevel < 2) {
        state.difficultyLevel = 2;
      } else if (state.totalObstacles >= 5 && state.difficultyLevel < 1) {
        state.difficultyLevel = 1;
      }

      // HUD
      ctx.fillStyle = '#000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 10, 30);
      ctx.fillText(`Leben: ${'❤️'.repeat(Math.max(0, lives))}`, 10, 60);

      // Schwierigkeitsgrad-Anzeige
      const difficultyText = state.difficultyLevel === 0 ? 'Einfach' : state.difficultyLevel === 1 ? 'Mittel' : 'Schwer';
      ctx.fillText(`Level: ${difficultyText}`, 10, 90);

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
