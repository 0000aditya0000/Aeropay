/**
 * Platform (Rollix777) integration — deposit + wallet bonus (SkillPay/EinPay pattern)
 */

const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class PlatformService {
  constructor() {
    this.client = axios.create({
      baseURL: config.platform.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async processSuccessfulDeposit({ userId, amount, orderId }) {
    logger.info('Platform', 'processSuccessfulDeposit', { userId, amount, orderId });

    const depositRes = await this.client.post('/api/user/deposit', {
      userId,
      amount,
      cryptoname: 'INR',
      orderid: orderId,
    });
    logger.info('Platform', 'deposit API ok', depositRes.data);

    const bonusAmount = Number(amount) * config.platform.walletBonusMultiplier;
    const walletRes = await this.client.put('/api/user/wallet/balance', {
      userId,
      cryptoname: 'INR',
      balance: bonusAmount,
    });
    logger.info('Platform', 'wallet bonus applied', {
      original: amount,
      bonus: bonusAmount,
      response: walletRes.data,
    });

    return {
      deposit: depositRes.data,
      wallet: walletRes.data,
      bonusAmount,
    };
  }

  /**
   * Refund withdrawn amount to user wallet on payout reject/fail.
   * Uses the same add-funds platform API as payin success: PUT /api/user/wallet/balance
   * (exact amount — no deposit bonus).
   */
  async refundFailedPayout({ userId, amount, cryptoname = 'INR', withdrawId, morderId }) {
    const refundAmount = Number(amount);
    logger.info('Platform', 'refundFailedPayout start', {
      userId,
      amount: refundAmount,
      cryptoname,
      withdrawId,
      morderId,
    });

    const walletRes = await this.client.put('/api/user/wallet/balance', {
      userId,
      cryptoname: cryptoname || 'INR',
      balance: refundAmount,
    });

    logger.info('Platform', 'refundFailedPayout success', {
      userId,
      amount: refundAmount,
      withdrawId,
      morderId,
      response: walletRes.data,
    });

    return { success: true, data: walletRes.data, amount: refundAmount };
  }
}

module.exports = {
  PlatformService,
  platformService: new PlatformService(),
};
