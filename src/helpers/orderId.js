const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

let payinCounter = 1;
let payoutCounter = 1;

const pad = (n, width = 3) => String(n).padStart(width, '0');

/**
 * Generate merchant order no: AERO_YYYYMMDD_HHMMSS_XXX
 */
const generatePayinOrderId = () => {
  const now = dayjs();
  const id = `AERO_${now.format('YYYYMMDD')}_${now.format('HHmmss')}_${pad(payinCounter)}`;
  payinCounter = payinCounter >= 999 ? 1 : payinCounter + 1;
  return id;
};

/**
 * Generate payout merchant order no: AEROPAY_YYYYMMDD_HHMMSS_XXX
 */
const generatePayoutOrderId = () => {
  const now = dayjs();
  const id = `AEROPAY_${now.format('YYYYMMDD')}_${now.format('HHmmss')}_${pad(payoutCounter)}`;
  payoutCounter = payoutCounter >= 999 ? 1 : payoutCounter + 1;
  return id;
};

const generateRequestId = () => uuidv4();

const getDateParts = (date = new Date()) => {
  const d = dayjs(date);
  return {
    date: d.format('YYYY-MM-DD'),
    time: d.format('HH:mm:ss'),
  };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  generatePayinOrderId,
  generatePayoutOrderId,
  generateRequestId,
  getDateParts,
  sleep,
  uuidv4,
};
