'use strict';
const logger = require('../../core/Logger/logger');

/**
 * Request Logger Middleware
 * Logs incoming requests and responses with duration, status, user info
 */
const requestLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.id || generateRequestId();

  // Store requestId in request for later use
  req.requestId = requestId;

  // Intercept res.json to log response
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const userId = req.user ? req.user.id : 'anonymous';
    const method = req.method;
    const path = req.path;
    const ip = req.ip || req.connection.remoteAddress;

    // Log success or error
    const logMessage = `${method} ${path} - ${statusCode} ${duration}ms`;
    const logLevel = statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](logMessage, {
      requestId,
      method,
      path,
      statusCode,
      duration,
      userId,
      ip,
      userAgent: req.get('user-agent'),
    });

    return originalJson.call(this, data);
  };

  // Intercept res.status to catch other response methods
  const originalStatus = res.status;
  res.status = function (code) {
    this.statusCode = code;
    return originalStatus.call(this, code);
  };

  logger.debug(`Incoming request: ${req.method} ${req.path}`, {
    requestId,
    userId: req.user ? req.user.id : 'anonymous',
    ip: req.ip,
    query: req.query,
    body: req.body ? { ...req.body, password: '***' } : undefined,
  });

  next();
};

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = requestLoggerMiddleware;
