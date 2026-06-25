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
    const validation = AuthDTO.validateLogin(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.errors.join(', ') });
    }

    try {
      const { user, token } = await authService.login(req.body);
      res.json({ success: true, data: AuthDTO.toAuthResponse(user, token) });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AuthController();
