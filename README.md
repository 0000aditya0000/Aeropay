# AeroPay Gateway

Production-ready **AeroPay / AroPay** payment gateway module for Node.js (Express + Sequelize + MySQL).

Upstream API base: `https://api.aropay-api.com`

Designed as a drop-in sibling to `GATEWAYSKILLPAY` — same platform tables (`recharge`, `withdrawl`, `users`) and Rollix777 deposit/wallet flow.

## Features

- Pay In / Pay Out
- Order query, merchant balance
- UPI status, UTR status, supplement order, submit UTR
- Webhook receiver (MD5 verify, async processing, ACK `success`)
- Joi validation, Winston logging, Axios retries
- Helmet, compression, CORS, rate limit

## Quick start

```bash
cp .env.example .env
# fill AEROPAY_MERCHANT_ID, AEROPAY_SECRET, DB_*, NOTIFY_URL
npm install
npm start
```

- Health: `GET /health`
- Docs: `GET /api/docs`
- App payin: `POST /api/payments/user/order`
- Payout: `POST /api/payout/create`

## Architecture

```
Controller → Service → Repository → MySQL / AeroPay Axios Client
```

Business DB writes follow SkillPay:

| Flow | Table | Action |
|------|-------|--------|
| Payin create | `recharge` | INSERT pending, `payment_mode='aeropay'`, `isDepAdded=0` |
| Payin webhook success | `recharge` | UPDATE success + `isDepAdded=1` where `isDepAdded=0` |
| Then | Platform | `POST /api/user/deposit` + `PUT /api/user/wallet/balance` (×1.10) |
| Payout create | `withdrawl` | UPDATE `morder_id` |
| Payout webhook | `withdrawl` | status `1` success / `2` failed |

Gateway-owned Sequelize tables (`aeropay_*`) store orders + request/response/webhook/retry logs.

## Documentation

- [Environment variables](docs/ENVIRONMENT.md)
- [API usage](docs/API_USAGE.md)
- [Webhook guide](docs/WEBHOOK.md)
- [Signature guide](docs/SIGNATURE.md)

## Tests

```bash
npm test
```

## Upstream endpoints (exact)

| API | Method | Path |
|-----|--------|------|
| Create order (payin type=0 / payout type=1) | POST | `/api/pay/create/order` |
| Query order | POST | `/api/pay/query/order` |
| Merchant balance | POST | `/api/pay/merchant/balance` |
| UPI status | POST | `/api/pay/query/upi/status` |
| UTR status | POST | `/api/pay/oneself/query/utr/status` |
| Supplement | POST | `/api/pay/supplement/order` |
| Submit UTR | POST | `/api/wallet/submit` |

Webhook ACK body must be lowercase plain text: `success`
