const nodemailer = require('nodemailer');

// Erstelle Transporter für Postfix
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'mailserver',
  port: process.env.MAIL_PORT || 25,
  secure: false, // true für 465, false für andere Ports
  tls: {
    rejectUnauthorized: false // Für selbst-signierte Zertifikate
  }
});

// Test Verbindung beim Start
transporter.verify((error, success) => {
  if (error) {
    console.error('✗ Mail-Server Verbindung fehlgeschlagen:', error.message);
  } else {
    console.log('✓ Mail-Server bereit zum Versenden');
  }
});

/**
 * Sendet eine E-Mail
 * @param {Object} options - Mail-Optionen
 * @param {string} options.to - Empfänger E-Mail
 * @param {string} options.subject - Betreff
 * @param {string} options.text - Plain Text Inhalt
 * @param {string} options.html - HTML Inhalt (optional)
 * @returns {Promise}
 */
const sendMail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: `"TenFingers" <${process.env.MAIL_FROM || 'noreply@tenfingers.pra.ng'}>`,
      to,
      subject,
      text,
      html: html || text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ E-Mail gesendet:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Fehler beim E-Mail-Versand:', error.message);
    throw error;
  }
};

/**
 * Sendet Zugangsdaten an einen neuen Schüler
 */
const sendStudentCredentials = async (email, username, password) => {
  const subject = 'Deine TenFingers Zugangsdaten';
  const text = `
Hallo ${username},

dein Lehrer hat einen Account für dich bei TenFingers erstellt!

Deine Zugangsdaten:
Benutzername: ${username}
Passwort: ${password}

Du kannst dich jetzt unter https://tenfingers.pra.ng anmelden und mit dem Tippen üben!

Viel Erfolg beim Lernen!

--
TenFingers - 10-Finger-Schreibtrainer
https://tenfingers.pra.ng
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #667eea;">Willkommen bei TenFingers!</h2>
      <p>Hallo <strong>${username}</strong>,</p>
      <p>dein Lehrer hat einen Account für dich erstellt!</p>

      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Benutzername:</strong> ${username}</p>
        <p style="margin: 5px 0;"><strong>Passwort:</strong> ${password}</p>
      </div>

      <p>Du kannst dich jetzt anmelden und mit dem Tippen üben:</p>
      <p>
        <a href="https://tenfingers.pra.ng"
           style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px;">
          Jetzt anmelden
        </a>
      </p>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Viel Erfolg beim Lernen!<br>
        --<br>
        TenFingers - 10-Finger-Schreibtrainer
      </p>
    </div>
  `;

  return sendMail({ to: email, subject, text, html });
};

/**
 * Sendet Passwort-Reset-Link
 */
const sendPasswordReset = async (email, username, resetToken) => {
  const resetUrl = `https://tenfingers.pra.ng/reset-password?token=${resetToken}`;

  const subject = 'Passwort zurücksetzen - TenFingers';
  const text = `
Hallo ${username},

du hast ein neues Passwort angefordert.

Klicke auf diesen Link, um dein Passwort zurückzusetzen:
${resetUrl}

Der Link ist 1 Stunde gültig.

Falls du kein neues Passwort angefordert hast, ignoriere diese E-Mail.

--
TenFingers - 10-Finger-Schreibtrainer
https://tenfingers.pra.ng
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #667eea;">Passwort zurücksetzen</h2>
      <p>Hallo <strong>${username}</strong>,</p>
      <p>du hast ein neues Passwort angefordert.</p>

      <p style="margin: 30px 0;">
        <a href="${resetUrl}"
           style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px;">
          Passwort zurücksetzen
        </a>
      </p>

      <p style="color: #666; font-size: 14px;">
        Der Link ist 1 Stunde gültig.<br>
        Falls du kein neues Passwort angefordert hast, ignoriere diese E-Mail.
      </p>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        --<br>
        TenFingers - 10-Finger-Schreibtrainer
      </p>
    </div>
  `;

  return sendMail({ to: email, subject, text, html });
};

module.exports = {
  sendMail,
  sendStudentCredentials,
  sendPasswordReset
};
