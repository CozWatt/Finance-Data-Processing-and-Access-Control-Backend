const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate, loginSchema } = require('../middleware/validate');

router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getMe);

module.exports = router;
