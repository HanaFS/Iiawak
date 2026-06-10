'use strict';
const express            = require('express');
const router             = express.Router();
const UploadController   = require('../1_Presentation/Controllers/UploadController');
const { verifyToken }    = require('../1_Presentation/Middlewares/auth.middleware');
const { uploadSingleAvatar, uploadPostImages } = require('../1_Presentation/Middlewares/upload.middleware');

/**
 * Upload routes — Tất cả endpoints nhận multipart/form-data
 *
 * Chuỗi middleware cho từng route:
 *   verifyToken → uploadMiddleware (multer parse) → Controller
 *
 * Thứ tự middleware QUAN TRỌNG:
 *   1. verifyToken trước (không parse body nếu chưa auth)
 *   2. multer sau (parse multipart/form-data → req.file / req.files)
 *   3. Controller cuối (dùng req.file đã parse)
 */

// PUT /api/upload/avatar — Upload avatar người dùng
router.put(
  '/avatar',
  verifyToken,
  uploadSingleAvatar,
  UploadController.uploadUserAvatar.bind(UploadController)
);

// PUT /api/upload/character/:id/avatar — Upload avatar nhân vật
router.put(
  '/character/:id/avatar',
  verifyToken,
  uploadSingleAvatar,
  UploadController.uploadCharacterAvatar.bind(UploadController)
);

// POST /api/upload/post-images — Upload ảnh cho bài đăng (trả URL, không tạo post)
router.post(
  '/post-images',
  verifyToken,
  uploadPostImages,
  UploadController.uploadPostImages.bind(UploadController)
);

module.exports = router;
