'use strict';
const express              = require('express');
const router               = express.Router();
const GiftcodeController   = require('../controllers/GiftcodeController');
const { verifyToken }      = require('../middlewares/auth.middleware');

// Mobile: Đổi giftcode
router.post('/redeem',   verifyToken, GiftcodeController.redeem.bind(GiftcodeController));

// Admin: Tạo mã mới
router.post('/create',   GiftcodeController.createGiftcode.bind(GiftcodeController));

module.exports = router;
