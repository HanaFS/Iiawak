'use strict';
const bcrypt = require('bcryptjs');

/**
 * passwordUtil — Bọc bcrypt để Service không cần biết thư viện cụ thể.
 */
const passwordUtil = {
  /**
   * Hash mật khẩu plain-text.
   * @param {string} password
   * @returns {Promise<string>} hashed password
   */
  async hash(password) {
    return bcrypt.hash(password, 10);
  },

  /**
   * So sánh plain-text với hash đã lưu.
   * @param {string} plain
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  async compare(plain, hash) {
    return bcrypt.compare(plain, hash);
  },
};

module.exports = passwordUtil;
