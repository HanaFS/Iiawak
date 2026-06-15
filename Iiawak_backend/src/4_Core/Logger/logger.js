'use strict';
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = process.env.LOG_FILE_PATH || './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Winston Logger — Centralized logging utility
 * Supports: console, file, error-file transports
 * Log levels: debug, info, warn, error
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'iiawak-backend' },
  transports: [
    // Console transport (all levels)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...metadata }) => {
          let meta = '';
          if (Object.keys(metadata).length > 0 && metadata.service === service) {
            meta = '';
          } else if (Object.keys(metadata).length > 0) {
            meta = JSON.stringify(metadata);
          }
          return `${timestamp} [${level}] ${message} ${meta}`.trim();
        })
      ),
    }),

    // File transport (all logs)
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: winston.format.json(),
    }),

    // Error file transport (errors only)
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: winston.format.json(),
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV === 'development') {
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'debug.log'),
      level: 'debug',
      format: winston.format.simple(),
    })
  );
}

module.exports = logger;
