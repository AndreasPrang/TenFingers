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
  isSpecial?: boolean; // Ob dies ein spezielles Hindernis ist
  specialType?: number; // 0: Tumbleweed, 1: Weihnachtsmann, 2: Geschenk, 3: Geist
}

interface RunnerGameProps {
  targetKeys: string;
  highscore?: { wpm: number; accuracy: number } | null;
  onGameOver: (stats: { correctPresses: number; missedObstacles: number; totalObstacles: number; elapsedTimeMs: number; score: number }) => void;
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
    gameSpeed: 4.5,
    frameCount: 0,
    correctPresses: 0,
    missedObstacles: 0,
    totalObstacles: 0,
    gameOver: false,
    nextObstacleIn: 0,
    difficultyLevel: 0,
    startTime: 0,
    pointsPerJump: 10, // Dynamische Punkte pro Sprung
    score: 0, // Score im State für onGameOver
    lastFrameTime: 0, // Für delta-time Berechnung
  });

  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 600;
  const GROUND_Y = CANVAS_HEIGHT - 75;
  const PLAYER_X = 150;
  const PLAYER_SIZE = 60;
  const JUMP_STRENGTH = -18;
  const GRAVITY = 0.75;
  const OBSTACLE_WIDTH = 60;
  const OBSTACLE_HEIGHT = 75;
  const MIN_OBSTACLE_SPACING = 120;
  const MAX_OBSTACLE_SPACING = 180;

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
        const newScore = state.score + state.pointsPerJump;
        state.score = newScore;
        setScore(newScore);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, getRandomLetter]);

  // Hilfsfunktion zum Zeichnen des Dinos
  const drawDino = (ctx: CanvasRenderingContext2D, dinoX: number, dinoY: number, legFrame: number = 0) => {
    ctx.fillStyle = '#535353'; // Dunkelgrau wie Chrome Dino

    // Hinterbeine (2 Beine mit Animation) - 1.5x skaliert
    // legFrame: 0 = beide unten, 1 = linkes hoch, 2 = rechtes hoch
    if (legFrame === 1) {
      // Linkes Bein angehoben, rechtes unten
      ctx.fillRect(dinoX + 33, dinoY + 39, 6, 18); // Rechtes Bein unten
      ctx.fillRect(dinoX + 27, dinoY + 33, 6, 12); // Linkes Bein angehoben (kürzer)
    } else if (legFrame === 2) {
      // Rechtes Bein angehoben, linkes unten
      ctx.fillRect(dinoX + 33, dinoY + 33, 6, 12); // Rechtes Bein angehoben (kürzer)
      ctx.fillRect(dinoX + 27, dinoY + 39, 6, 18); // Linkes Bein unten
    } else {
      // Beide Beine unten (beim Springen oder Mittelposition)
      ctx.fillRect(dinoX + 33, dinoY + 39, 6, 18); // Rechtes Bein
      ctx.fillRect(dinoX + 27, dinoY + 39, 6, 18); // Linkes Bein
    }

    // Körper (Hauptteil)
    ctx.fillRect(dinoX + 15, dinoY + 18, 33, 24);

    // Hals
    ctx.fillRect(dinoX + 39, dinoY + 6, 9, 18);

    // Kopf
    ctx.fillRect(dinoX + 39, dinoY, 24, 15);

    // Schnauze
    ctx.fillRect(dinoX + 57, dinoY + 6, 9, 9);

    // Schwanz
    ctx.fillRect(dinoX + 3, dinoY + 21, 15, 12);
    ctx.fillRect(dinoX, dinoY + 27, 6, 6);

    // Auge (weiß mit schwarzer Pupille)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(dinoX + 45, dinoY + 3, 6, 6);
    ctx.fillStyle = '#000000';
    ctx.fillRect(dinoX + 48, dinoY + 4.5, 3, 3);

    // Mund (kleine Linie)
    ctx.fillStyle = '#535353';
    ctx.fillRect(dinoX + 60, dinoY + 12, 3, 1.5);

    // Vorderbeine (kurze T-Rex Arme)
    ctx.fillStyle = '#535353';
    ctx.fillRect(dinoX + 27, dinoY + 24, 4.5, 9);
    ctx.fillRect(dinoX + 36, dinoY + 24, 4.5, 9);

    // Rückenzacken (3 Zacken)
    ctx.fillRect(dinoX + 21, dinoY + 15, 3, 6);
    ctx.fillRect(dinoX + 27, dinoY + 12, 3, 6);
    ctx.fillRect(dinoX + 33, dinoY + 15, 3, 6);
  };

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

    // Dino zeichnen (stehend an der gleichen Position wie im Spiel)
    const dinoY = GROUND_Y - PLAYER_SIZE;
    drawDino(ctx, PLAYER_X, dinoY, 0);

    // "Drücke Leertaste zum Starten" Text
    ctx.fillStyle = '#000';
    ctx.font = 'bold 36px Arial';
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

    const gameLoop = (currentTime: number) => {
      const state = gameStateRef.current;

      if (state.gameOver) {
        return;
      }

      // FPS-Limiter: Nur rendern wenn mindestens 16.67ms vergangen sind (60 FPS)
      if (state.lastFrameTime === 0) {
        state.lastFrameTime = currentTime;
      }
      const deltaTime = currentTime - state.lastFrameTime;

      // Überspringe Frame wenn weniger als 16.67ms vergangen sind
      if (deltaTime < 16.67) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      state.lastFrameTime = currentTime;
      state.frameCount++;

      // Hintergrund
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Boden
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      // Dino zeichnen (Chrome-Dino Style mit Lauf-Animation)
      // Bein-Animation: 0 = beide unten, 1 = linkes hoch, 2 = rechtes hoch
      // Wechselt alle 6 Frames zwischen den drei Zuständen
      let legFrame = 0;
      if (!state.isJumping) {
        const animCycle = Math.floor(state.frameCount / 6) % 3;
        legFrame = animCycle; // 0, 1, 2, 0, 1, 2, ...
      }
      drawDino(ctx, PLAYER_X, state.playerY, legFrame);

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
        // Sehr seltene Überraschungen: ca. 0.1% Chance (1 von 1000)
        const isSpecial = Math.random() < 0.001;
        const cactusType = Math.floor(Math.random() * 3); // 0, 1 oder 2
        const specialType = isSpecial ? Math.floor(Math.random() * 4) : undefined; // 0-3 für verschiedene Überraschungen

        const obstacle: Obstacle = {
          x: CANVAS_WIDTH,
          y: GROUND_Y - OBSTACLE_HEIGHT,
          width: OBSTACLE_WIDTH,
          height: OBSTACLE_HEIGHT,
          letter: getRandomLetter(state.difficultyLevel),
          passed: false,
          cactusType,
          isSpecial,
          specialType,
        };
        state.obstacles.push(obstacle);
        state.totalObstacles++;

        // Abstände reduzieren NACH Level 5 (erst wenn alle Buchstaben da sind)
        let minSpacing = MIN_OBSTACLE_SPACING;
        let maxSpacing = MAX_OBSTACLE_SPACING;

        if (state.difficultyLevel >= 5 && state.totalObstacles > 25) {
          // Reduziere Abstände kontinuierlich nach Anzahl der Hindernisse (alle 3 Hindernisse)
          const reductionFactor = Math.floor((state.totalObstacles - 25) / 3);
          minSpacing = Math.max(MIN_OBSTACLE_SPACING - (reductionFactor * 6), 30); // Minimum 30px (1.5x von 20)
          maxSpacing = Math.max(MAX_OBSTACLE_SPACING - (reductionFactor * 9), 52.5); // Minimum 52.5px (1.5x von 35)

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

        const cactusX = obstacle.x;
        const cactusY = obstacle.y;
        const cactusH = obstacle.height;

        // Spezielle Hindernisse oder normale Kakteen
        if (obstacle.isSpecial && obstacle.specialType !== undefined) {
          // ÜBERRASCHUNG!
          if (obstacle.specialType === 0) {
            // Tumbleweed (Steppenläufer) - braun, rund mit Stacheln
            ctx.fillStyle = '#8B7355'; // Braun
            ctx.beginPath();
            ctx.arc(cactusX + 30, cactusY + 37.5, 25, 0, Math.PI * 2);
            ctx.fill();
            // Stacheln
            ctx.strokeStyle = '#6B5345';
            ctx.lineWidth = 2;
            for (let i = 0; i < 12; i++) {
              const angle = (i * Math.PI * 2) / 12;
              ctx.beginPath();
              ctx.moveTo(cactusX + 30, cactusY + 37.5);
              ctx.lineTo(cactusX + 30 + Math.cos(angle) * 30, cactusY + 37.5 + Math.sin(angle) * 30);
              ctx.stroke();
            }
          } else if (obstacle.specialType === 1) {
            // Weihnachtsmann
            ctx.fillStyle = '#DC143C'; // Rot für Mütze/Mantel
            ctx.fillRect(cactusX + 15, cactusY + 30, 30, 45); // Körper
            ctx.fillRect(cactusX + 18, cactusY + 15, 24, 18); // Kopf (Haut)
            ctx.fillStyle = '#FFE4C4'; // Haut
            ctx.fillRect(cactusX + 18, cactusY + 18, 24, 15);
            ctx.fillStyle = '#DC143C'; // Mütze
            ctx.fillRect(cactusX + 15, cactusY + 10, 30, 12);
            ctx.fillStyle = '#FFFFFF'; // Weiß für Bommel
            ctx.beginPath();
            ctx.arc(cactusX + 30, cactusY + 8, 5, 0, Math.PI * 2);
            ctx.fill();
            // Bart
            ctx.fillRect(cactusX + 18, cactusY + 28, 24, 10);
            // Gürtel
            ctx.fillStyle = '#000000';
            ctx.fillRect(cactusX + 15, cactusY + 50, 30, 4);
          } else if (obstacle.specialType === 2) {
            // Geschenk
            ctx.fillStyle = '#FFD700'; // Gold
            ctx.fillRect(cactusX + 12, cactusY + 30, 36, 45); // Box
            ctx.fillStyle = '#DC143C'; // Rote Schleife
            ctx.fillRect(cactusX + 27, cactusY + 30, 6, 45); // Vertikales Band
            ctx.fillRect(cactusX + 12, cactusY + 48, 36, 6); // Horizontales Band
            // Schleife oben
            ctx.beginPath();
            ctx.arc(cactusX + 22, cactusY + 26, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cactusX + 38, cactusY + 26, 6, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Geist
            ctx.fillStyle = '#F0F0F0'; // Weiß/Grau
            // Kopf (rund)
            ctx.beginPath();
            ctx.arc(cactusX + 30, cactusY + 20, 18, 0, Math.PI * 2);
            ctx.fill();
            // Körper
            ctx.fillRect(cactusX + 12, cactusY + 25, 36, 40);
            // Wellige untere Kante
            ctx.beginPath();
            ctx.moveTo(cactusX + 12, cactusY + 65);
            ctx.quadraticCurveTo(cactusX + 18, cactusY + 75, cactusX + 24, cactusY + 65);
            ctx.quadraticCurveTo(cactusX + 30, cactusY + 55, cactusX + 36, cactusY + 65);
            ctx.quadraticCurveTo(cactusX + 42, cactusY + 75, cactusX + 48, cactusY + 65);
            ctx.lineTo(cactusX + 48, cactusY + 25);
            ctx.lineTo(cactusX + 12, cactusY + 25);
            ctx.closePath();
            ctx.fill();
            // Augen
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(cactusX + 22, cactusY + 18, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cactusX + 38, cactusY + 18, 3, 0, Math.PI * 2);
            ctx.fill();
            // Mund (O-Form)
            ctx.beginPath();
            ctx.arc(cactusX + 30, cactusY + 28, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Normale Kakteen
          ctx.fillStyle = '#4A7C4E'; // Grün für Kaktus

          if (obstacle.cactusType === 0) {
            // Einfacher Kaktus
            ctx.fillRect(cactusX + 18, cactusY, 24, cactusH); // Stamm
            ctx.fillRect(cactusX + 12, cactusY + 15, 12, 22.5); // Linker Arm
            ctx.fillRect(cactusX + 36, cactusY + 22.5, 12, 22.5); // Rechter Arm
          } else if (obstacle.cactusType === 1) {
            // Hoher Kaktus
            ctx.fillRect(cactusX + 21, cactusY, 18, cactusH); // Stamm
            ctx.fillRect(cactusX + 9, cactusY + 22.5, 12, 30); // Linker Arm
          } else {
            // Breiter Kaktus mit zwei Armen
            ctx.fillRect(cactusX + 18, cactusY + 7.5, 24, cactusH - 7.5); // Stamm
            ctx.fillRect(cactusX + 6, cactusY + 18, 12, 27); // Linker Arm unten
            ctx.fillRect(cactusX + 42, cactusY + 18, 12, 27); // Rechter Arm unten
          }
        }

        // Buchstabe unter dem Kaktus
        ctx.fillStyle = '#000';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(
          obstacle.letter,
          obstacle.x + obstacle.width / 2,
          obstacle.y + obstacle.height + 7.5 // 7.5px unter dem Kaktus (1.5x von 5)
        );

        // Kollisionserkennung und erfolgreiches Überspringen
        const playerBottom = state.playerY + PLAYER_SIZE;
        const playerRight = PLAYER_X + PLAYER_SIZE;
        const obstacleRight = obstacle.x + obstacle.width;

        // Wenn der Spieler horizontal mit dem Hindernis überlappt
        if (PLAYER_X < obstacleRight && playerRight > obstacle.x) {
          if (!obstacle.passed) {
            // Prüfe ob Spieler hoch genug springt (mindestens 30px über Hindernis)
            const clearanceNeeded = obstacle.y - 30;

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
                  // Rufe onGameOver asynchron auf, um React-Warnung zu vermeiden
                  setTimeout(() => {
                    onGameOver({
                      correctPresses: state.correctPresses,
                      missedObstacles: state.missedObstacles,
                      totalObstacles: state.totalObstacles,
                      elapsedTimeMs,
                      score: state.score,
                    });
                  }, 0);
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
              // Rufe onGameOver asynchron auf, um React-Warnung zu vermeiden
              setTimeout(() => {
                onGameOver({
                  correctPresses: state.correctPresses,
                  missedObstacles: state.missedObstacles,
                  totalObstacles: state.totalObstacles,
                  elapsedTimeMs,
                  score: state.score,
                });
              }, 0);
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
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 15, 45);

      // Zeige Punkte-Multiplikator wenn erhöht
      if (state.pointsPerJump > 10) {
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.font = 'bold 27px Arial';
        ctx.fillText(`+${state.pointsPerJump} pro Sprung!`, 15, 82.5);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 30px Arial';
        ctx.fillText(`Leben: ${'❤️'.repeat(Math.max(0, lives))}`, 15, 120);
      } else {
        ctx.fillText(`Leben: ${'❤️'.repeat(Math.max(0, lives))}`, 15, 90);
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
      const levelY = state.pointsPerJump > 10 ? 165 : 135;
      ctx.fillText(`Level: ${difficultyNames[state.difficultyLevel]}`, 15, levelY);

      // Highscore anzeigen (rechts oben)
      if (highscore) {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.fillText(`🏆 Highscore: ${Math.round(highscore.wpm)}`, CANVAS_WIDTH - 15, 45);
        ctx.fillStyle = '#000';
      }

      if (!state.gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    // Initialisierung
    gameStateRef.current.playerY = GROUND_Y - PLAYER_SIZE;
    gameStateRef.current.nextObstacleIn = 150;
    gameStateRef.current.lastFrameTime = 0; // Reset delta-time

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
