'use strict';
const express = require('express');
const router  = express.Router();
const AuthController = require('../1_Presentation/Controllers/AuthController');

// POST /api/auth/register
router.post('/register', AuthController.register.bind(AuthController));

// POST /api/auth/login
router.post('/login', AuthController.login.bind(AuthController));

module.exports = router;
