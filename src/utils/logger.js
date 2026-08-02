const path = require('path');
const fs = require('fs');
const winston = require('winston');

const LOG_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const { combine, timestamp, printf, errors, colorize } = winston.format;

const lineFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const extra = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  const body = stack || message;
  return `[${ts}] [${level.toUpperCase()}] ${body}${extra}`;
});

const fileTransport = (filename, level = 'info') =>
  new winston.transports.File({
    filename: path.join(LOG_DIR, filename),
    level,
    maxsize: 20 * 1024 * 1024,
    maxFiles: 14,
    tailable: true,
  });

const baseFormat = combine(
  errors({ stack: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  lineFormat
);

const consoleLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(colorize({ all: true }), baseFormat),
  transports: [new winston.transports.Console()],
});

const createNamedLogger = (filename, level = 'info') =>
  winston.createLogger({
    level,
    format: baseFormat,
    transports: [fileTransport(filename, level), new winston.transports.Console({
      format: combine(colorize({ all: true }), baseFormat),
    })],
    exceptionHandlers: [fileTransport('exceptions.log', 'error')],
    rejectionHandlers: [fileTransport('exceptions.log', 'error')],
  });

const combinedLogger = createNamedLogger('combined.log');
const errorLogger = winston.createLogger({
  level: 'error',
  format: baseFormat,
  transports: [fileTransport('errors.log', 'error'), new winston.transports.Console()],
});
const gatewayLogger = createNamedLogger('gateway.log');
const webhookLogger = createNamedLogger('webhooks.log');
const requestLogger = createNamedLogger('requests.log');
const responseLogger = createNamedLogger('responses.log');
const exceptionLogger = winston.createLogger({
  level: 'error',
  format: baseFormat,
  transports: [fileTransport('exceptions.log', 'error')],
});

const info = (tag, message, meta) => combinedLogger.info(`[${tag}] ${message}`, meta || {});
const warn = (tag, message, meta) => combinedLogger.warn(`[${tag}] ${message}`, meta || {});
const error = (tag, message, meta) => {
  combinedLogger.error(`[${tag}] ${message}`, meta || {});
  errorLogger.error(`[${tag}] ${message}`, meta || {});
};
const debug = (tag, message, meta) => combinedLogger.debug(`[${tag}] ${message}`, meta || {});

const logError = (tag, message, err) => {
  error(tag, message, {
    error: err?.message,
    stack: err?.stack,
    code: err?.code,
    response: err?.response?.data,
  });
};

const printTerminalBlock = ({
  method,
  path: reqPath,
  gateway = 'AeroPay',
  merchant,
  order,
  ip,
  executionMs,
  status,
  request,
  response,
}) => {
  const line = '='.repeat(56);
  const block = [
    line,
    `${method} ${reqPath}`,
    `Gateway : ${gateway}`,
    `Merchant : ${merchant ?? '-'}`,
    `Order : ${order ?? '-'}`,
    `IP : ${ip ?? '-'}`,
    `Execution : ${executionMs ?? 0}ms`,
    `Status : ${status ?? '-'}`,
    '',
    'Request',
    JSON.stringify(request ?? {}, null, 2),
    '',
    'Response',
    JSON.stringify(response ?? {}, null, 2),
    line,
  ].join('\n');
  console.log(block);
  requestLogger.info(block);
};

module.exports = {
  consoleLogger,
  combinedLogger,
  errorLogger,
  gatewayLogger,
  webhookLogger,
  requestLogger,
  responseLogger,
  exceptionLogger,
  info,
  warn,
  error,
  debug,
  logError,
  printTerminalBlock,
  LOG_DIR,
};
