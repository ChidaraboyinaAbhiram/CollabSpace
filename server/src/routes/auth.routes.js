const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../middleware/validate.middleware');
const { authenticateToken } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected route
router.get('/me', authenticateToken, getMe);

module.exports = router;
