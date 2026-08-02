/**
 * Lightweight service contract tests (mocked API)
 */

jest.mock('../../src/services/aeropayApi.service', () => ({
  aeropayApiService: {
    createPayinOrder: jest.fn(),
    createPayoutOrder: jest.fn(),
    queryOrder: jest.fn(),
    getMerchantBalance: jest.fn(),
  },
}));

jest.mock('../../src/repositories', () => ({
  rechargeRepository: {
    createPending: jest.fn(),
    markSuccessIfPending: jest.fn(),
    findByOrderId: jest.fn(),
    markFailed: jest.fn(),
  },
  paymentOrderRepository: {
    create: jest.fn().mockResolvedValue({}),
    updateByMerchantOrderNo: jest.fn().mockResolvedValue([1]),
  },
  payoutOrderRepository: {
    create: jest.fn().mockResolvedValue({}),
    updateByMerchantOrderNo: jest.fn().mockResolvedValue([1]),
  },
  withdrawlRepository: {
    setMerchantOrderId: jest.fn().mockResolvedValue(1),
    updateStatusByMorderId: jest.fn().mockResolvedValue(1),
  },
  userRepository: {
    getStatus: jest.fn(),
  },
  logRepository: {
    createWebhook: jest.fn().mockResolvedValue({}),
    createGateway: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../src/services/platform.service', () => ({
  platformService: {
    processSuccessfulDeposit: jest.fn().mockResolvedValue({}),
  },
}));

const { aeropayApiService } = require('../../src/services/aeropayApi.service');
const { userRepository, rechargeRepository } = require('../../src/repositories');
const { paymentService } = require('../../src/services/payment.service');
const { payoutService } = require('../../src/services/payout.service');
const { generateSignature } = require('../../src/helpers/signature');
const config = require('../../src/config');

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    config.aeropay.secret = 'svc_secret';
  });

  test('createUserOrder inserts recharge and returns paymentUrl', async () => {
    userRepository.getStatus.mockResolvedValue({ id: 12, status: 1 });
    aeropayApiService.createPayinOrder.mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: {
          orderNo: 'DS0eashozw9d',
          orderAmount: 100,
          payUrl: 'https://pay.example/x',
          upi: 'a@upi',
          deeplink: 'pa=a@upi',
        },
      },
    });

    const result = await paymentService.createUserOrder({ amount: 100, userId: 12, user_mobile: '999' });
    expect(result.paymentUrl).toBe('https://pay.example/x');
    expect(rechargeRepository.createPending).toHaveBeenCalled();
  });
});

describe('PayoutService', () => {
  test('createPayout updates withdrawl morder_id', async () => {
    aeropayApiService.createPayoutOrder.mockResolvedValue({
      data: { code: 200, message: 'success', data: { orderNo: 'SP0easho0mmo', orderAmount: 100 } },
    });

    const { withdrawlRepository } = require('../../src/repositories');
    const result = await payoutService.createPayout({
      withdrawId: 55,
      amount: 100,
      bankNo: '948101025',
      ifsc: 'IDIB000K730',
      name: 'G ARASU',
      phone: '9265772384',
      email: 'a@b.com',
    });

    expect(result.orderNo).toBe('SP0easho0mmo');
    expect(withdrawlRepository.setMerchantOrderId).toHaveBeenCalledWith(55, result.mOrderId);
  });
});

describe('Webhook process', () => {
  test('processPayinWebhook credits on code=1', async () => {
    const payload = {
      code: 1,
      mchId: 6,
      mchOrderNo: 'AERO_TEST',
      orderAmount: 50,
      orderNo: 'G1',
      message: 'success',
      extra: 'uid=12',
    };
    payload.sign = generateSignature(payload, config.aeropay.secret, { forceAmountDecimals: true });
    rechargeRepository.markSuccessIfPending.mockResolvedValue(1);
    rechargeRepository.findByOrderId.mockResolvedValue({ userId: 12, recharge_amount: 50 });

    const out = await paymentService.processPayinWebhook(payload);
    expect(out.processed).toBe(true);
  });
});
