'use strict';
const AdminService = require('../../2_BusinessLogic/Services/AdminService');
const NotificationService = require('../../2_BusinessLogic/Services/NotificationService');
const AppError     = require('../../4_Core/Exceptions/AppError');

/**
 * AdminController — Gác cổng cho /api/admin/*
 * Chỉ phục vụ Admin Dashboard (Web).
 */
class AdminController {

  async getDashboard(req, res) {
    try {
      const data = await AdminService.getDashboardStats();
      res.json({ success: true, data });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async getUsers(req, res) {
    try {
      const { search, status, page, limit } = req.query;
      const data = await AdminService.getUsers(search, status, page, limit);
      res.json({ success: true, data: data.users, total: data.total, page: data.page });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async getUserDetail(req, res) {
    try {
      const data = await AdminService.getUserDetail(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async manageUser(req, res) {
    try {
      const { action, reason } = req.body;
      const user = await AdminService.takeActionOnUser(req.params.id, action, reason, req.user.id);
      
      const io = req.app.get('io');
      if (io) {
        NotificationService.emitToUser(user._id.toString(), 'admin:action', { action, reason }, io);
      }
      
      res.json({ success: true, message: `Đã thực hiện: ${action}`, data: user });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async adjustUserKch(req, res) {
    try {
      const { amount } = req.body;
      const user = await AdminService.adjustUserKch(req.params.id, amount);
      
      const io = req.app.get('io');
      if (io) {
        NotificationService.emitToUser(user._id.toString(), 'admin:action', { 
          action: 'kch_update', 
          amount: amount, 
          newBalance: user.kchBalance 
        }, io);
      }

      res.json({ success: true, message: `Đã điều chỉnh ${amount} KCH`, newBalance: user.kchBalance });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async getCharacters(req, res) {
    try {
      const chars = await AdminService.getCharacters();
      res.json({ success: true, data: chars });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateCharacter(req, res) {
    try {
      const char = await AdminService.updateCharacter(req.params.id, req.body);
      res.json({ success: true, data: char });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteCharacter(req, res) {
    try {
      await AdminService.banCharacter(req.params.id);
      res.json({ success: true, message: 'Đã khóa nhân vật' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getPosts(req, res) {
    try {
      const posts = await AdminService.getPosts();
      res.json({ success: true, data: posts });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deletePost(req, res) {
    try {
      await AdminService.deletePost(req.params.id);
      res.json({ success: true, message: 'Đã xóa bài đăng' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AdminController();
