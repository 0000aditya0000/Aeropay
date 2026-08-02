# Webhook Guide

AeroPay calls your `notifyUrl` with **POST JSON** when an order completes or is rejected.

## Endpoint

- Payin: `POST /api/payment/webhook` (also `/api/payments/webhook`)
- Payout: `POST /api/payout/webhook`

Configure:

```
NOTIFY_URL=https://your-host/api/payment/webhook
PAYOUT_NOTIFY_URL=https://your-host/api/payout/webhook
```

## Payload

```json
{
  "code": 1,
  "mchId": 6,
  "mchOrderNo": "ABCDEFG01234",
  "orderAmount": 88.88,
  "utr": "123456789123",
  "orderNo": "TOabcdefgh",
  "paySuccessTime": "1972-04-29 22:13:00",
  "message": "支付完成",
  "extra": "uid=123456",
  "sign": "..."
}
```

| Field | Notes |
|-------|-------|
| `code` | **1** success · **2** rejected (not the same as query `status`) |
| `orderAmount` | Signed with **2 decimal places** (`100.00`) |
| `utr` | Present on payout success; usually absent on payin |

## Response (critical)

Return plain text lowercase:

```
success
```

HTTP 200. If you do not return `success`, AeroPay keeps retrying.

This module ACKs immediately, then processes asynchronously.

## Processing

**Payin `code=1`:**

1. Verify MD5 signature
2. `UPDATE recharge SET recharge_status='success', isDepAdded=1 WHERE order_id=? AND isDepAdded=0`
3. If affected → platform deposit + wallet ×1.10

**Payout `code=1`:** `withdrawl.status = 1`  
**Payout `code=2`:** `withdrawl.status = 2`

Every webhook is stored in `aeropay_webhook_logs`.
