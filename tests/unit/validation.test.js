const {
  createUserOrderSchema,
  payoutCreateSchema,
  upiStatusSchema,
  submitUtrSchema,
} = require('../../src/validators/aeropay.validator');

describe('Joi validation', () => {
  test('accepts valid user order', () => {
    const { error } = createUserOrderSchema.validate({ amount: 100, userId: 12 });
    expect(error).toBeUndefined();
  });

  test('rejects invalid amount', () => {
    const { error } = createUserOrderSchema.validate({ amount: -1, userId: 12 });
    expect(error).toBeTruthy();
  });

  test('validates IFSC and payout fields', () => {
    const { error } = payoutCreateSchema.validate({
      withdrawId: 1,
      amount: 50,
      bankNo: '1234567890',
      ifsc: 'IDIB000K730',
      name: 'Test User',
      phone: '9265772384',
      email: 'a@b.com',
    });
    expect(error).toBeUndefined();
  });

  test('rejects bad UPI', () => {
    const { error } = upiStatusSchema.validate({ upi: 'not-an-upi' });
    expect(error).toBeTruthy();
  });

  test('submit UTR requires orderNo + utr', () => {
    const { error } = submitUtrSchema.validate({ orderNo: 'SCbeicica73x', utr: '209078122848' });
    expect(error).toBeUndefined();
  });
});
