'use strict';
const errorHandler = require('../Exceptions/ErrorHandler');

/**
 * Global Error Handling Middleware cho Express.
 * Nằm ở cuối cùng của các app.use() pipeline.
 * Bắt mọi lỗi từ router, middleware, và controller.
 */
const errorMiddleware = async (err, req, res, next) => {
  // Delegate toàn bộ quá trình log, format, crash sang ErrorHandler tập trung
  await errorHandler.handleError(err, res);
};

module.exports = errorMiddleware;
