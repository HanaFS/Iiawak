'use strict';

/**
 * formatUtil — Các hàm format dữ liệu dùng chung.
 */
const formatUtil = {
  /**
   * Format số lớn thành dạng ngắn gọn (1200 → "1.2K").
   * @param {number} n
   * @returns {string}
   */
  count(n) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  },

  /**
   * Tạo txId duy nhất từ prefix.
   * @param {string} prefix - VD: 'GD', 'GC', 'CHECKIN'
   * @returns {string}
   */
  txId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  },
};

module.exports = formatUtil;
