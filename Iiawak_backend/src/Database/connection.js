'use strict';
const mongoose = require('mongoose');

/**
 * connection.js — Quản lý kết nối MongoDB.
 * Tách hoàn toàn khỏi server.js để dễ test và tái sử dụng.
 */
const config = require('../config');

const connect = async () => {
  const uri = config.db.uri;
  await mongoose.connect(uri);
  console.log('✅ MongoDB đã kết nối:', uri.replace(/\/\/.*@/, '//<credentials>@'));
};

const disconnect = async () => {
  await mongoose.disconnect();
  console.log('🔌 MongoDB đã ngắt kết nối');
};

module.exports = { connect, disconnect };
