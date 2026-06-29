'use strict';
const jwtUtil  = require('../Utils/jwtUtil');
const AppError = require('../Exceptions/AppError');
const Errors   = require('../Constants/errorMessages');
const User     = require('../Models/User.model');

/**
 * auth.middleware.js — Middleware xác thực JWT.
 * Thay thế middleware/auth.js cũ — dùng jwtUtil từ Core.
 */

/** Bắt buộc phải có token hợp lệ */
const verifyToken = async (req, res, next) => {
  try {
    const header = req.headers['authorization'];
    const token  = header && header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) throw AppError.unauthorized(Errors.AUTH.TOKEN_MISSING);

    const decoded = jwtUtil.verify(token);
    
    // Check if user is banned or locked
    const user = await User.findById(decoded.id).select('status adminLocked');
    if (user && user.adminLocked === 'Yes') {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
    }
    if (user && user.status === 'banned') {
      return res.status(403).json({ success: false, message: Errors.AUTH.ACCOUNT_BANNED });
    }

    req.user = decoded;
    next();
  } catch (err) {
    const statusCode = err.isAppError ? err.statusCode : 401;
    res.status(statusCode).json({ success: false, message: err.message || Errors.AUTH.TOKEN_INVALID });
  }
};

/** Token tùy chọn — nếu có thì decode, không có thì bỏ qua */
const optionalAuth = async (req, res, next) => {
  const header = req.headers['authorization'];
  const token  = header && header.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try { 
      const decoded = jwtUtil.verify(token); 
      const user = await User.findById(decoded.id).select('status adminLocked');
      if (user && user.adminLocked !== 'Yes' && user.status !== 'banned') {
        req.user = decoded;
      }
    } catch (_) { /* ignore */ }
  }
  next();
};

/** Chỉ admin mới được vào */
const adminOnly = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: Errors.GENERIC.FORBIDDEN });
    }
    next();
  });
};

module.exports = { verifyToken, optionalAuth, adminOnly };
