const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * POST /api/auth/login
 * Returns JWT token on successful login.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);

    return sendSuccess(res, { token, user }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, req.user, 'Profile fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe };
