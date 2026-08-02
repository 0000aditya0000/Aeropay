/**
 * AeroPay MD5 signature helpers
 *
 * Rules (from AroPay docs):
 * 1. Ignore `sign`
 * 2. Ignore empty / null / undefined fields — BUT keep numeric 0 (type=0, code=0)
 * 3. Sort keys alphabetically (A-Z)
 * 4. Join as key=value&key=value
 * 5. Append &secret=YOUR_SECRET
 * 6. MD5 → lowercase hex
 *
 * Webhook note: orderAmount MUST be signed with exactly 2 decimal places (e.g. 100.00)
 */

const crypto = require('crypto');

const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  // Do NOT treat 0 / false as empty — docs warn about type=0 / code=0
  return false;
};

/**
 * Normalize orderAmount for webhook signature verification.
 * @param {any} amount
 * @returns {string}
 */
const formatAmountTwoDecimals = (amount) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return n.toFixed(2);
};

/**
 * Build canonical sign string (without MD5).
 * @param {Object} params
 * @param {string} secret
 * @param {Object} [options]
 * @param {boolean} [options.forceAmountDecimals] - force orderAmount to 2 decimals
 * @returns {string}
 */
const buildSignPayload = (params = {}, secret, options = {}) => {
  if (!secret) {
    throw new Error('AeroPay secret is required for signature generation');
  }

  const filtered = {};
  Object.keys(params).forEach((key) => {
    if (key === 'sign') return;
    let value = params[key];
    if (isEmptyValue(value)) return;

    if (
      options.forceAmountDecimals &&
      key === 'orderAmount' &&
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      value = formatAmountTwoDecimals(value);
    }

    filtered[key] = value;
  });

  const sortedKeys = Object.keys(filtered).sort();
  const pairs = sortedKeys.map((key) => `${key}=${filtered[key]}`);
  return `${pairs.join('&')}&secret=${secret}`;
};

/**
 * Generate MD5 signature (lowercase).
 * @param {Object} params
 * @param {string} secret
 * @param {Object} [options]
 * @returns {string}
 */
const generateSignature = (params, secret, options = {}) => {
  const payload = buildSignPayload(params, secret, options);
  return crypto.createHash('md5').update(payload, 'utf8').digest('hex').toLowerCase();
};

/**
 * Verify signature using timing-safe compare when lengths match.
 * @param {Object} params - full body including sign
 * @param {string} secret
 * @param {Object} [options]
 * @returns {boolean}
 */
const verifySignature = (params, secret, options = {}) => {
  const incoming = String(params?.sign || '').toLowerCase();
  if (!incoming) return false;

  const expected = generateSignature(params, secret, options);
  const a = Buffer.from(incoming);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

/**
 * Attach sign to a copy of params.
 */
const signParams = (params, secret, options = {}) => {
  const signed = { ...params };
  signed.sign = generateSignature(signed, secret, options);
  return signed;
};

module.exports = {
  isEmptyValue,
  formatAmountTwoDecimals,
  buildSignPayload,
  generateSignature,
  verifySignature,
  signParams,
};
