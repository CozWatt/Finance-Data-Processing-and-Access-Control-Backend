const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, createUserSchema, updateUserSchema } = require('../middleware/validate');

// All user routes require authentication + admin role
router.use(authenticate, authorize('admin'));

router.route('/')
  .get(getAllUsers)
  .post(validate(createUserSchema), createUser);

router.route('/:id')
  .get(getUserById)
  .put(validate(updateUserSchema), updateUser)
  .delete(deleteUser);

module.exports = router;
