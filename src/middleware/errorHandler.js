const logger = require('../utils/logger');
const { sendError } = require('../utils/apiResponse');

/**
 * Global error handling middleware.
 * Must have 4 parameters for Express to recognise it as an error handler.
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.path} — ${err.message}`, err);

  // Mongoose duplicate key error (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, `${field} already exists.`, 409);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 'Validation error', 400, errors);
  }

  // Mongoose CastError (bad ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, `Invalid ${err.path}: ${err.value}`, 400);
  }

  // Default server error — hide details in production
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  return sendError(res, message, statusCode);
};

/**
 * 404 handler for unmatched routes.
 */
const notFound = (req, res) => {
  sendError(res, `Route not found: ${req.method} ${req.path}`, 404);
};

module.exports = { errorHandler, notFound };
