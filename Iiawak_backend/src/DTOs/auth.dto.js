'use strict';

/**
 * auth.dto.js — Data Transfer Objects cho Auth endpoints.
 *
 * Nguyên tắc: Controller nhận req.body → validate bằng DTO → trả về data sạch.
 * Controller KHÔNG bao giờ trả thẳng Entity Model (có field password) về client.
 */

const AuthDTO = {

  // ── Input Validators ────────────────────────────────────────────────────

  /**
   * Validate dữ liệu đăng ký.
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateRegister({ username, email, password, displayName }) {
    const errors = [];
    if (!username || username.trim().length < 3)
      errors.push('Username phải có ít nhất 3 ký tự');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.push('Email không hợp lệ');
    if (!password || password.length < 6)
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    if (!displayName || displayName.trim().length < 2)
      errors.push('Tên hiển thị phải có ít nhất 2 ký tự');
    return { valid: errors.length === 0, errors };
  },

  validateLogin({ email, password }) {
    const errors = [];
    if (!email)    errors.push('Email không được trống');
    if (!password) errors.push('Mật khẩu không được trống');
    return { valid: errors.length === 0, errors };
  },

  // ── Output Mappers ────────────────────────────────────────────────────

  /**
   * Chuyển Entity User + token → Response an toàn (không có password).
   */
  toAuthResponse(user, token) {
    return {
      token,
      user: {
        id:          user._id,
        username:    user.username,
        email:       user.email,
        displayName: user.displayName,
        avatar:      user.avatar,
        role:        user.role,
        kchBalance:  user.kchBalance,
      },
    };
  },
};

module.exports = AuthDTO;
