const { verifySignature, generateSignature } = require('../../src/helpers/signature');
const { WEBHOOK_CODE } = require('../../src/constants');

describe('Webhook verification', () => {
  const secret = 'whsec';

  test('verifies payin/payout callback with 2-decimal amount', () => {
    const payload = {
      code: WEBHOOK_CODE.SUCCESS,
      mchId: 6,
      mchOrderNo: 'ABCDEFG01234',
      orderAmount: 88.88,
      orderNo: 'TOabcdefgh',
      message: 'success',
      extra: 'uid=123456',
    };

    const sign = generateSignature(payload, secret, { forceAmountDecimals: true });
    expect(
      verifySignature({ ...payload, sign }, secret, { forceAmountDecimals: true })
    ).toBe(true);

    // Incoming JSON may coerce 100.00 → 100; forceAmountDecimals still works
    const coerced = { ...payload, orderAmount: 100, sign: undefined };
    const expected = generateSignature(coerced, secret, { forceAmountDecimals: true });
    expect(verifySignature({ ...coerced, orderAmount: 100, sign: expected }, secret, { forceAmountDecimals: true })).toBe(true);
  });

  test('rejects tampered payload', () => {
    const payload = {
      code: 1,
      mchId: 6,
      mchOrderNo: 'X',
      orderAmount: 10,
      orderNo: 'Y',
      message: 'success',
      extra: 'z',
      sign: '00000000000000000000000000000000',
    };
    expect(verifySignature(payload, secret, { forceAmountDecimals: true })).toBe(false);
  });
});
