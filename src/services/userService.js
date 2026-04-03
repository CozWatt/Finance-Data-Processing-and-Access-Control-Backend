const { User } = require('../models/User');

/**
 * Create a new user (admin only).
 * Mongoose pre-save hook handles password hashing.
 */
const createUser = async (userData) => {
  const user = await User.create(userData);
  return user;
};

/**
 * Get all users with optional pagination.
 * Soft-deleted users are excluded by the model's query middleware.
 */
const getAllUsers = async ({ page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  return {
    users,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single user by ID.
 */
const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  return user;
};

/**
 * Update user fields. Only provided fields are updated.
 * If password is included, Mongoose pre-save will re-hash it.
 */
const updateUser = async (id, updates) => {
  const user = await User.findById(id).select('+password');
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  Object.assign(user, updates);
  await user.save(); // triggers pre-save hooks (e.g. password hash)

  // Re-fetch without password
  return User.findById(id);
};

/**
 * Soft delete a user by setting deletedAt timestamp.
 * The model's query middleware will filter them out of future finds.
 */
const deleteUser = async (id) => {
  const user = await User.findByIdAndUpdate(
    id,
    { deletedAt: new Date() },
    { new: true }
  );
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  return user;
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser };
