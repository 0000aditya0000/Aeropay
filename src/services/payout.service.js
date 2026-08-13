/**
 * Payout business service
 */

const config = require('../config');
const { aeropayApiService } = require('./aeropayApi.service');
const {
  withdrawlRepository,
  payoutOrderRepository,
  logRepository,
} = require('../repositories');
const { generatePayoutOrderId } = require('../helpers/orderId');
const { ORDER_STATUS, WEBHOOK_CODE, WITHDRAW_STATUS, ORDER_TYPE } = require('../constants');
const { verifySignature } = require('../helpers/signature');
const { ValidationError, GatewayError, SignatureError } = require('../utils/errors');
const logger = require('../utils/logger');

class PayoutService {
  /**
   * App-facing payout create (SkillPay-compatible body)
   * Body: withdrawId, amount, bankNo, ifsc, name, upi?, phone?, email?
   */
  async createPayout(input, meta = {}) {
    const withdrawId = input.withdrawId || input.withdrawalId;
    const {
      amount,
      bankNo,
      cardNumber,
      ifsc,
      name,
      accountName,
      bankName,
      upi,
      phone,
      email,
      notifyUrl,
      mOrderId,
    } = input;

    if (!withdrawId || !amount || !(bankNo || cardNumber) || !ifsc || !(name || accountName)) {
      throw new ValidationError(
        'Missing required fields: withdrawId, amount, bankNo/cardNumber, ifsc, name/accountName'
      );
    }

    const merchantOrderNo = mOrderId || generatePayoutOrderId();
    const orderAmount = Number(amount);

    const gatewayResult = await aeropayApiService.createPayoutOrder(
      {
        merchantOrderNo,
        orderAmount,
        accountName: accountName || name,
        cardNumber: cardNumber || bankNo,
        ifsc,
        bankName: bankName || 'BankName',
        upi: upi || undefined,
        phone: phone || '9999999999',
        email: email || 'noreply@aeropay.local',
        notifyUrl: notifyUrl || config.aeropay.payoutNotifyUrl,
        extra: `withdrawId=${withdrawId}`,
      },
      meta
    );

    const gw = gatewayResult.data;
    if (!gw || Number(gw.code) !== 200) {
      throw new GatewayError(gw?.message || 'AeroPay payout create failed', gw);
    }

    const gatewayOrderNo = gw.data?.orderNo || null;

    try {
      const affected = await withdrawlRepository.setMerchantOrderId(withdrawId, merchantOrderNo);
      if (affected === 0) {
        logger.warn('PayoutService', 'withdrawl UPDATE matched 0 rows', { withdrawId, merchantOrderNo });
      }
    } catch (dbErr) {
      logger.logError(
        'PayoutService',
        `CRITICAL: Payout created at AeroPay but DB update failed | withdrawId=${withdrawId} | mOrderId=${merchantOrderNo}`,
        dbErr
      );
    }

    await payoutOrderRepository.create({
      merchant_id: config.aeropay.merchantId,
      merchant_order_no: merchantOrderNo,
      gateway_order_no: gatewayOrderNo,
      withdraw_id: withdrawId,
      order_amount: orderAmount,
      account_name: accountName || name,
      card_number: cardNumber || bankNo,
      ifsc,
      bank_name: bankName || 'BankName',
      upi: upi || null,
      phone: phone || null,
      email: email || null,
      status: ORDER_STATUS.PENDING,
      notify_url: notifyUrl || config.aeropay.payoutNotifyUrl,
      extra: `withdrawId=${withdrawId}`,
      raw_request: input,
      raw_response: gw,
      request_id: meta.requestId || null,
    }).catch(() => {});

    return {
      mOrderId: merchantOrderNo,
      orderNo: gatewayOrderNo,
      orderAmount: gw.data?.orderAmount ?? orderAmount,
      data: gw,
    };
  }

  async queryOrder(merchantOrderNo, meta = {}) {
    const result = await aeropayApiService.queryOrder(
      { type: ORDER_TYPE.PAYOUT, merchantOrderNo },
      meta
    );
    return result.data;
  }

  async getMerchantBalance(meta = {}) {
    const result = await aeropayApiService.getMerchantBalance(meta);
    return result.data;
  }

  async processPayoutWebhook(payload, meta = {}) {
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
      path: '/api/payout/webhook',
      status: 'RECEIVED',
      webhook_code: payload.code,
      signature_valid: signatureValid,
      request_payload: payload,
      raw_payload: payload,
      processed: false,
    }).catch(() => {});

    if (!signatureValid) {
      logger.error('PayoutWebhook', 'Invalid signature', { mchOrderNo: payload.mchOrderNo });
      throw new SignatureError('Webhook signature verification failed');
    }

    const mchOrderNo = payload.mchOrderNo;
    if (!mchOrderNo) {
      return { processed: false, reason: 'missing_order' };
    }

    if (Number(payload.code) === WEBHOOK_CODE.SUCCESS) {
      await withdrawlRepository.updateStatusByMorderId(mchOrderNo, WITHDRAW_STATUS.SUCCESS);
      await payoutOrderRepository.updateByMerchantOrderNo(mchOrderNo, {
        status: ORDER_STATUS.SUCCESS,
        utr: payload.utr || null,
        gateway_order_no: payload.orderNo || undefined,
        paid_at: payload.paySuccessTime ? new Date(payload.paySuccessTime) : new Date(),
      }).catch(() => {});
      logger.info('PayoutWebhook', 'Payout SUCCESS', { mchOrderNo, utr: payload.utr });
      return { processed: true, status: 'success' };
    }

    if (Number(payload.code) === WEBHOOK_CODE.REJECTED) {
      // No auto-refund — admin will credit wallet manually
      await withdrawlRepository.markFailedIfNotAlreadyFailed(mchOrderNo);
      await payoutOrderRepository.updateByMerchantOrderNo(mchOrderNo, {
        status: ORDER_STATUS.FAILED,
      }).catch(() => {});
      logger.warn('PayoutWebhook', 'Payout REJECTED — status updated (no auto-refund)', {
        mchOrderNo,
        message: payload.message,
      });
      return { processed: true, status: 'rejected', refunded: false };
    }

    return { processed: false, reason: 'unknown_code' };
  }
}

module.exports = {
  PayoutService,
  payoutService: new PayoutService(),
};
