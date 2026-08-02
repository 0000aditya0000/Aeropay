const Joi = require('joi');

const amountSchema = Joi.number().positive().precision(2).required();

const createUserOrderSchema = Joi.object({
  amount: amountSchema,
  userId: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required(),
  user_mobile: Joi.string().allow('', null).optional(),
  recharge_type: Joi.string().optional(),
  payment_mode: Joi.string().optional(),
});

const payinCreateSchema = Joi.object({
  merchantOrderNo: Joi.string().max(64).optional(),
  orderAmount: amountSchema,
  notifyUrl: Joi.string().uri().optional(),
  returnUrl: Joi.string().uri().allow('', null).optional(),
  extra: Joi.string().max(500).allow('', null).optional(),
  userId: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional(),
});

const payoutCreateSchema = Joi.object({
  withdrawId: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional(),
  withdrawalId: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional(),
  amount: amountSchema.optional(),
  orderAmount: amountSchema.optional(),
  bankNo: Joi.string().min(5).max(40).optional(),
  cardNumber: Joi.string().min(5).max(40).optional(),
  ifsc: Joi.string().pattern(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/).required(),
  name: Joi.string().min(2).max(120).optional(),
  accountName: Joi.string().min(2).max(120).optional(),
  bankName: Joi.string().max(120).optional(),
  upi: Joi.string().pattern(/^[\w.\-]{2,}@[a-zA-Z]{2,}$/).allow('', null).optional(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
  email: Joi.string().email().optional(),
  notifyUrl: Joi.string().uri().optional(),
  mOrderId: Joi.string().max(64).optional(),
  merchantOrderNo: Joi.string().max(64).optional(),
  extra: Joi.string().max(500).allow('', null).optional(),
}).or('withdrawId', 'withdrawalId').or('amount', 'orderAmount').or('bankNo', 'cardNumber').or('name', 'accountName');

const queryOrderSchema = Joi.object({
  merchantOrderNo: Joi.string().required(),
  type: Joi.number().valid(0, 1).optional(),
  paymentId: Joi.string().optional(),
});

const upiStatusSchema = Joi.object({
  upi: Joi.string().pattern(/^[\w.\-]{2,}@[a-zA-Z]{2,}$/).required(),
});

const utrStatusSchema = Joi.object({
  utr: Joi.string().min(8).max(32).required(),
});

const supplementSchema = Joi.object({
  merchantOrderNo: Joi.string().required(),
  utr: Joi.string().min(8).max(32).required(),
});

const submitUtrSchema = Joi.object({
  orderNo: Joi.string().required(),
  utr: Joi.string().min(8).max(32).required(),
  paymentId: Joi.string().optional(),
  merchantOrderId: Joi.string().optional(),
  utrNumber: Joi.string().optional(),
});

module.exports = {
  createUserOrderSchema,
  payinCreateSchema,
  payoutCreateSchema,
  queryOrderSchema,
  upiStatusSchema,
  utrStatusSchema,
  supplementSchema,
  submitUtrSchema,
};
