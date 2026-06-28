'use strict';
const express = require('express');
const router = express.Router();
const authController = require('../Controllers/AuthController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/change-password', require('../Middlewares/auth.middleware').verifyToken, authController.changePassword);


module.exports = router;
