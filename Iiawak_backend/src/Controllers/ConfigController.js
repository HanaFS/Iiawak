'use strict';
const SystemConfig = require('../Models/SystemConfig.model');

class ConfigController {
  async getConfig(req, res) {
    try {
      const { key } = req.params;
      let config = await SystemConfig.findOne({ key });
      if (!config) {
        // Return default values if not exists
        if (key === 'suKienX2') {
          return res.json({ success: true, data: { key, value: false } });
        }
        return res.status(404).json({ success: false, message: 'Config not found' });
      }
      res.json({ success: true, data: config });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateConfig(req, res) {
    try {
      const { key } = req.params;
      const { value, description } = req.body;
      let config = await SystemConfig.findOne({ key });
      if (!config) {
        config = new SystemConfig({ key, value, description });
      } else {
        if (value !== undefined) config.value = value;
        if (description !== undefined) config.description = description;
        config.updatedAt = Date.now();
      }
      await config.save();
      res.json({ success: true, message: 'Cập nhật cấu hình thành công', data: config });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new ConfigController();
