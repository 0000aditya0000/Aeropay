const { paymentService } = require('../services/payment.service');
const { success } = require('../helpers/response');
const logger = require('../utils/logger');

const metaFromReq = (req) => ({
  requestId: req.requestId,
  correlationId: req.correlationId,
});

/**
 * App payin — SkillPay compatible
 * POST /api/payments/user/order
 * Returns { paymentUrl } primarily; also includes order metadata for debugging.
 */
const createUserOrder = async (req, res, next) => {
  try {
    const result = await paymentService.createUserOrder(req.body, metaFromReq(req));
    return res.json({
      paymentUrl: result.paymentUrl,
      orderNo: result.orderNo,
      merchantOrderNo: result.merchantOrderNo,
      upi: result.upi,
      deeplink: result.deeplink,
    });
  } catch (err) {
    return next(err);
  }
};

/** Direct AeroPay payin create proxy */
const createPayin = async (req, res, next) => {
  try {
    const data = await paymentService.createPayin(req.body, metaFromReq(req));
    return success(res, 'Payment Created Successfully', data);
  } catch (err) {
    return next(err);
  }
};

const queryOrder = async (req, res, next) => {
  try {
    const merchantOrderNo = req.body.merchantOrderNo || req.body.merchantOrderId || req.body.paymentId;
    const data = await paymentService.queryOrder(merchantOrderNo, metaFromReq(req));
    return success(res, 'Order queried successfully', data);
  } catch (err) {
    return next(err);
  }
};

const queryUpiStatus = async (req, res, next) => {
  try {
    const data = await paymentService.queryUpiStatus(req.body.upi, metaFromReq(req));
    return success(res, 'UPI status fetched', data);
  } catch (err) {
    return next(err);
  }
};

const queryUtrStatus = async (req, res, next) => {
  try {
    const data = await paymentService.queryUtrStatus(req.body.utr, metaFromReq(req));
    return success(res, 'UTR status fetched', data);
  } catch (err) {
    return next(err);
  }
};

const supplementOrder = async (req, res, next) => {
  try {
    const data = await paymentService.supplementOrder(req.body, metaFromReq(req));
    return success(res, 'Supplement order submitted', data);
  } catch (err) {
    return next(err);
  }
};

const submitUtr = async (req, res, next) => {
  try {
    const orderNo = req.body.orderNo || req.body.paymentId || req.body.merchantOrderId;
    const utr = req.body.utr || req.body.utrNumber;
    const data = await paymentService.submitUtr({ orderNo, utr }, metaFromReq(req));
    return success(res, 'UTR submitted', data);
  } catch (err) {
    return next(err);
  }
};

/**
 * Payin webhook — MUST return lowercase "success" immediately.
 * Async processing after ACK.
 */
const payinWebhook = async (req, res) => {
  logger.webhookLogger.info('Payin webhook received', { body: req.body, requestId: req.requestId });

  // Immediate ACK per AeroPay docs
  res.status(200).type('text/plain').send(paymentService.acknowledgeWebhook());

  setImmediate(async () => {
    try {
      await paymentService.processPayinWebhook(req.body, metaFromReq(req));
    } catch (err) {
      logger.logError('PayinWebhook', 'Async processing failed', err);
    }
  });
};

module.exports = {
  createUserOrder,
  createPayin,
  queryOrder,
  queryUpiStatus,
  queryUtrStatus,
  supplementOrder,
  submitUtr,
  payinWebhook,
};
