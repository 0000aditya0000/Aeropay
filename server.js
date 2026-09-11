require('dotenv').config();

const config = require('./src/config');
const { createApp, GATEWAY_NAME } = require('./src/app');
const { connectDatabase } = require('./src/config/database');
const { syncGatewayTables } = require('./src/models');
const { registerProcessHandlers } = require('./src/middlewares/errorHandler');
const logger = require('./src/utils/logger');

registerProcessHandlers();

const start = async () => {
  try {
    await connectDatabase();

    if (config.db.syncLogTables) {
      await syncGatewayTables();
      logger.info('Database', 'Gateway tables synced (aeropay_*)');
    }

    const app = createApp();
    app.listen(config.port, () => {
      logger.info('Server', `${GATEWAY_NAME} listening on :${config.port}`);
      logger.info('Server', `Health http://localhost:${config.port}/health`);
    });
  } catch (err) {
    logger.logError('Server', 'Failed to start', err);
    process.exit(1);
  }
};

start();
