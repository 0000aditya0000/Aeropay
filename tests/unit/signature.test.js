const {
  generateSignature,
  verifySignature,
  buildSignPayload,
  formatAmountTwoDecimals,
  isEmptyValue,
} = require('../../src/helpers/signature');

describe('AeroPay signature', () => {
  const secret = 'test_secret';

  test('ignores empty fields and sign, sorts keys, appends secret', () => {
    const params = {
      merchantId: 6,
      type: 0,
      merchantOrderNo: 'ORD1',
      orderAmount: 100,
      notifyUrl: 'https://x.com/cb',
      returnUrl: '',
      extra: null,
      sign: 'should-be-ignored',
    };

    const payload = buildSignPayload(params, secret);
    expect(payload).toBe(
      'merchantId=6&merchantOrderNo=ORD1&notifyUrl=https://x.com/cb&orderAmount=100&type=0&secret=test_secret'
    );
    expect(payload.includes('sign=')).toBe(false);
    expect(payload.includes('returnUrl')).toBe(false);
    expect(payload.includes('extra')).toBe(false);
  });

  test('keeps numeric zero (type=0 / code=0)', () => {
    expect(isEmptyValue(0)).toBe(false);
    const payload = buildSignPayload({ type: 0, code: 0, merchantId: 1 }, secret);
    expect(payload).toContain('type=0');
    expect(payload).toContain('code=0');
  });

  test('generateSignature is lowercase md5', () => {
    const sign = generateSignature({ merchantId: 6, merchantOrderNo: 'A' }, secret);
    expect(sign).toMatch(/^[a-f0-9]{32}$/);
  });

  test('verifySignature round-trip', () => {
    const body = { merchantId: 6, merchantOrderNo: 'A', orderAmount: 10 };
    const sign = generateSignature(body, secret);
    expect(verifySignature({ ...body, sign }, secret)).toBe(true);
    expect(verifySignature({ ...body, sign: 'deadbeef' }, secret)).toBe(false);
  });

  test('webhook orderAmount forced to 2 decimals', () => {
    const body = {
      code: 1,
      mchId: 6,
      mchOrderNo: 'ABCDEFG01234',
      orderAmount: 100,
      orderNo: 'TOabcdefgh',
      message: 'success',
      extra: 'uid=1',
    };
    const payload = buildSignPayload(body, secret, { forceAmountDecimals: true });
    expect(payload).toContain('orderAmount=100.00');
    expect(formatAmountTwoDecimals(88.8)).toBe('88.80');
  });
});
