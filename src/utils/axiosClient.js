/**
 * Reusable Axios client for AeroPay upstream API
 * - Base URL from config
 * - Timeout 30s
 * - Retry 3x only for network/timeout errors
 * - Never retry validation / merchant / signature business errors
 */

const axios = require('axios');
const axiosRetry = require('axios-retry').default || require('axios-retry');
const config = require('../config');
const logger = require('../utils/logger');
const { RETRYABLE_CODES } = require('../constants');

const isRetryableError = (error) => {
  if (!error) return false;

  // Never retry when AeroPay returned a business/validation response
  if (error.response) {
    const data = error.response.data;
    const msg = String(data?.message || '').toLowerCase();
    if (
      msg.includes('签名') ||
      msg.includes('sign') ||
      msg.includes('校验') ||
      msg.includes('valid') ||
      msg.includes('商户') ||
      msg.includes('merchant') ||
      msg.includes('余额') ||
      msg.includes('权限')
    ) {
      return false;
    }
    // HTTP 4xx generally not retried; 5xx / network only
    if (error.response.status >= 400 && error.response.status < 500) {
      return false;
    }
  }

  if (axiosRetry.isNetworkError(error)) return true;
  if (axiosRetry.isRetryableError(error)) return true;
  if (error.code && RETRYABLE_CODES.includes(error.code)) return true;
  if (error.message && /timeout|network error/i.test(error.message)) return true;
  return false;
};

const createAeropayClient = () => {
  const client = axios.create({
    baseURL: config.aeropay.baseURL,
    timeout: config.aeropay.timeoutMs,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  axiosRetry(client, {
    retries: config.aeropay.retryCount,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: isRetryableError,
    shouldResetTimeout: true,
    onRetry: (retryCount, error, requestConfig) => {
      logger.warn('AxiosClient', `Retry #${retryCount}`, {
        url: requestConfig?.url,
        code: error?.code,
        message: error?.message,
      });
    },
  });

  client.interceptors.request.use((req) => {
    req.metadata = { start: Date.now() };
    logger.gatewayLogger.info('Outgoing AeroPay request', {
      method: req.method,
      url: `${req.baseURL || ''}${req.url || ''}`,
      headers: req.headers,
      payload: req.data,
    });
    return req;
  });

  client.interceptors.response.use(
    (res) => {
      const ms = Date.now() - (res.config.metadata?.start || Date.now());
      logger.gatewayLogger.info('AeroPay response', {
        url: `${res.config.baseURL || ''}${res.config.url || ''}`,
        statusCode: res.status,
        executionMs: ms,
        data: res.data,
      });
      logger.responseLogger.info('AeroPay response body', {
        statusCode: res.status,
        executionMs: ms,
        data: res.data,
      });
      res.executionMs = ms;
      res.retryCount = res.config['axios-retry']?.retryCount || 0;
      return res;
    },
    (err) => {
      const cfg = err.config || {};
      const ms = Date.now() - (cfg.metadata?.start || Date.now());
      logger.gatewayLogger.error('AeroPay request failed', {
        url: `${cfg.baseURL || ''}${cfg.url || ''}`,
        statusCode: err.response?.status,
        executionMs: ms,
        code: err.code,
        message: err.message,
        data: err.response?.data,
      });
      err.executionMs = ms;
      err.retryCount = cfg['axios-retry']?.retryCount || 0;
      return Promise.reject(err);
    }
  );

  return client;
};

const aeropayClient = createAeropayClient();

module.exports = {
  aeropayClient,
  createAeropayClient,
  isRetryableError,
};
