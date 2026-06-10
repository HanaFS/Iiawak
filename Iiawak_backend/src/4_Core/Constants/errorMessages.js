'use strict';

/**
 * errorMessages.js — Tất cả chuỗi lỗi tập trung tại một chỗ.
 * Không rải string lỗi khắp services nữa — import từ đây.
 */
const ErrorMessages = {

  // ── Auth ──────────────────────────────────────────────────────────────────
  AUTH: {
    EMAIL_OR_USERNAME_TAKEN : 'Email hoặc Username đã được sử dụng',
    INVALID_CREDENTIALS     : 'Email hoặc mật khẩu không chính xác',
    TOKEN_MISSING           : 'Không có token xác thực',
    TOKEN_INVALID           : 'Token không hợp lệ hoặc đã hết hạn',
    ACCOUNT_BANNED          : 'Tài khoản của bạn đã bị khóa',
  },

  // ── User ──────────────────────────────────────────────────────────────────
  USER: {
    NOT_FOUND        : 'Không tìm thấy người dùng',
    WRONG_PASSWORD   : 'Mật khẩu cũ không đúng',
    ALREADY_CHECKED_IN: 'Bạn đã điểm danh hôm nay rồi',
  },

  // ── Character ─────────────────────────────────────────────────────────────
  CHARACTER: {
    NOT_FOUND          : 'Không tìm thấy nhân vật',
    REQUIRED_FIELDS    : 'Vui lòng điền đầy đủ thông tin bắt buộc (*)',
    BANNED             : 'Nhân vật này đã bị khóa',
    UNAUTHORIZED_EDIT  : 'Bạn không có quyền chỉnh sửa nhân vật này',
  },

  // ── Community ─────────────────────────────────────────────────────────────
  COMMUNITY: {
    POST_NOT_FOUND     : 'Không tìm thấy bài đăng',
    POST_EMPTY_CONTENT : 'Nội dung bài đăng không được để trống',
    COMMENT_EMPTY      : 'Nội dung bình luận không được để trống',
    DELETE_UNAUTHORIZED: 'Bạn không có quyền xóa bài đăng này',
  },

  // ── Economy / Giftcode ────────────────────────────────────────────────────
  ECONOMY: {
    PACKAGE_NOT_FOUND  : 'Gói nạp không tồn tại',
  },
  GIFTCODE: {
    NOT_FOUND  : 'Mã quà tặng không hợp lệ',
    EXPIRED    : 'Mã quà tặng đã hết hạn',
    MAX_USES   : 'Mã quà tặng đã hết lượt sử dụng',
    ALREADY_USED: 'Bạn đã sử dụng mã này rồi',
  },

  // ── Chat ──────────────────────────────────────────────────────────────────
  CHAT: {
    CHARACTER_NOT_FOUND: 'Nhân vật không tồn tại',
  },

  // ── Generic ───────────────────────────────────────────────────────────────
  GENERIC: {
    SERVER_ERROR    : 'Lỗi hệ thống, vui lòng thử lại sau',
    NOT_FOUND       : 'Không tìm thấy tài nguyên',
    FORBIDDEN       : 'Bạn không có quyền thực hiện hành động này',
    VALIDATION_FAIL : 'Dữ liệu không hợp lệ',
  },
};

module.exports = ErrorMessages;
