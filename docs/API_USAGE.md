# API Usage Guide

Base: `http://localhost:3010`

## Create payin (app)

```http
POST /api/payments/user/order
Content-Type: application/json

{
  "amount": 100,
  "userId": 12,
  "user_mobile": "9876543210"
}
```

Response:

```json
{
  "paymentUrl": "https://...",
  "orderNo": "DS0eashozw9d",
  "merchantOrderNo": "AERO_20260802_153000_001",
  "upi": "8827772883@idbi",
  "deeplink": "pa=..."
}
```

DB: inserts `recharge` with `payment_mode='aeropay'`, `recharge_status='pending'`.

## Create payout

```http
POST /api/payout/create
Content-Type: application/json

{
  "withdrawId": 101,
  "amount": 100,
  "bankNo": "948101025",
  "ifsc": "IDIB000K730",
  "name": "G ARASU",
  "phone": "9265772384",
  "email": "user@example.com",
  "upi": "123123@airtel"
}
```

DB: `UPDATE withdrawl SET morder_id = ? WHERE id = ?`

## Query payin / payout

```http
POST /api/payments/status
{ "merchantOrderNo": "AERO_..." }

POST /api/payout/status
{ "merchantOrderNo": "AEROPAY_..." }
```

## Balance / UPI / UTR / Supplement / Submit UTR

```http
GET  /api/payout/balance
POST /api/payments/upi/status   { "upi": "7061080631@freecharge" }
POST /api/payments/utr/status   { "utr": "502223991233" }
POST /api/payments/supplement   { "merchantOrderNo": "...", "utr": "..." }
POST /api/payments/submit-utr   { "orderNo": "SCbeicica73x", "utr": "209078122848" }
```

## Standard response envelope

Success:

```json
{ "success": true, "message": "...", "data": {} }
```

Failure:

```json
{ "success": false, "message": "Validation Failed", "error": {} }
```
