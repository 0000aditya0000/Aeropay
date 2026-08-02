/**
 * Standard API response helpers
 */

const success = (res, message = 'Success', data = {}, statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });

const failure = (res, message = 'Request Failed', error = {}, statusCode = 400) =>
  res.status(statusCode).json({
    success: false,
    message,
    error,
  });

module.exports = {
  success,
  failure,
};
