'use strict';
const userRepository = require('../../data-access/Repositories/UserRepository');
const jwtUtil        = require('../../core/Utils/jwtUtil');
const AppError       = require('../../core/Exceptions/AppError');
const Errors         = require('../../core/Constants/errorMessages');

/**
 * AuthService — Xử lý nghiệp vụ Đăng ký / Đăng nhập.
 * KHÔNG query MongoDB trực tiếp — ủy thác hoàn toàn cho UserRepository.
 */
class AuthService {

  /**
   * Đăng ký tài khoản mới.
   * @param {{ username, email, password, displayName }} dto
   * @returns {{ user, token }}
   */
  async register({ username, email, password, displayName }) {
    // Nghiệp vụ: kiểm tra trùng lặp
    const existing = await userRepository.findByEmailOrUsername(email, username);
    if (existing) {
      throw AppError.conflict(Errors.AUTH.EMAIL_OR_USERNAME_TAKEN, 'AUTH_CONFLICT');
    }

    // Tạo user (password sẽ được hash bởi pre-save hook trong Model)
    const user  = await userRepository.create({ username, email, password, displayName });
    const token = jwtUtil.sign({ id: user._id, role: user.role });

    return { user, token };
  }

  /**
   * Đăng nhập.
   * @param {{ email, password }} dto
   * @returns {{ user, token }}
   */
  async login({ email, password }) {
    // Cần lấy full user kể cả password để compare → dùng findByEmail (trả về cả password)
    const user = await userRepository.findByEmail(email);

    // Dùng comparePassword method trên Model
    const isMatch = user && (await user.comparePassword(password));
    if (!isMatch) {
      throw AppError.unauthorized(Errors.AUTH.INVALID_CREDENTIALS);
    }

    if (user.status === 'banned') {
      throw AppError.forbidden(Errors.AUTH.ACCOUNT_BANNED);
    }

    const token = jwtUtil.sign({ id: user._id, role: user.role });
    return { user, token };
  }
}

module.exports = new AuthService();
