/**
 * OpenAPI / Swagger specification for AeroPay gateway module
 */

const { AEROPAY_PATHS } = require('../constants');

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'AeroPay Gateway API',
    version: '1.0.0',
    description:
      'Production AeroPay (AroPay) payment gateway module. Upstream base: https://api.aropay-api.com',
  },
  servers: [{ url: '/' }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['Health'],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/ping': {
      get: {
        summary: 'Ping',
        tags: ['Health'],
        responses: { 200: { description: 'pong' } },
      },
    },
    '/api/payments/user/order': {
      post: {
        summary: 'Create payin order (app)',
        tags: ['PayIn'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'userId'],
                properties: {
                  amount: { type: 'number', example: 100 },
                  userId: { type: 'integer', example: 12 },
                  user_mobile: { type: 'string', example: '9876543210' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Payment URL',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    paymentUrl: { type: 'string' },
                    orderNo: { type: 'string' },
                    merchantOrderNo: { type: 'string' },
                    upi: { type: 'string' },
                    deeplink: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/payout/create': {
      post: {
        summary: 'Create payout order',
        tags: ['PayOut'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['withdrawId', 'amount', 'bankNo', 'ifsc', 'name'],
                properties: {
                  withdrawId: { type: 'integer' },
                  amount: { type: 'number' },
                  bankNo: { type: 'string' },
                  ifsc: { type: 'string' },
                  name: { type: 'string' },
                  upi: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Payout created' } },
      },
    },
    '/api/payment/webhook': {
      post: {
        summary: 'AeroPay payin webhook (returns plain text success)',
        tags: ['Webhook'],
        responses: { 200: { description: 'success' } },
      },
    },
    '/api/payout/webhook': {
      post: {
        summary: 'AeroPay payout webhook (returns plain text success)',
        tags: ['Webhook'],
        responses: { 200: { description: 'success' } },
      },
    },
  },
  'x-aeropay-upstream': AEROPAY_PATHS,
};

module.exports = swaggerSpec;
