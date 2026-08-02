/**
 * AeroPay / AroPay constants & enums
 * Docs: AroPay对接文档 — status values for query must NOT be confused with webhook code.
 */

const GATEWAY_NAME = 'AeroPay';
const PAYMENT_MODE = 'aeropay';

/** Create-order business type */
const ORDER_TYPE = Object.freeze({
  PAYIN: 0,
  PAYOUT: 1,
});

/**
 * Order query status (applies only to /api/pay/query/order).
 * Common AroPay mapping used across collection/payout query responses.
 * Webhook uses a different field: code (1|2).
 */
const ORDER_STATUS = Object.freeze({
  PENDING: 0,
  PROCESSING: 1,
  SUCCESS: 2,
  FAILED: 3,
  CLOSED: 4,
});

/** Webhook callback code — ONLY 1 or 2 */
const WEBHOOK_CODE = Object.freeze({
  SUCCESS: 1,
  REJECTED: 2,
});

/** Platform withdrawl.status mapping */
const WITHDRAW_STATUS = Object.freeze({
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
});

/** UPI query status */
const UPI_STATUS = Object.freeze({
  NOT_FOUND: 'NOT_FOUND',
  DISABLED: 'DISABLED',
  ENABLED: 'ENABLED',
});

/** UTR query status */
const UTR_STATUS = Object.freeze({
  INCORRECT_FORMAT: 'INCORRECT_FORMAT',
  UTR_NOT_EXIST: 'UTR_NOT_EXIST',
  OTHER_BOUND: 'OTHER_BOUND',
  SELF_BOUND: 'SELF_BOUND',
  UTR_FAIL: 'UTR_FAIL',
  ERROR: 'ERROR',
  UNBOUND: 'UNBOUND',
});

/** AeroPay upstream paths (exact from documentation) */
const AEROPAY_PATHS = Object.freeze({
  CREATE_ORDER: '/api/pay/create/order',
  QUERY_ORDER: '/api/pay/query/order',
  MERCHANT_BALANCE: '/api/pay/merchant/balance',
  QUERY_UPI_STATUS: '/api/pay/query/upi/status',
  QUERY_UTR_STATUS: '/api/pay/oneself/query/utr/status',
  SUPPLEMENT_ORDER: '/api/pay/supplement/order',
  SUBMIT_UTR: '/api/wallet/submit',
});

const HTTP = Object.freeze({
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY: 429,
  ERROR: 500,
});

const RETRYABLE_CODES = Object.freeze([
  'ECONNABORTED',
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
]);

module.exports = {
  GATEWAY_NAME,
  PAYMENT_MODE,
  ORDER_TYPE,
  ORDER_STATUS,
  WEBHOOK_CODE,
  WITHDRAW_STATUS,
  UPI_STATUS,
  UTR_STATUS,
  AEROPAY_PATHS,
  HTTP,
  RETRYABLE_CODES,
};
