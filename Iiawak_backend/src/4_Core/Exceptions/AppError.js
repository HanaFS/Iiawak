'use strict';

/**
 * AppError — Custom error class cho toàn bộ hệ thống.
 *
 * Thay vì `throw new Error('string')` (không biết HTTP status),
 * hãy dùng `throw new AppError('message', 400)`.
 *
 * Controller xử lý:
 *   if (err instanceof AppError) res.status(err.statusCode).json(...)
 */
class AppError extends Error {
  /**
   * @param {string} message   - Thông báo lỗi gửi về client
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 500...)
   * @param {string} [code]    - Mã lỗi tùy chọn (VD: 'USER_NOT_FOUND')
   */
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code       = code;
    this.isAppError = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Factory helpers ─────────────────────────────────────────────────────────

/** 400 Bad Request — Dữ liệu đầu vào không hợp lệ */
AppError.badRequest = (msg, code) => new AppError(msg, 400, code);

/** 401 Unauthorized — Chưa xác thực */
AppError.unauthorized = (msg = 'Chưa đăng nhập hoặc token không hợp lệ') =>
  new AppError(msg, 401, 'UNAUTHORIZED');

/** 403 Forbidden — Không có quyền */
AppError.forbidden = (msg = 'Bạn không có quyền thực hiện hành động này') =>
  new AppError(msg, 403, 'FORBIDDEN');

/** 404 Not Found — Không tìm thấy tài nguyên */
AppError.notFound = (resource = 'Tài nguyên') =>
  new AppError(`${resource} không tồn tại`, 404, 'NOT_FOUND');

/** 409 Conflict — Trùng lặp dữ liệu */
AppError.conflict = (msg, code = 'CONFLICT') => new AppError(msg, 409, code);

/** 500 Internal Server Error */
AppError.internal = (msg = 'Lỗi hệ thống, vui lòng thử lại sau') =>
  new AppError(msg, 500, 'INTERNAL_ERROR');

module.exports = AppError;
