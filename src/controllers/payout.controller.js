const { payoutService } = require('../services/payout.service');
const { success } = require('../helpers/response');
const logger = require('../utils/logger');

const metaFromReq = (req) => ({
  requestId: req.requestId,
  correlationId: req.correlationId,
});

const createPayout = async (req, res, next) => {
  try {
    const result = await payoutService.createPayout(req.body, metaFromReq(req));
    return res.json({
      success: true,
      message: 'Payout Created Successfully',
      mOrderId: result.mOrderId,
      orderNo: result.orderNo,
      data: result.data,
    });
  } catch (err) {
    return next(err);
  }
};

const queryPayout = async (req, res, next) => {
  try {
    const merchantOrderNo = req.body.merchantOrderNo || req.body.mOrderId;
    const data = await payoutService.queryOrder(merchantOrderNo, metaFromReq(req));
    return success(res, 'Payout queried successfully', data);
  } catch (err) {
    return next(err);
  }
};

const merchantBalance = async (req, res, next) => {
  try {
    const data = await payoutService.getMerchantBalance(metaFromReq(req));
    return success(res, 'Merchant balance fetched', data);
  } catch (err) {
    return next(err);
  }
};

/**
 * Payout webhook — return lowercase "success" immediately, process async.
 */
const payoutWebhook = async (req, res) => {
  logger.webhookLogger.info('Payout webhook received', { body: req.body, requestId: req.requestId });
  res.status(200).type('text/plain').send('success');

  setImmediate(async () => {
    try {
      await payoutService.processPayoutWebhook(req.body, metaFromReq(req));
    } catch (err) {
      logger.logError('PayoutWebhook', 'Async processing failed', err);
    }
  });
};

module.exports = {
  createPayout,
  queryPayout,
  merchantBalance,
  payoutWebhook,
};
