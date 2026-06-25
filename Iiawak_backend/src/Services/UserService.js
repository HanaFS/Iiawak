'use strict';
const userRepository = require('../Repositories/UserRepository');
const AppError       = require('../Exceptions/AppError');
const Errors         = require('../Constants/errorMessages');
const formatUtil     = require('../Utils/formatUtil');
const { TransactionType } = require('../Constants/appConstants');

/**
 * UserService — Nghiệp vụ quản lý Profile, Check-in, và Giao dịch.
 * KHÔNG query DB trực tiếp — ủy thác cho UserRepository.
 */
class UserService {

  async getProfile(userId) {
    const user = await userRepository.findByIdWithSocial(userId);
    if (!user) throw AppError.notFound('Người dùng');
    return user;
  }

  async updateProfile(userId, { displayName, username, bio, avatar }) {
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (username    !== undefined) updateData.username    = username;
    if (bio         !== undefined) updateData.bio         = bio;
    if (avatar      !== undefined) updateData.avatar      = avatar;

    const user = await userRepository.updateById(userId, updateData);
    if (!user) throw AppError.notFound('Người dùng');
    return user;
  }

  /**
   * Điểm danh hàng ngày — tặng KCH.
   * Nghiệp vụ: mỗi ngày chỉ được điểm danh 1 lần.
   */
  async checkin(userId, clientDate, reward) {
    const User = require('../Models/User.model');
    const logger = require('../Logger/logger');

    // Giới hạn phần thưởng tối đa để tránh bị lạm dụng API (max 200 KCH)
    const earnedKch = Math.min(parseInt(reward) || 50, 200);

    // Chuẩn hóa ngày về định dạng YYYY-MM-DD
    let dateStr;
    if (clientDate && typeof clientDate === 'string' && clientDate.length >= 10) {
      // Đảm bảo chỉ lấy 10 ký tự đầu (YYYY-MM-DD) kể cả khi client gửi ISO string
      dateStr = clientDate.substring(0, 10);
    } else {
      dateStr = new Date().toISOString().split('T')[0];
    }

    logger.info(`[Checkin] User ${userId} attempting checkin for date ${dateStr}`);

    // Sử dụng atomic update với điều kiện $ne (not equal) để đảm bảo tính duy nhất
    // Lưu ý: checkedInDays phải chứa chuỗi chính xác "YYYY-MM-DD"
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        checkedInDays: { $nin: [dateStr] } // Đảm bảo ngày này chưa tồn tại trong mảng
      },
      {
        $addToSet: { checkedInDays: dateStr }, // Sử $addToSet thay cho $push để double-check
        $inc: { kchBalance: earnedKch }
      },
      { new: true }
    );

    if (!updatedUser) {
      logger.warn(`[Checkin] User ${userId} already checked in for ${dateStr} or not found`);
      const rawUser = await User.findById(userId);
      if (!rawUser) throw AppError.notFound('Người dùng');

      // Nếu ngày đã tồn tại trong mảng, ném lỗi Bad Request
      throw AppError.badRequest(Errors.USER.ALREADY_CHECKED_IN, 'ALREADY_CHECKED_IN');
    }

    const rawUser = updatedUser;

    // Ghi giao dịch
    await userRepository.createTransaction({
      txId:      formatUtil.txId('CHECKIN'),
      userId:    rawUser._id,
      amountKch: earnedKch,
      type:      TransactionType.REWARD,
      status:    'success',
    });

    return { user: rawUser, earnedKch };
  }

  async getTransactions(userId) {
    return userRepository.findTransactionsByUser(userId);
  }

  async getSuggestedFriends(userId) {
    const user = await userRepository.findById(userId);
    const excluded = [...(user?.following || []), userId];
    return userRepository.findSuggestedFriends(excluded);
  }

  async changePassword(userId, oldPassword, newPassword) {
    const User    = require('../Models/User.model');
    const rawUser = await User.findById(userId);
    if (!rawUser) throw AppError.notFound('Người dùng');

    const isMatch = await rawUser.comparePassword(oldPassword);
    if (!isMatch) throw AppError.badRequest(Errors.USER.WRONG_PASSWORD, 'WRONG_PASSWORD');

    rawUser.password = newPassword; // pre-save hook sẽ hash
    await userRepository.saveUser(rawUser);
    return true;
  }

  async toggleFollow(targetId, followerId) {
    const target = await userRepository.findById(targetId);
    if (!target) throw AppError.notFound('Người dùng');

    const isFollowing = target.followers?.some(id => id.toString() === followerId.toString());
    return userRepository.toggleFollow(targetId, followerId, isFollowing);
  }
}

module.exports = new UserService();
