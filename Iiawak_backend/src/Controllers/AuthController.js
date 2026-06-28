'use strict';
const authService = require('../Services/AuthService');
const AuthDTO     = require('../DTOs/auth.dto');
const AppError    = require('../Exceptions/AppError');

/**
 * AuthController — Gác cổng cho Auth endpoints.
 * 1. Parse + validate DTO từ req.body
 * 2. Gọi AuthService
 * 3. Map kết quả → Response DTO → res.json()
 */
class AuthController {

  async register(req, res) {
    const validation = AuthDTO.validateRegister(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.errors.join(', ') });
    }

    try {
      const { user, token } = await authService.register(req.body);
      res.status(201).json({ success: true, data: AuthDTO.toAuthResponse(user, token) });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async login(req, res) {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
    }

    try {
      const { user, token } = await authService.login({ identifier, password });
      res.json({ success: true, data: AuthDTO.toAuthResponse(user, token) });
    } catch (err) {
      if (err.code === 'ADMIN_LOCKED') {
        return res.status(403).json({ success: false, code: 'ADMIN_LOCKED', message: 'Tài khoản đã bị khoá vĩnh viễn.' });
      }
      if (err.message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({
          success: false,
          code: 'INVALID_CREDENTIALS',
          remaining: err.remaining,
          message: `Mật khẩu không đúng! Còn ${err.remaining} lần thử.`,
        });
      }
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }


  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }
    try {
      await authService.changePassword(req.user.id, currentPassword, newPassword);
      res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AuthController();
