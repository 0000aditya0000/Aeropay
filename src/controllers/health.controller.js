const { sequelize } = require('../config/database');
const { GATEWAY_NAME } = require('../constants');

const health = async (req, res) => {
  let db = 'unknown';
  try {
    await sequelize.authenticate();
    db = 'up';
  } catch {
    db = 'down';
  }

  res.json({
    success: true,
    message: 'OK',
    data: {
      service: GATEWAY_NAME,
      status: 'healthy',
      database: db,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
};

const ping = (req, res) => {
  res.json({
    success: true,
    message: 'pong',
    data: { timestamp: new Date().toISOString() },
  });
};

module.exports = { health, ping };
