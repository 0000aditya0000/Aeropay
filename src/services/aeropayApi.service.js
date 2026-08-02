/**
 * Low-level AeroPay HTTP API service — mirrors documentation endpoints exactly.
 */

const config = require('../config');
const { aeropayClient } = require('../utils/axiosClient');
const { signParams } = require('../helpers/signature');
const { AEROPAY_PATHS, ORDER_TYPE } = require('../constants');
const { GatewayError } = require('../utils/errors');
const logger = require('../utils/logger');
const { logRepository } = require('../repositories');

class AeropayApiService {
  constructor({ client = aeropayClient, merchantId = config.aeropay.merchantId, secret = config.aeropay.secret } = {}) {
    this.client = client;
    this.merchantId = merchantId;
    this.secret = secret;
  }

  _assertConfig() {
    if (!this.merchantId) throw new GatewayError('AEROPAY_MERCHANT_ID is not configured');
    if (!this.secret || this.secret === 'YOUR_SECRET_HERE') {
      throw new GatewayError('AEROPAY_SECRET is not configured');
    }
  }

  _signed(params) {
    this._assertConfig();
    return signParams({ merchantId: this.merchantId, ...params }, this.secret);
  }

  async _post(path, payload, meta = {}) {
    const start = Date.now();
    let response;
    try {
      response = await this.client.post(path, payload);
      const executionMs = response.executionMs || Date.now() - start;
      const retryCount = response.retryCount || 0;

      await logRepository.createGateway({
        request_id: meta.requestId,
        correlation_id: meta.correlationId,
        merchant_id: payload.merchantId || this.merchantId,
        order_no: payload.merchantOrderNo || payload.orderNo || null,
        direction: 'outbound',
        method: 'POST',
        path,
        status: 'SUCCESS',
        gateway_status: String(response.data?.code ?? ''),
        http_status: response.status,
        execution_ms: executionMs,
        retry_count: retryCount,
        headers: response.config?.headers || null,
        request_payload: payload,
        response_payload: response.data,
        raw_payload: response.data,
      }).catch(() => {});

      return {
        data: response.data,
        status: response.status,
        executionMs,
        retryCount,
      };
    } catch (err) {
      await logRepository.createGateway({
        request_id: meta.requestId,
        correlation_id: meta.correlationId,
        merchant_id: payload.merchantId || this.merchantId,
        order_no: payload.merchantOrderNo || payload.orderNo || null,
        direction: 'outbound',
        method: 'POST',
        path,
        status: 'FAILED',
        gateway_status: String(err.response?.data?.code ?? err.code ?? ''),
        http_status: err.response?.status || null,
        execution_ms: err.executionMs || Date.now() - start,
        retry_count: err.retryCount || 0,
        request_payload: payload,
        response_payload: err.response?.data || null,
        error_message: err.message,
        stack_trace: err.stack,
      }).catch(() => {});

      const gatewayMessage =
        err.response?.data?.message ||
        err.message ||
        'AeroPay request failed';
      throw new GatewayError(gatewayMessage, err.response?.data || null, err.response?.status || 502);
    }
  }

  /**
   * Pay In — POST /api/pay/create/order type=0
   */
  async createPayinOrder(input, meta = {}) {
    const body = this._signed({
      type: ORDER_TYPE.PAYIN,
      merchantOrderNo: input.merchantOrderNo,
      orderAmount: input.orderAmount,
      notifyUrl: input.notifyUrl || config.aeropay.notifyUrl,
      ...(input.returnUrl ? { returnUrl: input.returnUrl } : config.aeropay.returnUrl ? { returnUrl: config.aeropay.returnUrl } : {}),
      ...(input.extra ? { extra: input.extra } : {}),
    });

    logger.info('AeropayApi', 'createPayinOrder', { merchantOrderNo: body.merchantOrderNo, orderAmount: body.orderAmount });
    return this._post(AEROPAY_PATHS.CREATE_ORDER, body, meta);
  }

  /**
   * Pay Out — POST /api/pay/create/order type=1
   */
  async createPayoutOrder(input, meta = {}) {
    const body = this._signed({
      type: ORDER_TYPE.PAYOUT,
      merchantOrderNo: input.merchantOrderNo,
      orderAmount: input.orderAmount,
      accountName: input.accountName,
      cardNumber: input.cardNumber,
      ifsc: input.ifsc,
      bankName: input.bankName || 'BankName',
      ...(input.upi ? { upi: input.upi } : {}),
      notifyUrl: input.notifyUrl || config.aeropay.payoutNotifyUrl,
      phone: input.phone,
      email: input.email,
      ...(input.extra ? { extra: input.extra } : {}),
    });

    logger.info('AeropayApi', 'createPayoutOrder', { merchantOrderNo: body.merchantOrderNo });
    return this._post(AEROPAY_PATHS.CREATE_ORDER, body, meta);
  }

  /** POST /api/pay/query/order */
  async queryOrder({ type, merchantOrderNo }, meta = {}) {
    const body = this._signed({ type, merchantOrderNo });
    return this._post(AEROPAY_PATHS.QUERY_ORDER, body, meta);
  }

  /** POST /api/pay/merchant/balance */
  async getMerchantBalance(meta = {}) {
    const body = this._signed({});
    return this._post(AEROPAY_PATHS.MERCHANT_BALANCE, body, meta);
  }

  /** POST /api/pay/query/upi/status */
  async queryUpiStatus(upi, meta = {}) {
    const body = this._signed({ upi });
    return this._post(AEROPAY_PATHS.QUERY_UPI_STATUS, body, meta);
  }

  /** POST /api/pay/oneself/query/utr/status */
  async queryUtrStatus(utr, meta = {}) {
    const body = this._signed({ utr });
    return this._post(AEROPAY_PATHS.QUERY_UTR_STATUS, body, meta);
  }

  /** POST /api/pay/supplement/order */
  async supplementOrder({ merchantOrderNo, utr }, meta = {}) {
    const body = this._signed({ merchantOrderNo, utr });
    return this._post(AEROPAY_PATHS.SUPPLEMENT_ORDER, body, meta);
  }

  /**
   * POST /api/wallet/submit
   * Docs body has NO sign field — only orderNo + utr
   */
  async submitUtr({ orderNo, utr }, meta = {}) {
    this._assertConfig();
    const body = { orderNo, utr };
    return this._post(AEROPAY_PATHS.SUBMIT_UTR, body, meta);
  }
}

module.exports = {
  AeropayApiService,
  aeropayApiService: new AeropayApiService(),
};
