'use strict';
const { GiftcodeService } = require('../../2_BusinessLogic/Services/EconomyService');

/**
 * GiftcodeController — Gác cổng cho /api/giftcodes/*
 */
class GiftcodeController {

  async redeem(req, res) {
    try {
      const { code } = req.body;
      // req.user.id được set bởi verifyToken middleware
      const result = await GiftcodeService.redeem(code, req.user.id);
      res.json({
        success    : true,
        message    : `Nhận thành công ${result.rewardKch} Kim Cương Hồng`,
        rewardKch  : result.rewardKch,
      });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 400;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async createGiftcode(req, res) {
    try {
      const newCode = await GiftcodeService.createGiftcode(req.body);
      res.json({ success: true, data: newCode });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new GiftcodeController();
