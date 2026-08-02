class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

class GatewayError extends AppError {
  constructor(message, details = null, statusCode = 502) {
    super(message, statusCode, details);
    this.name = 'GatewayError';
  }
}

class SignatureError extends AppError {
  constructor(message = 'Invalid signature') {
    super(message, 401);
    this.name = 'SignatureError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  GatewayError,
  SignatureError,
};
