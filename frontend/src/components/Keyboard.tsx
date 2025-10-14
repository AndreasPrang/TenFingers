import React from 'react';
import '../styles/Keyboard.css';

interface KeyboardProps {
  currentKey?: string;
  pressedKey?: string;
  highlightKeys?: string[];
}

// Deutsche QWERTZ Tastatur Layout
const keyboardLayout = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'ß', '´'],
  ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ü', '+'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä', '#'],
  ['<', 'y', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-'],
];

// Zuordnung welcher Finger welche Taste drückt
const fingerMapping: { [key: string]: string } = {
  // Linke Hand
  '1': 'pinky-left', '2': 'ring-left', '3': 'middle-left', '4': 'index-left', '5': 'index-left',
  'q': 'pinky-left', 'w': 'ring-left', 'e': 'middle-left', 'r': 'index-left', 't': 'index-left',
  'a': 'pinky-left', 's': 'ring-left', 'd': 'middle-left', 'f': 'index-left', 'g': 'index-left',
  '<': 'pinky-left', 'y': 'ring-left', 'x': 'middle-left', 'c': 'index-left', 'v': 'index-left',

  // Rechte Hand
  '6': 'index-right', '7': 'index-right', '8': 'middle-right', '9': 'ring-right', '0': 'pinky-right', 'ß': 'pinky-right', '´': 'pinky-right',
  'z': 'index-right', 'u': 'index-right', 'i': 'middle-right', 'o': 'ring-right', 'p': 'pinky-right', 'ü': 'pinky-right', '+': 'pinky-right',
  'h': 'index-right', 'j': 'index-right', 'k': 'middle-right', 'l': 'ring-right', 'ö': 'pinky-right', 'ä': 'pinky-right', '#': 'pinky-right',
  'b': 'index-right', 'n': 'index-right', 'm': 'middle-right', ',': 'ring-right', '.': 'pinky-right', '-': 'pinky-right',

  ' ': 'thumb',
};

// Home Row Keys (Grundreihe)
const homeRowKeys = ['a', 's', 'd', 'f', 'j', 'k', 'l', 'ö'];

const Keyboard: React.FC<KeyboardProps> = ({ currentKey, pressedKey, highlightKeys = [] }) => {
  const getKeyClass = (key: string): string => {
    const classes: string[] = ['key'];

    // Grundreihen-Markierung
    if (homeRowKeys.includes(key.toLowerCase())) {
      classes.push('home-row');
    }

    // Finger-Zuordnung
    const finger = fingerMapping[key.toLowerCase()];
    if (finger) {
      classes.push(`finger-${finger}`);
    }

    // Aktueller Ziel-Key
    if (currentKey && key.toLowerCase() === currentKey.toLowerCase()) {
      classes.push('current');
    }

    // Gedrückter Key
    if (pressedKey && key.toLowerCase() === pressedKey.toLowerCase()) {
      classes.push('pressed');
    }

    // Hervorgehobene Keys
    if (highlightKeys.includes(key.toLowerCase())) {
      classes.push('highlighted');
    }

    return classes.join(' ');
  };

  return (
    <div className="keyboard">
      {keyboardLayout.map((row, rowIndex) => (
        <div key={rowIndex} className={`keyboard-row row-${rowIndex}`}>
          {row.map((key) => (
            <div key={key} className={getKeyClass(key)}>
              <span className="key-label">{key}</span>
            </div>
          ))}
        </div>
      ))}
      <div className="keyboard-row row-4">
        <div className={getKeyClass(' ')} style={{ flexGrow: 4 }}>
          <span className="key-label">Leertaste</span>
        </div>
      </div>

      <div className="finger-legend">
        <div className="legend-item">
          <span className="legend-color pinky-left"></span>
          <span>Linker kl. Finger</span>
        </div>
        <div className="legend-item">
          <span className="legend-color ring-left"></span>
          <span>L. Ringfinger</span>
        </div>
        <div className="legend-item">
          <span className="legend-color middle-left"></span>
          <span>L. Mittelfinger</span>
        </div>
        <div className="legend-item">
          <span className="legend-color index-left"></span>
          <span>L. Zeigefinger</span>
        </div>
        <div className="legend-item">
          <span className="legend-color thumb"></span>
          <span>Daumen</span>
        </div>
        <div className="legend-item">
          <span className="legend-color index-right"></span>
          <span>R. Zeigefinger</span>
        </div>
        <div className="legend-item">
          <span className="legend-color middle-right"></span>
          <span>R. Mittelfinger</span>
        </div>
        <div className="legend-item">
          <span className="legend-color ring-right"></span>
          <span>R. Ringfinger</span>
        </div>
        <div className="legend-item">
          <span className="legend-color pinky-right"></span>
          <span>Rechter kl. Finger</span>
        </div>
      </div>
    </div>
  );
};

export default Keyboard;
