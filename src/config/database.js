const { Sequelize } = require('sequelize');
const config = require('./index');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: config.db.logging ? (msg) => logger.debug('Sequelize', msg) : false,
    pool: {
      max: 15,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: false,
      freezeTableName: true,
      timestamps: false,
    },
    timezone: '+05:30',
  }
);

const connectDatabase = async () => {
  await sequelize.authenticate();
  logger.info('Database', `Connected to MySQL ${config.db.host}/${config.db.database}`);
};

module.exports = {
  sequelize,
  connectDatabase,
};
