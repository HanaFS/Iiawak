'use strict';
const express = require('express');
const router = express.Router();
const authController = require('../Controllers/AuthController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.loginGoogle);

// --- Quên mật khẩu ---
router.post('/forgot-password-otp', authController.forgotPasswordOtp);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

router.put('/change-password', require('../Middlewares/auth.middleware').verifyToken, authController.changePassword);


module.exports = router;
