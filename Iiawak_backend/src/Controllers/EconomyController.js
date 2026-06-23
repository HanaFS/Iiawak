'use strict';
const { EconomyService } = require('../../business-logic/Services/EconomyService');

/**
 * EconomyController — Gác cổng cho /api/economy/*
 */
class EconomyController {

  async getPackages(req, res) {
    try {
      const packages = await EconomyService.getPackages();
      res.json({ success: true, data: packages });
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
}

module.exports = new EconomyController();
