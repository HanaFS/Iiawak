/**
 * Rate Limiting Middleware
 * Protects API from abuse with configurable limits
 * Uses Redis for distributed rate limiting
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../../3_DataAccess/Cache/redisClient');
const logger = require('../../4_Core/Logger/logger');
const AppError = require('../../4_Core/Exceptions/AppError');

/**
 * Global rate limiter: 100 requests per 15 minutes per IP
 */
const globalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient.client,
    prefix: 'rl:global:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: (req, res) => {
    return req.ip || req.connection.remoteAddress;
  },
  skip: (req, res) => {
    // Skip rate limiting for internal health checks
    return req.path === '/health' || req.path === '/';
  },
  handler: (req, res) => {
    logger.warn(`[RateLimit] Global limit exceeded: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

/**
 * Auth limiter: 5 login attempts per 15 minutes per IP
 * Stricter for auth endpoints to prevent brute force
 */
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient.client,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Use email or IP for tracking
    return req.body?.email || req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    logger.warn(`[RateLimit] Auth limit exceeded: ${req.body?.email || req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many login attempts, please try again after 15 minutes',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

/**
 * API limiter: 50 requests per minute per user (authenticated)
 */
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient.client,
    prefix: 'rl:api:',
  }),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 requests per windowMs
  message: 'API rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Use userId if authenticated, otherwise use IP
    return req.user?.id || req.ip || req.connection.remoteAddress;
  },
  skip: (req, res) => {
    // Skip for GET requests (read-only)
    return req.method === 'GET';
  },
  handler: (req, res) => {
    const key = req.user?.id || req.ip;
    logger.warn(`[RateLimit] API limit exceeded: ${key}`);
    res.status(429).json({
      success: false,
      error: 'API rate limit exceeded. Maximum 50 write operations per minute',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

/**
 * Payment limiter: 10 payment requests per hour (prevent duplicate payments)
 */
const paymentLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient.client,
    prefix: 'rl:payment:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts per hour
  message: 'Too many payment attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`[RateLimit] Payment limit exceeded: ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many payment attempts. Maximum 10 per hour',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

/**
 * File upload limiter: 5 uploads per hour per user
 */
const uploadLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient.client,
    prefix: 'rl:upload:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 uploads per hour
  message: 'Upload limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`[RateLimit] Upload limit exceeded: ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many uploads. Maximum 5 per hour',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

/**
 * Search limiter: 30 searches per minute (prevent DB hammering)
 */
const searchLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient.client,
    prefix: 'rl:search:',
  }),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: 'Search rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`[RateLimit] Search limit exceeded: ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Search rate limit exceeded. Maximum 30 per minute',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
  apiLimiter,
  paymentLimiter,
  uploadLimiter,
  searchLimiter,
};
