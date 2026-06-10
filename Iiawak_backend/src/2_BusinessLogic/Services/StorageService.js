'use strict';
const storageUtil  = require('../../4_Core/Utils/storageUtil');
const AppError     = require('../../4_Core/Exceptions/AppError');
const userRepository = require('../../3_DataAccess/Repositories/UserRepository');
const characterRepository = require('../../3_DataAccess/Repositories/CharacterRepository');

/**
 * StorageService — Nghiệp vụ upload file theo đúng quy trình chuẩn:
 *
 * QUY TRÌNH (PHẦN 2 trong tài liệu):
 *   1. Client gửi multipart/form-data → multer parse → Buffer trong RAM
 *   2. StorageService upload Buffer lên Cloudinary → nhận URL
 *   3. StorageService lưu URL vào DB thông qua Repository
 *   4. Nếu bước 3 thất bại → TỰ ĐỘNG XÓA file trên Cloudinary (Rollback)
 *      → Không có "tệp tin mồ côi" trên cloud
 *
 * NGUYÊN TẮC VÀNG được áp dụng:
 *   ✅ Bất đồng bộ hoàn toàn (async/await)
 *   ✅ Cơ chế Rollback thủ công thay thế Transaction cho cloud storage
 */
class StorageService {

  // ─── Cấu hình thư mục Cloudinary theo loại file ─────────────────────────

  static FOLDERS = {
    USER_AVATAR      : 'iiawak/users/avatars',
    CHARACTER_AVATAR : 'iiawak/characters/avatars',
    POST_IMAGE       : 'iiawak/community/posts',
  };

  static IMAGE_SIZES = {
    USER_AVATAR      : { width: 400, height: 400, crop: 'fill' },
    CHARACTER_AVATAR : { width: 600, height: 600, crop: 'fill' },
    POST_IMAGE       : { width: 1200, height: null, crop: 'fit' },
  };

  // ─── Validate file trước khi upload ──────────────────────────────────────

  _validateImageFile(file) {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_SIZE_MB   = 5;

    if (!file) throw AppError.badRequest('Không có file được gửi lên', 'NO_FILE');

    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw AppError.badRequest(
        `Định dạng không được hỗ trợ. Chấp nhận: JPG, PNG, WebP, GIF`,
        'INVALID_FILE_TYPE'
      );
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw AppError.badRequest(
        `File quá lớn. Tối đa ${MAX_SIZE_MB}MB`,
        'FILE_TOO_LARGE'
      );
    }
  }

  // ─── Upload Avatar người dùng ─────────────────────────────────────────────

  /**
   * Upload avatar người dùng:
   * 1. Validate file
   * 2. Upload lên Cloudinary → nhận URL
   * 3. Lưu URL vào DB (UserRepository)
   * 4. Nếu DB lỗi → rollback xóa file trên cloud
   */
  async uploadUserAvatar(userId, file) {
    this._validateImageFile(file);

    // Bước 2: Upload lên cloud
    let uploadResult = null;
    try {
      const size = StorageService.IMAGE_SIZES.USER_AVATAR;
      uploadResult = await storageUtil.upload(file.buffer, {
        folder   : StorageService.FOLDERS.USER_AVATAR,
        publicId : `user_${userId}`,
        ...size,
      });
    } catch (uploadErr) {
      throw AppError.internal(`Upload hình ảnh thất bại: ${uploadErr.message}`);
    }

    // Bước 3: Lưu URL vào DB — nếu lỗi → Rollback (xóa file trên cloud)
    try {
      const updatedUser = await userRepository.updateById(userId, { avatar: uploadResult.url });
      if (!updatedUser) throw new Error('User không tìm thấy');
      return { avatarUrl: uploadResult.url };
    } catch (dbErr) {
      // ROLLBACK: Xóa file vừa upload để tránh "tệp tin mồ côi"
      await storageUtil.delete(uploadResult.publicId);
      throw AppError.internal(`Lưu avatar thất bại, đã hoàn tác upload: ${dbErr.message}`);
    }
  }

  // ─── Upload Avatar nhân vật ───────────────────────────────────────────────

  async uploadCharacterAvatar(characterId, userId, file) {
    this._validateImageFile(file);

    // Kiểm tra quyền (nghiệp vụ — ở Service)
    const char = await characterRepository.findById(characterId);
    if (!char) throw AppError.notFound('Nhân vật');
    if (char.creatorId?._id?.toString() !== userId.toString()) {
      throw AppError.forbidden('Chỉ người tạo mới có thể đổi ảnh nhân vật');
    }

    let uploadResult = null;
    try {
      const size = StorageService.IMAGE_SIZES.CHARACTER_AVATAR;
      uploadResult = await storageUtil.upload(file.buffer, {
        folder   : StorageService.FOLDERS.CHARACTER_AVATAR,
        publicId : `char_${characterId}`,
        ...size,
      });
    } catch (uploadErr) {
      throw AppError.internal(`Upload hình ảnh nhân vật thất bại: ${uploadErr.message}`);
    }

    try {
      await characterRepository.updateById(characterId, { avatar: uploadResult.url });
      return { avatarUrl: uploadResult.url };
    } catch (dbErr) {
      // ROLLBACK
      await storageUtil.delete(uploadResult.publicId);
      throw AppError.internal(`Lưu avatar nhân vật thất bại, đã hoàn tác: ${dbErr.message}`);
    }
  }

  // ─── Upload ảnh cho bài đăng (1 hoặc nhiều) ──────────────────────────────

  /**
   * Upload nhiều ảnh cùng lúc cho một bài post.
   * Tất cả upload ASYNC song song để tăng tốc độ.
   * Nếu BẤT KỲ ảnh nào thất bại → xóa TẤT CẢ ảnh đã upload thành công (Rollback).
   * @param {Express.Multer.File[]} files
   * @returns {Promise<string[]>} Mảng URL các ảnh đã upload
   */
  async uploadPostImages(files) {
    if (!files || files.length === 0) return [];
    if (files.length > 5) {
      throw AppError.badRequest('Tối đa 5 ảnh mỗi bài đăng', 'TOO_MANY_IMAGES');
    }

    files.forEach(f => this._validateImageFile(f));

    const successfulUploads = [];

    try {
      // Upload song song (Async Parallel)
      const results = await Promise.all(
        files.map((file, idx) =>
          storageUtil.upload(file.buffer, {
            folder : StorageService.FOLDERS.POST_IMAGE,
            width  : StorageService.IMAGE_SIZES.POST_IMAGE.width,
            crop   : StorageService.IMAGE_SIZES.POST_IMAGE.crop,
          }).then(result => {
            successfulUploads.push(result.publicId);
            return result.url;
          })
        )
      );
      return results; // Mảng URL
    } catch (uploadErr) {
      // ROLLBACK: Xóa tất cả ảnh đã upload thành công
      await Promise.all(successfulUploads.map(id => storageUtil.delete(id)));
      throw AppError.internal(`Upload ảnh bài đăng thất bại, đã hoàn tác: ${uploadErr.message}`);
    }
  }
}

module.exports = new StorageService();
