const homePracticeTexts = require('../config/homePracticeTexts');

// Gibt einen zufälligen Übungstext für die Startseite zurück
const getRandomPracticeText = (req, res) => {
  try {
    const randomIndex = Math.floor(Math.random() * homePracticeTexts.length);
    const text = homePracticeTexts[randomIndex];

    res.json({
      success: true,
      text: text
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Übungstexts:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen des Übungstexts'
    });
  }
};

module.exports = {
  getRandomPracticeText
};
