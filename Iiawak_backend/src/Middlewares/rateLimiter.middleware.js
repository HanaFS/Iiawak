/**
 * Rate Limiting Middleware
 * Protects API from abuse with configurable limits
 * Uses Memory as fallback if Redis is not connected
 */

const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter: 100 requests per 15 minutes per IP
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health' || req.path === '/';
  }
});

/**
 * Auth limiter: 5 login attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * API limiter: 50 requests per minute per user
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: 'API rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.method === 'GET';
  }
});

/**
 * Payment limiter: 10 payment requests per hour
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many payment attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * File upload limiter: 5 uploads per hour per user
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Upload limit exceeded',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Search limiter: 30 searches per minute
 */
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Search rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  globalLimiter,
  authLimiter,
  apiLimiter,
  paymentLimiter,
  uploadLimiter,
  searchLimiter,
};
