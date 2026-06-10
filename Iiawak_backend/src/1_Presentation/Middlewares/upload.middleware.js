'use strict';
const multer  = require('multer');
const AppError = require('../../4_Core/Exceptions/AppError');

/**
 * upload.middleware.js — Middleware xử lý multipart/form-data.
 *
 * Dùng memoryStorage (lưu vào RAM) thay vì diskStorage:
 *   ✅ Không cần viết file tạm ra ổ đĩa
 *   ✅ Truyền Buffer trực tiếp lên Cloudinary qua upload_stream
 *   ✅ Sạch hơn, không để lại file rác nếu server crash
 *
 * Giới hạn kích thước được set tại đây làm lớp phòng thủ đầu tiên.
 * StorageService sẽ validate lại một lần nữa (defense in depth).
 */

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Định dạng file không được hỗ trợ. Chấp nhận: JPG, PNG, WebP, GIF', 400, 'INVALID_FILE_TYPE'), false);
  }
};

// Instance multer cơ sở
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB tối đa
  },
});

// ─── Middleware sẵn dùng cho từng loại upload ─────────────────────────────

/**
 * Upload 1 ảnh (VD: avatar người dùng, avatar nhân vật)
 * Field name: 'avatar'
 */
const uploadSingleAvatar = upload.single('avatar');

/**
 * Upload tối đa 5 ảnh cùng lúc (VD: ảnh bài đăng)
 * Field name: 'images'
 */
const uploadPostImages = upload.array('images', 5);

/**
 * Wrapper chuyển đổi lỗi Multer thành AppError để Controller xử lý nhất quán.
 * @param {Function} multerMiddleware - uploadSingleAvatar hoặc uploadPostImages
 */
const withErrorHandling = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Tối đa 5MB',
        code: 'FILE_TOO_LARGE',
      });
    }

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        code: err.code,
      });
    }

    res.status(400).json({ success: false, message: err.message || 'Lỗi upload file' });
  });
};

module.exports = {
  uploadSingleAvatar : withErrorHandling(uploadSingleAvatar),
  uploadPostImages   : withErrorHandling(uploadPostImages),
};
