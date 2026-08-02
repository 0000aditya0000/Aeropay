require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const config = require('./config');
const routes = require('./routes');
const { requestIdMiddleware } = require('./middlewares/requestId');
const { requestLoggerMiddleware, responseTimeMiddleware } = require('./middlewares/requestLogger');
const { globalRateLimiter } = require('./middlewares/rateLimiter');
const { authPlaceholder } = require('./middlewares/auth');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const { GATEWAY_NAME } = require('./constants');

const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: config.allowedOrigins.includes('*') ? true : config.allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Correlation-Id'],
    })
  );

  app.use(express.json({ limit: config.bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.bodyLimit }));

  app.use(requestIdMiddleware);
  app.use(responseTimeMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(globalRateLimiter);
  app.use(authPlaceholder);

  app.use(routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = { createApp, GATEWAY_NAME };
