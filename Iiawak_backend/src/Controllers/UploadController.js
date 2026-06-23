'use strict';
const storageService = require('../../business-logic/Services/StorageService');

/**
 * UploadController — Gác cổng cho các endpoint upload file.
 *
 * Luồng chính xác (theo tài liệu PHẦN 2):
 *   Client (multipart/form-data)
 *     → upload.middleware.js  [parse binary stream → Buffer trong RAM]
 *     → UploadController      [nhận req.file / req.files]
 *     → StorageService        [upload lên Cloudinary → nhận URL]
 *     → Repository            [lưu URL vào MongoDB]
 *     → Response DTO          [trả URL về client]
 */
class UploadController {

  /**
   * PUT /api/upload/avatar
   * Upload avatar cho người dùng đang đăng nhập.
   * Request: multipart/form-data, field 'avatar', max 5MB
   */
  async uploadUserAvatar(req, res) {
    try {
      const result = await storageService.uploadUserAvatar(req.user.id, req.file);
      res.json({
        success   : true,
        message   : 'Cập nhật avatar thành công',
        avatarUrl : result.avatarUrl,
      });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  /**
   * PUT /api/upload/character/:id/avatar
   * Upload avatar cho nhân vật (chỉ creator mới được).
   */
  async uploadCharacterAvatar(req, res) {
    try {
      const result = await storageService.uploadCharacterAvatar(
        req.params.id,
        req.user.id,
        req.file
      );
      res.json({
        success   : true,
        message   : 'Cập nhật ảnh nhân vật thành công',
        avatarUrl : result.avatarUrl,
      });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/upload/post-images
   * Upload 1–5 ảnh, trả về mảng URL để đính kèm khi tạo bài đăng.
   * Client tạo bài đăng thành 2 bước:
   *   Bước 1: POST /api/upload/post-images → nhận mảng URL
   *   Bước 2: POST /api/community/posts    → gửi content + images (mảng URL)
   */
  async uploadPostImages(req, res) {
    try {
      const imageUrls = await storageService.uploadPostImages(req.files);
      res.json({
        success : true,
        message : `Đã upload ${imageUrls.length} ảnh thành công`,
        images  : imageUrls,
      });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }
}

module.exports = new UploadController();
