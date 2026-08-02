const rateLimit = require('express-rate-limit');
const config = require('../config');

const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests',
    error: { code: 'RATE_LIMIT' },
  },
});

const payinRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many payin requests, please try later',
    error: { code: 'PAYIN_RATE_LIMIT' },
  },
});

module.exports = {
  globalRateLimiter,
  payinRateLimiter,
};
