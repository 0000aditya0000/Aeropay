# Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | no | `3010` | HTTP port |
| `NODE_ENV` | no | `development` | Environment |
| `ALLOWED_ORIGINS` | no | `*` | CORS origins (comma-separated) |
| `BODY_LIMIT` | no | `1mb` | JSON body size limit |
| `RATE_LIMIT_WINDOW_MS` | no | `900000` | Rate limit window |
| `RATE_LIMIT_MAX` | no | `100` | Max requests per window |
| `AEROPAY_BASE_URL` | yes | `https://api.aropay-api.com` | Upstream base URL |
| `AEROPAY_MERCHANT_ID` | yes | — | Numeric merchant ID |
| `AEROPAY_SECRET` | yes | — | MD5 signing secret |
| `AEROPAY_TIMEOUT_MS` | no | `30000` | Upstream timeout |
| `AEROPAY_RETRY_COUNT` | no | `3` | Network/timeout retries |
| `NOTIFY_URL` | yes | — | Payin webhook URL |
| `PAYOUT_NOTIFY_URL` | yes | — | Payout webhook URL |
| `RETURN_URL` | no | — | Cashier return URL |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | yes | — | Shared MySQL (same as SkillPay) |
| `DB_SYNC_LOG_TABLES` | no | `true` | Auto-create `aeropay_*` tables |
| `PLATFORM_BASE_URL` | yes | `https://api.rollix777.com` | Rollix777 API |
| `WALLET_BONUS_MULTIPLIER` | no | `1.10` | Wallet credit multiplier on payin success |
| `LOG_LEVEL` | no | `info` | Winston level |
