const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { validate } = require('../middlewares/validation');
const { validateUserStatus } = require('../middlewares/userStatusValidator');
const { payinRateLimiter } = require('../middlewares/rateLimiter');
const {
  createUserOrderSchema,
  payinCreateSchema,
  queryOrderSchema,
  upiStatusSchema,
  utrStatusSchema,
  supplementSchema,
  submitUtrSchema,
} = require('../validators/aeropay.validator');

const router = express.Router();

/** App payin (SkillPay-compatible) */
router.post(
  '/user/order',
  payinRateLimiter,
  validate(createUserOrderSchema),
  validateUserStatus,
  paymentController.createUserOrder
);

router.post('/create', validate(payinCreateSchema), paymentController.createPayin);
router.post('/status', validate(queryOrderSchema), paymentController.queryOrder);
router.post('/query', validate(queryOrderSchema), paymentController.queryOrder);
router.post('/upi/status', validate(upiStatusSchema), paymentController.queryUpiStatus);
router.post('/utr/status', validate(utrStatusSchema), paymentController.queryUtrStatus);
router.post('/supplement', validate(supplementSchema), paymentController.supplementOrder);
router.post('/submit-utr', validate(submitUtrSchema), paymentController.submitUtr);
router.post('/webhook', paymentController.payinWebhook);

module.exports = router;
