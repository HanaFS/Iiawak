'use strict';
require('dotenv').config(); // Load environment variables once here

const config = {
  app: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
  },
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/iiawak',
  },
  redis: {
    uri: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'iiawak_super_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  ai: {
    geminiKey: process.env.GEMINI_API_KEY,
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE,
    hashSecret: process.env.VNPAY_HASH_SECRET,
    url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paygate',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment-result',
    api: process.env.VNPAY_API || 'https://api.vnpayment.vn/',
  },
  cors: {
    adminUrl: process.env.ADMIN_URL || 'http://localhost:5173',
  },
};

module.exports = config;
