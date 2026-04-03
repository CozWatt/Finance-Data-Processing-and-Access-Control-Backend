const userService = require('../services/userService');
const { sendSuccess, sendCreated } = require('../utils/apiResponse');

/**
 * POST /api/users — Admin only
 */
const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    return sendCreated(res, user, 'User created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users — Admin only
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { users, meta } = await userService.getAllUsers({ page, limit });
    return sendSuccess(res, users, 'Users fetched', 200, meta);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id — Admin only
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, user, 'User fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id — Admin only
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return sendSuccess(res, user, 'User updated');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id — Admin only (soft delete)
 */
const deleteUser = async (req, res, next) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user._id.toString()) {
      return sendSuccess(res, null, 'Cannot delete your own account', 400);
    }
    await userService.deleteUser(req.params.id);
    return sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser };
