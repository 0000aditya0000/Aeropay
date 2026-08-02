/**
 * Authentication placeholder — wire merchant API keys / JWT later
 */
const authPlaceholder = (req, res, next) => {
  // Intentionally permissive for gateway module integration
  req.auth = { authenticated: false, merchantId: null };
  next();
};

module.exports = { authPlaceholder };
