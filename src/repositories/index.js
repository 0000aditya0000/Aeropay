const { Op } = require('sequelize');
const {
  User,
  Recharge,
  Withdrawl,
  PaymentOrder,
  PayoutOrder,
  WebhookLog,
  GatewayLog,
  RequestLog,
  ResponseLog,
  RetryLog,
} = require('../models');
const { PAYMENT_MODE } = require('../constants');
const { getDateParts } = require('../helpers/orderId');

class RechargeRepository {
  async createPending({
    orderId,
    userId,
    userMobile,
    amount,
    rechargeType = 'aeropay',
    gatewayTransactionId = null,
    timestamp = Date.now(),
  }) {
    const { date, time } = getDateParts();
    return Recharge.create({
      recharge_id: orderId,
      order_id: orderId,
      userId: userId || 0,
      user_mobile: userMobile || '',
      recharge_amount: amount,
      recharge_type: rechargeType,
      payment_mode: PAYMENT_MODE,
      date,
      time,
      silkpay_timestamp: timestamp,
      gateway_transaction_id: gatewayTransactionId,
      recharge_status: 'pending',
      isDepAdded: 0,
    });
  }

  async findByOrderId(orderId) {
    return Recharge.findOne({ where: { order_id: orderId } });
  }

  /**
   * Idempotent success mark — SkillPay pattern:
   * UPDATE ... SET success, isDepAdded=1 WHERE order_id=? AND isDepAdded=0
   */
  async markSuccessIfPending(orderId) {
    const [affected] = await Recharge.update(
      { recharge_status: 'success', isDepAdded: 1 },
      { where: { order_id: orderId, isDepAdded: 0 } }
    );
    return affected;
  }

  async markFailed(orderId) {
    return Recharge.update(
      { recharge_status: 'failed' },
      { where: { order_id: orderId, recharge_status: { [Op.ne]: 'success' } } }
    );
  }
}

class WithdrawlRepository {
  async setMerchantOrderId(withdrawId, morderId) {
    const [affected] = await Withdrawl.update(
      { morder_id: morderId },
      { where: { id: withdrawId } }
    );
    return affected;
  }

  async updateStatusByMorderId(morderId, status) {
    const [affected] = await Withdrawl.update(
      { status },
      { where: { morder_id: morderId } }
    );
    return affected;
  }

  async findByMorderId(morderId) {
    return Withdrawl.findOne({ where: { morder_id: morderId } });
  }
}

class UserRepository {
  async getStatus(userId) {
    const user = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'status'],
    });
    return user;
  }
}

class PaymentOrderRepository {
  async create(data) {
    return PaymentOrder.create(data);
  }

  async findByMerchantOrderNo(merchantOrderNo) {
    return PaymentOrder.findOne({ where: { merchant_order_no: merchantOrderNo } });
  }

  async updateByMerchantOrderNo(merchantOrderNo, values) {
    return PaymentOrder.update(values, { where: { merchant_order_no: merchantOrderNo } });
  }
}

class PayoutOrderRepository {
  async create(data) {
    return PayoutOrder.create(data);
  }

  async findByMerchantOrderNo(merchantOrderNo) {
    return PayoutOrder.findOne({ where: { merchant_order_no: merchantOrderNo } });
  }

  async updateByMerchantOrderNo(merchantOrderNo, values) {
    return PayoutOrder.update(values, { where: { merchant_order_no: merchantOrderNo } });
  }
}

class LogRepository {
  async createWebhook(data) {
    return WebhookLog.create(data);
  }

  async createGateway(data) {
    return GatewayLog.create(data);
  }

  async createRequest(data) {
    return RequestLog.create(data);
  }

  async createResponse(data) {
    return ResponseLog.create(data);
  }

  async createRetry(data) {
    return RetryLog.create(data);
  }
}

module.exports = {
  rechargeRepository: new RechargeRepository(),
  withdrawlRepository: new WithdrawlRepository(),
  userRepository: new UserRepository(),
  paymentOrderRepository: new PaymentOrderRepository(),
  payoutOrderRepository: new PayoutOrderRepository(),
  logRepository: new LogRepository(),
};
