'use strict';
const express              = require('express');
const router               = express.Router();
const GiftcodeController   = require('../1_Presentation/Controllers/GiftcodeController');
const { verifyToken }      = require('../1_Presentation/Middlewares/auth.middleware');

// Mobile: Đổi giftcode
router.post('/redeem',   verifyToken, GiftcodeController.redeem.bind(GiftcodeController));

// Admin: Tạo mã mới
router.post('/create',   GiftcodeController.createGiftcode.bind(GiftcodeController));

module.exports = router;
