'use strict';
const express = require('express');
const router = express.Router();
const giftcodeController = require('../Controllers/GiftcodeController');
const { verifyToken, adminOnly } = require('../Middlewares/auth.middleware');

router.post('/redeem', verifyToken, giftcodeController.redeem);
router.post('/', verifyToken, adminOnly, giftcodeController.createGiftcode);

module.exports = router;
