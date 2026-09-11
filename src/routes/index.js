const express = require('express');
const paymentRoutes = require('./payment.routes');
const payoutRoutes = require('./payout.routes');
const healthRoutes = require('./health.routes');
const paymentController = require('../controllers/payment.controller');
const payoutController = require('../controllers/payout.controller');

const router = express.Router();

router.use(healthRoutes);

router.use('/api/payments', paymentRoutes);
router.use('/api/payout', payoutRoutes);

// Exact webhook URLs used in NOTIFY_URL / PAYOUT_NOTIFY_URL (SkillPay pattern)
router.post('/api/payment/webhook', paymentController.payinWebhook);
router.post('/api/payout/webhook', payoutController.payoutWebhook);

// Swagger disabled — reject common docs paths
const pageNotExisted = (req, res) => {
  res.status(404).type('text/plain').send('Page not existed');
};
router.all('/api/docs', pageNotExisted);
router.all('/api/docs/*', pageNotExisted);
router.all('/swagger', pageNotExisted);
router.all('/swagger/*', pageNotExisted);
router.all('/docs', pageNotExisted);
router.all('/docs/*', pageNotExisted);

router.get('/', (req, res) => {
  res.status(404).type('text/plain').send('Page not existed');
});

module.exports = router;
