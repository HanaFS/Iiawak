'use strict';
const userService = require('../../2_BusinessLogic/Services/UserService');
const UserDTO     = require('../DTOs/user.dto');

/**
 * UserController — Gác cổng cho User/Profile endpoints.
 */
class UserController {

  async getProfile(req, res) {
    try {
      const user = await userService.getProfile(req.user.id);
      res.json({ success: true, data: UserDTO.toUserResponse(user) });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async updateProfile(req, res) {
    const validation = UserDTO.validateUpdateProfile(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.errors.join(', ') });
    }
    try {
      const user = await userService.updateProfile(req.user.id, req.body);
      res.json({ success: true, data: UserDTO.toUserResponse(user) });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async changePassword(req, res) {
    const validation = UserDTO.validateChangePassword(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.errors.join(', ') });
    }
    try {
      await userService.changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);
      res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async checkin(req, res) {
    try {
      const { date, reward } = req.body;
      const result = await userService.checkin(req.user.id, date, reward);
      res.json({ success: true, earnedKch: result.earnedKch, kchBalance: result.user.kchBalance });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async getTransactions(req, res) {
    try {
      const txs = await userService.getTransactions(req.user.id);
      res.json({ success: true, data: txs });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getSuggestedFriends(req, res) {
    try {
      const users = await userService.getSuggestedFriends(req.user.id);
      res.json({ success: true, data: users.map(u => UserDTO.toUserPublicResponse(u)) });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async toggleFollow(req, res) {
    try {
      const isNowFollowing = await userService.toggleFollow(req.params.targetId, req.user.id);
      res.json({ success: true, isFollowing: isNowFollowing });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }
}

module.exports = new UserController();
