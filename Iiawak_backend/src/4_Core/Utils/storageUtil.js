'use strict';
const { v2: cloudinary } = require('cloudinary');

/**
 * storageUtil.js — Wrapper cho Cloudinary SDK.
 * Cấu hình qua biến môi trường, không hardcode credential.
 *
 * Biến môi trường cần thiết (.env):
 *   CLOUDINARY_CLOUD_NAME=your_cloud_name
 *   CLOUDINARY_API_KEY=your_api_key
 *   CLOUDINARY_API_SECRET=your_api_secret
 */

const config = require('../../config');

// Cấu hình Cloudinary một lần khi module được load
cloudinary.config({
  cloud_name : config.cloudinary.cloud_name,
  api_key    : config.cloudinary.api_key,
  api_secret : config.cloudinary.api_secret,
  secure     : true,
});

const storageUtil = {

  /**
   * Upload buffer nhị phân lên Cloudinary.
   * @param {Buffer}  buffer   - Dữ liệu nhị phân của file (từ multer memoryStorage)
   * @param {object}  options
   * @param {string}  options.folder      - Thư mục trên Cloudinary (VD: 'iiawak/avatars')
   * @param {string}  [options.publicId]  - ID tùy chỉnh (không có extension)
   * @param {number}  [options.width]     - Resize chiều rộng
   * @param {number}  [options.height]    - Resize chiều cao
   * @param {string}  [options.crop]      - Kiểu cắt: 'fill' | 'fit' | 'thumb'
   * @returns {Promise<{ url: string, publicId: string }>}
   */
  async upload(buffer, options = {}) {
    const { folder = 'iiawak', publicId, width, height, crop = 'fill' } = options;

    return new Promise((resolve, reject) => {
      const transformation = (width || height)
        ? [{ width, height, crop, quality: 'auto', fetch_format: 'auto' }]
        : [{ quality: 'auto', fetch_format: 'auto' }];

      const uploadOptions = {
        folder,
        transformation,
        resource_type: 'auto',
      };
      if (publicId) uploadOptions.public_id = publicId;

      // Dùng upload_stream để nhận Buffer trực tiếp (không cần ghi file tạm)
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) return reject(new Error(`Upload thất bại: ${error.message}`));
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );

      uploadStream.end(buffer);
    });
  },

  /**
   * Xóa file trên Cloudinary theo publicId (dùng khi rollback).
   * @param {string} publicId
   * @returns {Promise<void>}
   */
  async delete(publicId) {
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      // Không throw — xóa file trên cloud là best-effort, không ảnh hưởng nghiệp vụ
      console.warn('⚠️ Xóa file trên Cloudinary thất bại:', publicId, err.message);
    }
  },

  /**
   * Trích xuất publicId từ Cloudinary URL để dùng cho delete().
   * VD: 'https://res.cloudinary.com/.../iiawak/avatars/abc123.jpg' → 'iiawak/avatars/abc123'
   * @param {string} url
   * @returns {string|null}
   */
  extractPublicId(url) {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
      const parts = url.split('/upload/');
      if (parts.length < 2) return null;
      // Bỏ version (v12345/) và extension
      const withoutVersion = parts[1].replace(/^v\d+\//, '');
      return withoutVersion.replace(/\.[^.]+$/, ''); // bỏ .jpg, .png v.v.
    } catch (_) {
      return null;
    }
  },

  /** Kiểm tra Cloudinary đã được cấu hình chưa */
  isConfigured() {
    return !!(config.cloudinary.cloud_name &&
              config.cloudinary.api_key &&
              config.cloudinary.api_secret);
  },
};

module.exports = storageUtil;
