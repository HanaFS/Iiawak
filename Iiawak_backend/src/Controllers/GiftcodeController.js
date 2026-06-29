'use strict';
const { GiftcodeService } = require('../Services/EconomyService');

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

  async getGiftcodes(req, res) {
    try {
      const giftcodes = await GiftcodeService.getGiftcodes();
      res.json({ success: true, data: giftcodes });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteGiftcode(req, res) {
    try {
      const { id } = req.params;
      await GiftcodeService.deleteGiftcode(id);
      res.json({ success: true, message: 'Đã xóa mã quà tặng' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async toggleGiftcode(req, res) {
    try {
      const { id } = req.params;
      const updated = await GiftcodeService.toggleGiftcode(id);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new GiftcodeController();
