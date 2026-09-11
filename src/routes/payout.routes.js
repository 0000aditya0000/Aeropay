const express = require('express');
const payoutController = require('../controllers/payout.controller');
const { validate } = require('../middlewares/validation');
const { payoutCreateSchema, queryOrderSchema } = require('../validators/aeropay.validator');
const { requirePayoutSecret } = require('../middlewares/requirePayoutSecret');

const router = express.Router();

router.post('/create', requirePayoutSecret, validate(payoutCreateSchema), payoutController.createPayout);
router.post('/status', validate(queryOrderSchema), payoutController.queryPayout);
router.get('/balance', payoutController.merchantBalance);
router.post('/balance', payoutController.merchantBalance);
router.post('/webhook', payoutController.payoutWebhook);

module.exports = router;
