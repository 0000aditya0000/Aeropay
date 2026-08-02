const { userRepository } = require('../repositories');
const logger = require('../utils/logger');

const validateUserStatus = async (req, res, next) => {
  const userId = req.body.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'Validation Failed',
      error: { userId: 'userId is required' },
    });
  }

  try {
    const user = await userRepository.getStatus(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { userId },
      });
    }

    if (Number(user.status) !== 1) {
      logger.warn('UserStatus', 'Recharge denied', { userId, status: user.status });
      return res.status(403).json({
        success: false,
        message: 'Not allowed to recharge - user account is not active',
        error: { userId, status: user.status },
      });
    }

    req.userStatus = user.status;
    return next();
  } catch (error) {
    logger.logError('UserStatus', 'Validation error', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating user status',
      error: {},
    });
  }
};

module.exports = { validateUserStatus };
