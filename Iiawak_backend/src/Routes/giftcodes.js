'use strict';
const express = require('express');
const router = express.Router();
const giftcodeController = require('../Controllers/GiftcodeController');
const { verifyToken, adminOnly } = require('../Middlewares/auth.middleware');

router.post('/redeem', verifyToken, giftcodeController.redeem);
router.post('/', verifyToken, adminOnly, giftcodeController.createGiftcode);
router.get('/', verifyToken, adminOnly, giftcodeController.getGiftcodes);
router.delete('/:id', verifyToken, adminOnly, giftcodeController.deleteGiftcode);
router.patch('/:id/toggle', verifyToken, adminOnly, giftcodeController.toggleGiftcode);

module.exports = router;
