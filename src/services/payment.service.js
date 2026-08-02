/**
 * Pay-in business service
 * Controllers → this layer → repositories + AeroPay API
 */

const config = require('../config');
const { aeropayApiService } = require('./aeropayApi.service');
const { platformService } = require('./platform.service');
const {
  rechargeRepository,
  paymentOrderRepository,
  userRepository,
  logRepository,
} = require('../repositories');
const { generatePayinOrderId } = require('../helpers/orderId');
const { ORDER_STATUS, WEBHOOK_CODE, ORDER_TYPE } = require('../constants');
const { verifySignature } = require('../helpers/signature');
const { ValidationError, GatewayError, SignatureError } = require('../utils/errors');
const logger = require('../utils/logger');

class PaymentService {
  async createUserOrder(input, meta = {}) {
    const { amount, userId, user_mobile, recharge_type } = input;

    if (String(userId) === '23414') {
      throw new ValidationError('Recharge not allowed');
    }

    if (!amount || Number(amount) <= 0) {
      throw new ValidationError('Valid amount is required');
    }

    logger.info('PaymentService', 'createUserOrder start', { userId, amount });

    const user = await userRepository.getStatus(userId);
    if (!user) throw new ValidationError('User not found', { userId });
    if (Number(user.status) !== 1) {
      throw new ValidationError('Not allowed to recharge - user account is not active');
    }

    const merchantOrderNo = generatePayinOrderId();
    const orderAmount = Number(amount);

    logger.info('PaymentService', 'Calling AeroPay createPayin', { merchantOrderNo, orderAmount });

    const gatewayResult = await aeropayApiService.createPayinOrder(
      {
        merchantOrderNo,
        orderAmount,
        notifyUrl: config.aeropay.notifyUrl,
        returnUrl: config.aeropay.returnUrl,
        extra: `uid=${userId}`,
      },
      meta
    );

    const gw = gatewayResult.data;
    logger.info('PaymentService', 'AeroPay response', {
      code: gw?.code,
      message: gw?.message,
      hasData: Boolean(gw?.data),
    });

    if (!gw || Number(gw.code) !== 200 || !gw.data) {
      throw new GatewayError(gw?.message || 'AeroPay payin create failed', gw);
    }

    const { orderNo, payUrl, upi, deeplink, orderAmount: gwAmount } = gw.data;
    if (!payUrl) {
      throw new GatewayError('Failed to get payment URL from AeroPay', gw);
    }

    logger.info('PaymentService', 'Inserting recharge row', { merchantOrderNo, orderNo });

    await rechargeRepository.createPending({
      orderId: merchantOrderNo,
      userId,
      userMobile: user_mobile,
      amount: orderAmount,
      rechargeType: recharge_type || 'aeropay',
    });

    await paymentOrderRepository.create({
      merchant_id: config.aeropay.merchantId,
      merchant_order_no: merchantOrderNo,
      gateway_order_no: orderNo || null,
      user_id: userId,
      order_amount: orderAmount,
      status: ORDER_STATUS.PENDING,
      pay_url: payUrl,
      upi: upi || null,
      deeplink: deeplink || null,
      notify_url: config.aeropay.notifyUrl,
      return_url: config.aeropay.returnUrl,
      extra: `uid=${userId}`,
      raw_request: { amount, userId, merchantOrderNo },
      raw_response: gw,
      request_id: meta.requestId || null,
    }).catch((err) => logger.warn('PaymentService', 'PaymentOrder insert skipped', { error: err.message }));

    return {
      paymentUrl: payUrl,
      orderNo,
      merchantOrderNo,
      orderAmount: gwAmount ?? orderAmount,
      upi,
      deeplink,
    };
  }

  async createPayin(input, meta = {}) {
    const merchantOrderNo = input.merchantOrderNo || generatePayinOrderId();
    const result = await aeropayApiService.createPayinOrder(
      { ...input, merchantOrderNo },
      meta
    );

    const gw = result.data;
    if (!gw || Number(gw.code) !== 200) {
      throw new GatewayError(gw?.message || 'Payin create failed', gw);
    }

    await paymentOrderRepository.create({
      merchant_id: config.aeropay.merchantId,
      merchant_order_no: merchantOrderNo,
      gateway_order_no: gw.data?.orderNo || null,
      user_id: input.userId || null,
      order_amount: input.orderAmount,
      status: ORDER_STATUS.PENDING,
      pay_url: gw.data?.payUrl || null,
      upi: gw.data?.upi || null,
      deeplink: gw.data?.deeplink || null,
      notify_url: input.notifyUrl || config.aeropay.notifyUrl,
      return_url: input.returnUrl || config.aeropay.returnUrl,
      extra: input.extra || null,
      raw_request: input,
      raw_response: gw,
      request_id: meta.requestId || null,
    }).catch(() => {});

    return gw.data;
  }

  async queryOrder(merchantOrderNo, meta = {}) {
    const result = await aeropayApiService.queryOrder(
      { type: ORDER_TYPE.PAYIN, merchantOrderNo },
      meta
    );
    return result.data;
  }

  async queryUpiStatus(upi, meta = {}) {
    const result = await aeropayApiService.queryUpiStatus(upi, meta);
    return result.data;
  }

  async queryUtrStatus(utr, meta = {}) {
    const result = await aeropayApiService.queryUtrStatus(utr, meta);
    return result.data;
  }

  async supplementOrder({ merchantOrderNo, utr }, meta = {}) {
    const result = await aeropayApiService.supplementOrder({ merchantOrderNo, utr }, meta);
    return result.data;
  }

  async submitUtr({ orderNo, utr }, meta = {}) {
    const result = await aeropayApiService.submitUtr({ orderNo, utr }, meta);
    return result.data;
  }

  /**
   * Webhook receiver — ACK immediately with lowercase "success".
   * Processing (DB + platform credit) continues asynchronously.
   */
  acknowledgeWebhook() {
    return 'success';
  }

  async processPayinWebhook(payload, meta = {}) {
    const signatureValid = verifySignature(payload, config.aeropay.secret, {
      forceAmountDecimals: true,
    });

    await logRepository.createWebhook({
      request_id: meta.requestId,
      correlation_id: meta.correlationId,
      merchant_id: payload.mchId,
      order_no: payload.mchOrderNo || payload.orderNo,
      direction: 'inbound',
      method: 'POST',
      path: '/api/payment/webhook',
      status: 'RECEIVED',
      webhook_code: payload.code,
      signature_valid: signatureValid,
      request_payload: payload,
      raw_payload: payload,
      processed: false,
    }).catch(() => {});

    if (!signatureValid) {
      logger.error('PaymentWebhook', 'Invalid signature', { mchOrderNo: payload.mchOrderNo });
      throw new SignatureError('Webhook signature verification failed');
    }

    const mchOrderNo = payload.mchOrderNo;
    if (!mchOrderNo) {
      logger.warn('PaymentWebhook', 'Missing mchOrderNo');
      return { processed: false, reason: 'missing_order' };
    }

    // code=1 success, code=2 rejected (primarily payout; payin typically success only)
    if (Number(payload.code) === WEBHOOK_CODE.SUCCESS) {
      const affected = await rechargeRepository.markSuccessIfPending(mchOrderNo);
      if (affected === 0) {
        logger.warn('PaymentWebhook', 'Already processed or not found', { mchOrderNo });
        return { processed: false, reason: 'duplicate_or_missing' };
      }

      await paymentOrderRepository.updateByMerchantOrderNo(mchOrderNo, {
        status: ORDER_STATUS.SUCCESS,
        utr: payload.utr || null,
        gateway_order_no: payload.orderNo || undefined,
        paid_at: payload.paySuccessTime ? new Date(payload.paySuccessTime) : new Date(),
      }).catch(() => {});

      const recharge = await rechargeRepository.findByOrderId(mchOrderNo);
      if (recharge) {
        try {
          await platformService.processSuccessfulDeposit({
            userId: recharge.userId,
            amount: parseFloat(recharge.recharge_amount),
            orderId: mchOrderNo,
          });
        } catch (platformErr) {
          logger.logError(
            'PaymentWebhook',
            `CRITICAL: Platform credit failed for ${mchOrderNo} — manual intervention required`,
            platformErr
          );
        }
      }

      return { processed: true, status: 'success' };
    }

    if (Number(payload.code) === WEBHOOK_CODE.REJECTED) {
      await rechargeRepository.markFailed(mchOrderNo);
      await paymentOrderRepository.updateByMerchantOrderNo(mchOrderNo, {
        status: ORDER_STATUS.FAILED,
      }).catch(() => {});
      return { processed: true, status: 'rejected' };
    }

    return { processed: false, reason: 'unknown_code' };
  }
}

module.exports = {
  PaymentService,
  paymentService: new PaymentService(),
};
