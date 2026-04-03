const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { sendError } = require('../utils/apiResponse');

/**
 * Verifies the JWT token in the Authorization header.
 * Attaches the decoded user to req.user on success.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Re-fetch user to ensure they're still active (not deactivated after token was issued)
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 'User no longer exists.', 401);
    }

    if (user.status === 'inactive') {
      return sendError(res, 'Account is deactivated. Contact an administrator.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired. Please log in again.', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token.', 401);
    }
    next(error);
  }
};

/**
 * Role-based access control middleware factory.
 * Usage: authorize('admin') or authorize('admin', 'analyst')
 *
 * Role hierarchy:
 *   admin   → full access
 *   analyst → read + analytics
 *   viewer  → read-only
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

module.exports = { authenticate, authorize };
