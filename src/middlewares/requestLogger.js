const logger = require('../utils/logger');
const { logRepository } = require('../repositories');
const { GATEWAY_NAME } = require('../constants');

/** Browser hits on API host for cashier/static files — not payment traffic */
const isNoisePath = (path = '') =>
  /\.(js|css|map|ico|png|jpg|jpeg|gif|svg|woff2?|ttf|eot)(\?|$)/i.test(path) ||
  path.startsWith('/assets/') ||
  path.startsWith('/js/') ||
  path.startsWith('/css/') ||
  path.startsWith('/favicon');

const requestLoggerMiddleware = (req, res, next) => {
  const start = Date.now();
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
  const quiet = req.method === 'GET' && isNoisePath(req.originalUrl || req.path || '');

  if (quiet) {
    return next();
  }

  logger.requestLogger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    ip,
    body: req.body,
  });

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const executionMs = Date.now() - start;
    const statusLabel = body?.success === false ? 'FAILED' : 'SUCCESS';

    logger.printTerminalBlock({
      method: req.method,
      path: req.originalUrl,
      gateway: GATEWAY_NAME,
      merchant: req.body?.merchantId || req.body?.mchId || process.env.AEROPAY_MERCHANT_ID,
      order: req.body?.merchantOrderNo || req.body?.mchOrderNo || req.body?.mOrderId || req.body?.orderNo,
      ip,
      executionMs,
      status: statusLabel,
      request: req.body,
      response: body,
    });

    logRepository.createRequest({
      request_id: req.requestId,
      correlation_id: req.correlationId,
      merchant_id: req.body?.merchantId || req.body?.mchId || null,
      order_no: req.body?.merchantOrderNo || req.body?.mchOrderNo || null,
      direction: 'inbound',
      method: req.method,
      path: req.originalUrl,
      status: statusLabel,
      http_status: res.statusCode,
      execution_ms: executionMs,
      request_payload: req.body,
      response_payload: body,
      ip,
    }).catch(() => {});

    logRepository.createResponse({
      request_id: req.requestId,
      correlation_id: req.correlationId,
      method: req.method,
      path: req.originalUrl,
      status: statusLabel,
      http_status: res.statusCode,
      execution_ms: executionMs,
      response_payload: body,
    }).catch(() => {});

    return originalJson(body);
  };

  res.on('finish', () => {
    if (typeof res.getHeader('content-type') === 'string' &&
        res.getHeader('content-type').includes('text/plain')) {
      const executionMs = Date.now() - start;
      logger.webhookLogger.info('Webhook/text response finished', {
        path: req.originalUrl,
        statusCode: res.statusCode,
        executionMs,
      });
    }
  });

  next();
};

const responseTimeMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();
  // Must set header BEFORE response ends — setHeader on 'finish' throws and can crash the process (CF 502).
  const originalEnd = res.end.bind(res);
  res.end = (...args) => {
    try {
      if (!res.headersSent) {
        const diff = Number(process.hrtime.bigint() - start) / 1e6;
        res.setHeader('X-Response-Time', `${diff.toFixed(2)}ms`);
      }
    } catch (_) {
      // ignore
    }
    return originalEnd(...args);
  };
  next();
};

module.exports = {
  requestLoggerMiddleware,
  responseTimeMiddleware,
};
