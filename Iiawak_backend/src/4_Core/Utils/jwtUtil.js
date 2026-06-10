'use strict';
const jwt = require('jsonwebtoken');
const { JWT_EXPIRES_IN } = require('../Constants/appConstants');
const config = require('../../config');

const SECRET = config.jwt.secret;

/**
 * jwtUtil — Bọc jsonwebtoken để Service không import thư viện trực tiếp.
 */
const jwtUtil = {
  /**
   * Ký token mới.
   * @param {{ id: string, role: string }} payload
   * @returns {string} JWT token
   */
  sign(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  /**
   * Xác thực và decode token.
   * @param {string} token
   * @returns {{ id: string, role: string, iat: number, exp: number }}
   * @throws nếu token không hợp lệ hoặc hết hạn
   */
  verify(token) {
    return jwt.verify(token, SECRET);
  },
};

module.exports = jwtUtil;
