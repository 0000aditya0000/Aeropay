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
}

module.exports = {
  PlatformService,
  platformService: new PlatformService(),
};
