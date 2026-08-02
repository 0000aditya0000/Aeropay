# Signature Guide

Algorithm: **MD5** (lowercase hex)

## Steps

1. Take all request parameters **except** `sign`
2. Drop empty / null / blank-string fields  
   **Do not drop numeric `0`** (`type=0`, `code=0`)
3. Sort keys alphabetically (A–Z)
4. Concatenate `key=value&key=value...`
5. Append `&secret=YOUR_SECRET`
6. `MD5(string).toLowerCase()`

## Example (payin)

Params:

```
type=0
merchantId=6
merchantOrderNo=fltzrdqine
orderAmount=500
notifyUrl=http://mdutrpx.as/uetkrw
returnUrl=http://orgynh.com/vltdaxbil
extra=uid=123456
```

Sign string (ordered):

```
extra=uid=123456&merchantId=6&merchantOrderNo=fltzrdqine&notifyUrl=http://mdutrpx.as/uetkrw&orderAmount=500&returnUrl=http://orgynh.com/vltdaxbil&type=0&secret=YOUR_SECRET
```

## Webhook amount precision

When verifying callbacks, force `orderAmount` to **2 decimals** before signing:

```
orderAmount=100  →  use orderAmount=100.00 in the sign string
```

Helpers:

```js
const { generateSignature, verifySignature } = require('./src/helpers/signature');

const sign = generateSignature(params, secret);
const ok = verifySignature(payload, secret, { forceAmountDecimals: true });
```

## Submit UTR exception

`POST /api/wallet/submit` body in docs is only `{ orderNo, utr }` — **no `sign` field**.
