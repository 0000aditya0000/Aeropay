const { isRetryableError } = require('../../src/utils/axiosClient');

describe('Axios retry logic', () => {
  test('retries network errors', () => {
    expect(isRetryableError({ code: 'ECONNRESET', message: 'reset' })).toBe(true);
    expect(isRetryableError({ code: 'ECONNREFUSED', message: 'refused' })).toBe(true);
    expect(isRetryableError({ message: 'timeout of 30000ms exceeded', code: 'ECONNABORTED' })).toBe(true);
  });

  test('never retries signature / merchant validation responses', () => {
    expect(
      isRetryableError({
        response: { status: 500, data: { code: 500, message: '签名错误' } },
      })
    ).toBe(false);

    expect(
      isRetryableError({
        response: { status: 400, data: { message: 'Validation error' } },
      })
    ).toBe(false);
  });
});
