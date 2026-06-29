'use strict';
const { EconomyService } = require('../Services/EconomyService');
const SystemConfig = require('../Models/SystemConfig.model');

/**
 * EconomyController — Gác cổng cho /api/economy/*
 */
class EconomyController {

  async getPackages(req, res) {
    try {
      const packages = await EconomyService.getPackages();
      const x2Config = await SystemConfig.findOne({ key: 'suKienX2' });
      const isX2Active = x2Config ? x2Config.value : false;
      res.json({ success: true, data: packages, isX2Active });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async createPackage(req, res) {
    try {
      const pkg = await EconomyService.createPackage(req.body);
      res.status(201).json({ success: true, data: pkg });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updatePackage(req, res) {
    try {
      const updated = await EconomyService.updatePackage(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deletePackage(req, res) {
    try {
      await EconomyService.deletePackage(req.params.id);
      res.json({ success: true, message: 'Đã xóa gói nạp' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async verifyPurchase(req, res) {
    try {
      const { productId, purchaseToken } = req.body;
      const userId = req.user.id; // user ID từ JWT
      if (!productId || !purchaseToken) {
        return res.status(400).json({ success: false, message: 'Thiếu productId hoặc purchaseToken' });
      }

      const result = await EconomyService.verifyPurchase(userId, productId, purchaseToken);
      res.json({ success: true, message: 'Thanh toán thành công', data: result });
    } catch (err) {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new EconomyController();
