const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../docs/swagger');
const paymentRoutes = require('./payment.routes');
const payoutRoutes = require('./payout.routes');
const healthRoutes = require('./health.routes');
const paymentController = require('../controllers/payment.controller');
const payoutController = require('../controllers/payout.controller');
const { GATEWAY_NAME, AEROPAY_PATHS } = require('../constants');

const router = express.Router();

router.use(healthRoutes);

router.use('/api/payments', paymentRoutes);
router.use('/api/payout', payoutRoutes);

// Exact webhook URLs used in NOTIFY_URL / PAYOUT_NOTIFY_URL (SkillPay pattern)
router.post('/api/payment/webhook', paymentController.payinWebhook);
router.post('/api/payout/webhook', payoutController.payoutWebhook);

router.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: `${GATEWAY_NAME} Payment Gateway`,
    version: '1.0.0',
    endpoints: {
      payinUserOrder: 'POST /api/payments/user/order',
      payinCreate: 'POST /api/payments/create',
      payinStatus: 'POST /api/payments/status',
      upiStatus: 'POST /api/payments/upi/status',
      utrStatus: 'POST /api/payments/utr/status',
      supplement: 'POST /api/payments/supplement',
      submitUtr: 'POST /api/payments/submit-utr',
      payinWebhook: 'POST /api/payment/webhook',
      payoutCreate: 'POST /api/payout/create',
      payoutStatus: 'POST /api/payout/status',
      balance: 'GET|POST /api/payout/balance',
      payoutWebhook: 'POST /api/payout/webhook',
      health: 'GET /health',
      ping: 'GET /ping',
      docs: 'GET /api/docs',
    },
    aeropayUpstream: AEROPAY_PATHS,
  });
});

module.exports = router;
