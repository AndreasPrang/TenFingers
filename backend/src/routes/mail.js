const express = require('express');
const router = express.Router();
const { sendMail } = require('../services/mailService');

// Test-Endpoint zum E-Mail versenden
router.post('/test', async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({
        success: false,
        message: 'to, subject und text sind erforderlich'
      });
    }

    const result = await sendMail({ to, subject, text });

    res.json({
      success: true,
      message: 'E-Mail erfolgreich versendet',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Fehler beim E-Mail-Versand:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim E-Mail-Versand',
      error: error.message
    });
  }
});

module.exports = router;
