/**
 * Sequelize models
 * - Platform tables (recharge / withdrawl / users): existing Rollix schema, do NOT sync
 * - Gateway tables (logs / payment_orders / ...): may sync on boot
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ---------------------------------------------------------------------------
// Platform shared tables (SkillPay / EinPay compatible)
// ---------------------------------------------------------------------------

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    status: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'users' }
);

const Recharge = sequelize.define(
  'Recharge',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    recharge_id: { type: DataTypes.STRING(100), allowNull: false },
    order_id: { type: DataTypes.STRING(100), allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    user_mobile: { type: DataTypes.STRING(30), allowNull: true },
    recharge_amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
    recharge_type: { type: DataTypes.STRING(50), allowNull: true },
    payment_mode: { type: DataTypes.STRING(50), allowNull: true },
    date: { type: DataTypes.STRING(20), allowNull: true },
    time: { type: DataTypes.STRING(20), allowNull: true },
    silkpay_timestamp: { type: DataTypes.BIGINT, allowNull: true },
    gateway_transaction_id: { type: DataTypes.STRING(100), allowNull: true },
    recharge_status: { type: DataTypes.STRING(30), allowNull: true },
    isDepAdded: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  },
  { tableName: 'recharge' }
);

const Withdrawl = sequelize.define(
  'Withdrawl',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    morder_id: { type: DataTypes.STRING(100), allowNull: true },
    status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  },
  { tableName: 'withdrawl' }
);

// ---------------------------------------------------------------------------
// Gateway-owned models
// ---------------------------------------------------------------------------

const Merchant = sequelize.define(
  'Merchant',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    merchant_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: true },
    secret: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
    meta: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: 'aeropay_merchants', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

const PaymentOrder = sequelize.define(
  'PaymentOrder',
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    merchant_id: { type: DataTypes.INTEGER, allowNull: false },
    merchant_order_no: { type: DataTypes.STRING(100), allowNull: false },
    gateway_order_no: { type: DataTypes.STRING(100), allowNull: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    order_amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
    status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    pay_url: { type: DataTypes.TEXT, allowNull: true },
    upi: { type: DataTypes.STRING(120), allowNull: true },
    deeplink: { type: DataTypes.TEXT, allowNull: true },
    notify_url: { type: DataTypes.STRING(500), allowNull: true },
    return_url: { type: DataTypes.STRING(500), allowNull: true },
    extra: { type: DataTypes.STRING(500), allowNull: true },
    utr: { type: DataTypes.STRING(64), allowNull: true },
    raw_request: { type: DataTypes.JSON, allowNull: true },
    raw_response: { type: DataTypes.JSON, allowNull: true },
    request_id: { type: DataTypes.STRING(64), allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    paid_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'aeropay_payment_orders', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

const PayoutOrder = sequelize.define(
  'PayoutOrder',
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    merchant_id: { type: DataTypes.INTEGER, allowNull: false },
    merchant_order_no: { type: DataTypes.STRING(100), allowNull: false },
    gateway_order_no: { type: DataTypes.STRING(100), allowNull: true },
    withdraw_id: { type: DataTypes.INTEGER, allowNull: true },
    order_amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
    account_name: { type: DataTypes.STRING(120), allowNull: true },
    card_number: { type: DataTypes.STRING(64), allowNull: true },
    ifsc: { type: DataTypes.STRING(20), allowNull: true },
    bank_name: { type: DataTypes.STRING(120), allowNull: true },
    upi: { type: DataTypes.STRING(120), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(120), allowNull: true },
    status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    notify_url: { type: DataTypes.STRING(500), allowNull: true },
    extra: { type: DataTypes.STRING(500), allowNull: true },
    utr: { type: DataTypes.STRING(64), allowNull: true },
    raw_request: { type: DataTypes.JSON, allowNull: true },
    raw_response: { type: DataTypes.JSON, allowNull: true },
    request_id: { type: DataTypes.STRING(64), allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    paid_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'aeropay_payout_orders', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

const logColumns = {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  request_id: { type: DataTypes.STRING(64), allowNull: true },
  correlation_id: { type: DataTypes.STRING(64), allowNull: true },
  merchant_id: { type: DataTypes.INTEGER, allowNull: true },
  order_no: { type: DataTypes.STRING(100), allowNull: true },
  direction: { type: DataTypes.STRING(20), allowNull: true },
  method: { type: DataTypes.STRING(10), allowNull: true },
  path: { type: DataTypes.STRING(255), allowNull: true },
  status: { type: DataTypes.STRING(40), allowNull: true },
  gateway_status: { type: DataTypes.STRING(40), allowNull: true },
  http_status: { type: DataTypes.INTEGER, allowNull: true },
  execution_ms: { type: DataTypes.INTEGER, allowNull: true },
  retry_count: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  headers: { type: DataTypes.JSON, allowNull: true },
  request_payload: { type: DataTypes.JSON, allowNull: true },
  response_payload: { type: DataTypes.JSON, allowNull: true },
  raw_payload: { type: DataTypes.JSON, allowNull: true },
  error_message: { type: DataTypes.TEXT, allowNull: true },
  stack_trace: { type: DataTypes.TEXT, allowNull: true },
  ip: { type: DataTypes.STRING(64), allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
};

const WebhookLog = sequelize.define('WebhookLog', {
  ...logColumns,
  webhook_code: { type: DataTypes.INTEGER, allowNull: true },
  signature_valid: { type: DataTypes.BOOLEAN, allowNull: true },
  processed: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'aeropay_webhook_logs', timestamps: true, createdAt: 'created_at', updatedAt: false });

const GatewayLog = sequelize.define('GatewayLog', logColumns, {
  tableName: 'aeropay_gateway_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

const RequestLog = sequelize.define('RequestLog', logColumns, {
  tableName: 'aeropay_request_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

const ResponseLog = sequelize.define('ResponseLog', logColumns, {
  tableName: 'aeropay_response_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

const RetryLog = sequelize.define(
  'RetryLog',
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    request_id: { type: DataTypes.STRING(64), allowNull: true },
    path: { type: DataTypes.STRING(255), allowNull: true },
    attempt: { type: DataTypes.INTEGER, allowNull: false },
    error_code: { type: DataTypes.STRING(50), allowNull: true },
    error_message: { type: DataTypes.TEXT, allowNull: true },
    payload: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: 'aeropay_retry_logs', timestamps: true, createdAt: 'created_at', updatedAt: false }
);

const Settlement = sequelize.define(
  'Settlement',
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    merchant_id: { type: DataTypes.INTEGER, allowNull: false },
    settlement_date: { type: DataTypes.DATEONLY, allowNull: true },
    amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
    fee: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pending' },
    reference: { type: DataTypes.STRING(100), allowNull: true },
    meta: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: 'aeropay_settlements', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

const Refund = sequelize.define(
  'Refund',
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    merchant_id: { type: DataTypes.INTEGER, allowNull: false },
    merchant_order_no: { type: DataTypes.STRING(100), allowNull: false },
    gateway_order_no: { type: DataTypes.STRING(100), allowNull: true },
    amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pending' },
    raw_response: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: 'aeropay_refunds', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
);

const GATEWAY_MODELS = [
  Merchant,
  PaymentOrder,
  PayoutOrder,
  WebhookLog,
  GatewayLog,
  RequestLog,
  ResponseLog,
  RetryLog,
  Settlement,
  Refund,
];

const syncGatewayTables = async () => {
  for (const model of GATEWAY_MODELS) {
    await model.sync({ alter: false });
  }
};

module.exports = {
  sequelize,
  User,
  Recharge,
  Withdrawl,
  Merchant,
  PaymentOrder,
  PayoutOrder,
  WebhookLog,
  GatewayLog,
  RequestLog,
  ResponseLog,
  RetryLog,
  Settlement,
  Refund,
  syncGatewayTables,
};
