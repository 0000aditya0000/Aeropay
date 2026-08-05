const rateLimit = require('express-rate-limit');
const config = require('../config');
const { HTTP } = require('../constants');

const CREATE_ORDER_MAX = 3;
const CREATE_ORDER_WINDOW_MS = 60 * 1000;
const CREATE_ORDER_COOLDOWN_MS = 5 * 60 * 1000;

/** @type {Map<string, { hits: number[], cooldownUntil: number }>} */
const createOrderBuckets = new Map();

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

const getCreateOrderKey = (req) => {
  const userId = req.body?.userId;
  if (userId != null && String(userId).trim() !== '') {
    return `user:${String(userId).trim()}`;
  }
  return `ip:${req.ip}`;
};

/**
 * Create-order limiter: allow 3 hits within 1 minute; after the 3rd hit,
 * enforce a 5-minute cooldown before the next request is allowed.
 */
const payinRateLimiter = (req, res, next) => {
  const key = getCreateOrderKey(req);
  const now = Date.now();
  let bucket = createOrderBuckets.get(key);

  if (!bucket) {
    bucket = { hits: [], cooldownUntil: 0 };
    createOrderBuckets.set(key, bucket);
  }

  if (bucket.cooldownUntil > now) {
    const retryAfterSec = Math.ceil((bucket.cooldownUntil - now) / 1000);
    res.set('Retry-After', String(retryAfterSec));
    return res.status(HTTP.TOO_MANY).json({
      success: false,
      message: `Rate limit exceeded. Try again in ${retryAfterSec} seconds`,
      error: {
        code: 'PAYIN_RATE_LIMIT',
        retryAfterSeconds: retryAfterSec,
      },
    });
  }

  // Cooldown elapsed — start a fresh window
  if (bucket.cooldownUntil > 0 && bucket.cooldownUntil <= now) {
    bucket.hits = [];
    bucket.cooldownUntil = 0;
  }

  bucket.hits = bucket.hits.filter((t) => now - t < CREATE_ORDER_WINDOW_MS);
  bucket.hits.push(now);

  const remaining = CREATE_ORDER_MAX - bucket.hits.length;
  res.set('X-RateLimit-Limit', String(CREATE_ORDER_MAX));
  res.set('X-RateLimit-Remaining', String(Math.max(0, remaining)));

  if (bucket.hits.length >= CREATE_ORDER_MAX) {
    bucket.cooldownUntil = now + CREATE_ORDER_COOLDOWN_MS;
    bucket.hits = [];
  }

  return next();
};

module.exports = {
  globalRateLimiter,
  payinRateLimiter,
};
