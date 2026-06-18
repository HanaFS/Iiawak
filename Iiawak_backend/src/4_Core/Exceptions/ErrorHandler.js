'use strict';
const logger = require('../Logger/logger');
const AppError = require('./AppError');

/**
 * ErrorHandler - Singleton class xử lý lỗi tập trung theo Node Best Practices.
 */
class ErrorHandler {
  /**
   * Quyết định xem lỗi là Operational (an toàn) hay Programmer (nghiêm trọng)
   */
  isTrustedError(error) {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Xử lý lỗi tập trung: Ghi log, trả về client, và crash nếu cần
   */
  async handleError(error, res = null) {
    // 1. Ghi log đầy đủ
    logger.error(
      'Error Message: ' + error.message,
      { stack: error.stack, isOperational: this.isTrustedError(error) }
    );

    // 2. Nếu có object response, gửi phản hồi chuẩn về cho client
    if (res) {
      const statusCode = error.statusCode || 500;
      const isDev = process.env.NODE_ENV === 'development';
      
      const payload = {
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: this.isTrustedError(error) || isDev ? error.message : 'Internal Server Error',
        }
      };

      if (error.details && error.details.length > 0) {
        payload.error.details = error.details;
      }

      if (isDev) {
        payload.error.stack = error.stack;
      }

      res.status(statusCode).json(payload);
    }

    // 3. Nếu là Programmer Error, chúng ta phải crash hệ thống (Graceful Shutdown)
    if (!this.isTrustedError(error)) {
      logger.error('Bugs/Programmer Error detected! Initiating Graceful Shutdown...');
      this.crashProcess();
    }
  }

  /**
   * Dừng an toàn tiến trình. 
   * Trình quản lý tiến trình (như PM2 hoặc Docker) sẽ lo việc tự động khởi động lại.
   */
  crashProcess() {
    // Nếu có connection database, nên đóng ở đây
    // Ví dụ: mongoose.connection.close()
    
    // Thoát sau 1 khoảng nhỏ để đảm bảo log kịp ghi xuống đĩa
    setTimeout(() => {
      process.exit(1);
    }, 1000).unref();
  }
}

module.exports = new ErrorHandler();
