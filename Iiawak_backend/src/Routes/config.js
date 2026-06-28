'use strict';
const express = require('express');
const router = express.Router();
const configController = require('../Controllers/ConfigController');
const { verifyToken, adminOnly } = require('../Middlewares/auth.middleware');

// Public route to get a specific config
router.get('/:key', configController.getConfig);

// Admin only route to update config
router.put('/:key', adminOnly, configController.updateConfig);

module.exports = router;
