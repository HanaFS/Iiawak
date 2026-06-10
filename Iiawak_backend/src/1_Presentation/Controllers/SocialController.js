'use strict';
const SocialService = require('../../2_BusinessLogic/Services/SocialService');

/**
 * SocialController — Gác cổng cho /api/social/*
 */
class SocialController {

  async toggleFollow(req, res) {
    try {
      const result = await SocialService.toggleFollow(req.user.id, req.params.targetId);
      res.json({ success: true, ...result });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async getFollowing(req, res) {
    try {
      const data = await SocialService.getFollowing(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getFollowers(req, res) {
    try {
      const data = await SocialService.getFollowers(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new SocialController();
