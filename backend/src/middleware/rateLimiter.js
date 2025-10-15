const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter für Registrierungen
 * Max 3 Registrierungen pro IP pro 15 Minuten
 */
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 3, // Max 3 Anfragen pro Fenster
  message: {
    error: 'Zu viele Registrierungsversuche von dieser IP-Adresse. Bitte versuchen Sie es in 15 Minuten erneut.'
  },
  standardHeaders: true, // Rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Extrahiere IP auch hinter Proxies (Nginx, Cloudflare)
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
});

/**
 * Rate Limiter für Login-Versuche
 * Max 5 Login-Versuche pro IP pro 15 Minuten
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5, // Max 5 Anfragen pro Fenster
  message: {
    error: 'Zu viele Login-Versuche. Bitte versuchen Sie es in 15 Minuten erneut.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
});

/**
 * Rate Limiter für Passwort-Reset
 * Max 3 Anfragen pro IP pro Stunde
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 3, // Max 3 Anfragen pro Stunde
  message: {
    error: 'Zu viele Passwort-Reset-Anfragen. Bitte versuchen Sie es in einer Stunde erneut.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
});

/**
 * Rate Limiter für Bulk-Schüler-Erstellung
 * Max 10 Bulk-Operationen pro Stunde (Lehrer)
 */
const bulkStudentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 10, // Max 10 Bulk-Operationen
  message: {
    error: 'Zu viele Bulk-Operationen. Bitte versuchen Sie es später erneut.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Nutze User-ID statt IP für authentifizierte Anfragen
    return req.user?.id || req.ip;
  }
});

/**
 * Allgemeiner API Rate Limiter
 * Max 100 Anfragen pro IP pro 15 Minuten
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Max 100 Anfragen
  message: {
    error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Nur auf /api/* anwenden, nicht auf health checks
  skip: (req) => req.path === '/api/health' || req.path === '/health',
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
});

module.exports = {
  registerLimiter,
  loginLimiter,
  passwordResetLimiter,
  bulkStudentLimiter,
  apiLimiter
};
