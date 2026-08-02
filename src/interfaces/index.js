/**
 * JSDoc interfaces / typedefs for AeroPay module
 */

/**
 * @typedef {Object} PayinCreateInput
 * @property {string} merchantOrderNo
 * @property {number} orderAmount
 * @property {string} notifyUrl
 * @property {string} [returnUrl]
 * @property {string} [extra]
 */

/**
 * @typedef {Object} PayoutCreateInput
 * @property {string} merchantOrderNo
 * @property {number} orderAmount
 * @property {string} accountName
 * @property {string} cardNumber
 * @property {string} ifsc
 * @property {string} bankName
 * @property {string} [upi]
 * @property {string} notifyUrl
 * @property {string} phone
 * @property {string} email
 * @property {string} [extra]
 */

/**
 * @typedef {Object} AeropayWebhookPayload
 * @property {1|2} code
 * @property {number} mchId
 * @property {string} mchOrderNo
 * @property {number} orderAmount
 * @property {string} [utr]
 * @property {string} orderNo
 * @property {string} [paySuccessTime]
 * @property {string} message
 * @property {string} extra
 * @property {string} sign
 */

module.exports = {};
