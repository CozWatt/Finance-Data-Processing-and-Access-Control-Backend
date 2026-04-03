const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

/**
 * Generate a signed JWT for the given user.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Authenticate a user by email + password.
 * Returns the user object and a JWT on success.
 * Throws descriptive errors on failure.
 */
const login = async (email, password) => {
  // Explicitly select password since it's excluded by default
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  if (user.status === 'inactive') {
    throw Object.assign(new Error('Account is deactivated'), { statusCode: 403 });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  const token = generateToken(user);

  return { user, token };
};

module.exports = { login, generateToken };
