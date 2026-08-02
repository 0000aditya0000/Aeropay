require('dotenv').config();

const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const toFloat = (v, fallback) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3010),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim()),
  bodyLimit: process.env.BODY_LIMIT || '1mb',
  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.RATE_LIMIT_MAX, 100),
  },

  aeropay: {
    baseURL: (process.env.AEROPAY_BASE_URL || 'https://api.aropay-api.com').replace(/\/$/, ''),
    merchantId: toInt(process.env.AEROPAY_MERCHANT_ID, 0),
    secret: process.env.AEROPAY_SECRET || '',
    timeoutMs: toInt(process.env.AEROPAY_TIMEOUT_MS, 30000),
    retryCount: toInt(process.env.AEROPAY_RETRY_COUNT, 3),
    notifyUrl: process.env.NOTIFY_URL || '',
    payoutNotifyUrl: process.env.PAYOUT_NOTIFY_URL || '',
    returnUrl: process.env.RETURN_URL || '',
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: toInt(process.env.DB_PORT, 3306),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'skillpay',
    logging: process.env.DB_LOGGING === 'true',
    syncLogTables: process.env.DB_SYNC_LOG_TABLES !== 'false',
  },

  platform: {
    baseURL: (process.env.PLATFORM_BASE_URL || 'https://api.rollix777.com').replace(/\/$/, ''),
    walletBonusMultiplier: toFloat(process.env.WALLET_BONUS_MULTIPLIER, 1.1),
  },

  logLevel: process.env.LOG_LEVEL || 'info',
});

module.exports = config;
