'use strict';
const userRepository = require('../Repositories/UserRepository');
const jwtUtil        = require('../Utils/jwtUtil');
const AppError       = require('../Exceptions/AppError');
const Errors         = require('../Constants/errorMessages');
const { OAuth2Client } = require('google-auth-library');
const emailService   = require('../Services/EmailService');
const crypto         = require('crypto');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_WEB_CLIENT_ID_HERE');

const MAX_LOGIN_ATTEMPTS = 3; // Khoá vĩnh viễn sau 3 lần sai

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
    const existing = await userRepository.findByEmailOrUsername(email, username);
    if (existing) {
      throw AppError.conflict(Errors.AUTH.EMAIL_OR_USERNAME_TAKEN, 'AUTH_CONFLICT');
    }

    const user  = await userRepository.create({ username, email, password, displayName });
    const token = jwtUtil.sign({ id: user._id, username: user.username, role: user.role });

    return { user, token };
  }

  /**
   * Đăng nhập Admin.
   * Hỗ trợ identifier = username HOẶC email.
   * Khoá vĩnh viễn vào MongoDB sau MAX_LOGIN_ATTEMPTS lần sai.
   *
   * @param {{ identifier, password }} dto
   * @returns {{ user, token }}
   */
  async login({ identifier, password }) {
    // Tìm user bằng username hoặc email (kèm password hash)
    const user = await userRepository.findByIdentifier(identifier);

    // ── Tài khoản bị khoá vĩnh viễn ──────────────────────────────────────────────
    // adminLocked = 'Yes' → bị khoá. Vào MongoDB đổi thành 'No' để mở khoá.
    if (user && user.adminLocked === 'Yes') {
      const err = new Error('ADMIN_LOCKED');
      err.isAppError  = true;
      err.statusCode  = 403;
      err.code        = 'ADMIN_LOCKED';
      throw err;
    }

    // ── Kiểm tra mật khẩu ────────────────────────────────────────────────────
    const isMatch = user && (await user.comparePassword(password));

    if (!isMatch) {
      if (user) {
        // Tăng số lần thử sai
        user.loginAttempts = (user.loginAttempts || 0) + 1;

        if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
          // Khoá vĩnh viễn — lưu vào MongoDB với giá trị 'Yes'
          // → Để mở khoá: vào MongoDB Compass, tìm user, sửa adminLocked từ 'Yes' → 'No'
          user.adminLocked = 'Yes';
          await user.save();

          const err = new Error('ADMIN_LOCKED');
          err.isAppError = true;
          err.statusCode = 403;
          err.code       = 'ADMIN_LOCKED';
          throw err;
        }

        await user.save();
        // Trả về số lần còn lại để frontend hiển thị
        const remaining = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
        const err = new Error('INVALID_CREDENTIALS');
        err.isAppError  = true;
        err.statusCode  = 401;
        err.remaining   = remaining;
        throw err;
      }

      // Không tìm thấy user — không tiết lộ thông tin
      throw AppError.unauthorized(Errors.AUTH.INVALID_CREDENTIALS);
    }

    // ── Đăng nhập thành công ──────────────────────────────────────────────────
    if (user.status === 'banned') {
      throw AppError.forbidden(Errors.AUTH.ACCOUNT_BANNED);
    }

    // Nếu cần check role admin, có thể làm ở route/controller riêng
    // Hiện tại cho phép tất cả đăng nhập để trả token về cho app

    // Reset số lần sai
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      await user.save();
    }

    const token = jwtUtil.sign({ id: user._id, username: user.username, role: user.role });
    return { user, token };
  }

  /**
   * Đổi mật khẩu (dùng cho tính năng đổi mật khẩu trong Topbar).
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw AppError.notFound('Người dùng');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw AppError.unauthorized('Mật khẩu hiện tại không chính xác.');
    }
    if (newPassword === currentPassword) {
      throw AppError.badRequest('Mật khẩu mới không được trùng mật khẩu cũ.');
    }

    user.password = newPassword;
    await user.save();
  }

  /**
   * Mở khoá tài khoản admin (chỉ developer dùng qua script hoặc API đặc biệt).
   */
  async unlockAdmin(identifier) {
    const user = await userRepository.findByIdentifier(identifier);
    if (!user) throw AppError.notFound('Người dùng');

    // Trong MongoDB Compass: tự tay sửa adminLocked từ 'Yes' → 'No'
    user.adminLocked   = 'No';
    user.loginAttempts = 0;
    await user.save();
    return user;
  }

  /**
   * Đăng nhập bằng Google
   */
  async loginGoogle(idToken) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID || 'YOUR_WEB_CLIENT_ID_HERE',
      });
      const payload = ticket.getPayload();
      
      const email = payload['email'];
      const name = payload['name'];

      if (!email) {
        throw AppError.badRequest('Không thể lấy email từ Google.');
      }

      // Check if user exists
      let user = await userRepository.findByEmailOrUsername(email, email);
      
      if (!user) {
        // Create new user automatically
        const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 10000);
        user = await userRepository.create({ 
          username: username, 
          email: email, 
          password: Math.random().toString(36).slice(-10), // Random password
          displayName: name 
        });
      }

      if (user.status === 'banned') {
        throw AppError.forbidden(Errors.AUTH.ACCOUNT_BANNED);
      }

      const token = jwtUtil.sign({ id: user._id, username: user.username, role: user.role });
      return { user, token };

    } catch (err) {
      if (err.isAppError) throw err;
      throw AppError.unauthorized('Xác thực Google thất bại: ' + err.message);
    }
  }

  // --- Quên Mật Khẩu (OTP Flow) ---

  async sendResetOtp(email) {
    const user = await userRepository.findByEmailOrUsername(email, email);
    if (!user) {
      throw AppError.notFound('Tài khoản chưa được đăng ký.');
    }

    // Tạo mã OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 phút
    await user.save();

    // Gửi email
    const result = await emailService.sendOTPEmail(user.email, otp, 10);
    if (!result.success) {
      throw AppError.internal('Không thể gửi email: ' + result.error);
    }
  }

  async verifyResetOtp(email, otp) {
    const user = await userRepository.findByEmailOrUsername(email, email);
    if (!user) {
      throw AppError.notFound('Không tìm thấy người dùng.');
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      throw AppError.badRequest('Mã xác nhận không chính xác.');
    }

    if (Date.now() > user.resetPasswordExpires) {
      throw AppError.badRequest('Mã xác nhận đã hết hạn.');
    }

    // Xác nhận thành công -> sinh ra một resetToken để dùng ở bước sau
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút để đổi mật khẩu
    user.resetPasswordToken = resetToken; // Thêm trường tạm thời vào document
    await user.save();

    return resetToken;
  }

  async resetPassword(email, resetToken, newPassword) {
    const user = await userRepository.findByEmailOrUsername(email, email);
    if (!user) {
      throw AppError.notFound('Không tìm thấy người dùng.');
    }

    if (!user.resetPasswordToken || user.resetPasswordToken !== resetToken) {
      throw AppError.badRequest('Yêu cầu không hợp lệ hoặc đã hết hạn.');
    }

    if (Date.now() > user.resetPasswordExpires) {
      throw AppError.badRequest('Thời gian đổi mật khẩu đã hết hạn.');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }
}

module.exports = new AuthService();
