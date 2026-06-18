'use strict';

/**
 * AppError — Custom error class cho toàn bộ hệ thống (Node Best Practices).
 *
 * Mọi Operational Error (Lỗi lường trước: validation, auth, not found) 
 * nên được throw bằng class này. `isOperational = true` giúp ErrorHandler
 * nhận diện và không crash tiến trình.
 */
class AppError extends Error {
  /**
   * @param {string} message   - Thông báo lỗi gửi về client
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 500...)
   * @param {string} [code]    - Mã lỗi tùy chọn (VD: 'USER_NOT_FOUND')
   * @param {boolean} [isOperational] - Mặc định true
   * @param {Array} [details]  - Mảng chi tiết lỗi (thường dùng cho validation)
   */
  constructor(message, statusCode = 500, code = null, isOperational = true, details = []) {
    super(message);
    this.name = this.constructor.name; // Đặt name chuẩn
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    
    // Giữ lại stack trace gốc
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Factory helpers ─────────────────────────────────────────────────────────

/** 400 Bad Request — Dữ liệu đầu vào không hợp lệ */
AppError.badRequest = (msg, code = 'BAD_REQUEST', details = []) => 
  new AppError(msg, 400, code, true, details);

/** 401 Unauthorized — Chưa xác thực */
AppError.unauthorized = (msg = 'Chưa đăng nhập hoặc token không hợp lệ', code = 'UNAUTHORIZED') =>
  new AppError(msg, 401, code, true);

/** 403 Forbidden — Không có quyền */
AppError.forbidden = (msg = 'Bạn không có quyền thực hiện hành động này', code = 'FORBIDDEN') =>
  new AppError(msg, 403, code, true);

/** 404 Not Found — Không tìm thấy tài nguyên */
AppError.notFound = (resource = 'Tài nguyên') =>
  new AppError(`${resource} không tồn tại`, 404, 'NOT_FOUND', true);

/** 409 Conflict — Trùng lặp dữ liệu */
AppError.conflict = (msg, code = 'CONFLICT') => 
  new AppError(msg, 409, code, true);

/** 500 Internal Server Error (Lỗi từ các dịch vụ phụ trợ, network...) */
AppError.internal = (msg = 'Lỗi hệ thống, vui lòng thử lại sau', code = 'INTERNAL_ERROR', isOperational = true) =>
  new AppError(msg, 500, code, isOperational);

module.exports = AppError;
