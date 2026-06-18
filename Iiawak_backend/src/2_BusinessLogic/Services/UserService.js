'use strict';
const userRepository = require('../../3_DataAccess/Repositories/UserRepository');
const AppError       = require('../../4_Core/Exceptions/AppError');
const Errors         = require('../../4_Core/Constants/errorMessages');
const formatUtil     = require('../../4_Core/Utils/formatUtil');
const { TransactionType } = require('../../4_Core/Constants/appConstants');

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

  async updateProfile(userId, { displayName, bio, avatar }) {
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
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
  async checkin(userId, date, reward) {
    const User = require('../../3_DataAccess/Models/User.model');
    const earnedKch = parseInt(reward) || 50;

    // Sử dụng atomic update để đảm bảo vừa thêm ngày vừa cộng tiền, tránh lưu đè hoặc Mongoose không nhận ra mảng thay đổi
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, checkedInDays: { $ne: date } },
      {
        $push: { checkedInDays: date },
        $inc: { kchBalance: earnedKch }
      },
      { new: true }
    );

    if (!updatedUser) {
      // Nếu null, tức là user không tồn tại hoặc đã điểm danh ngày này rồi
      const rawUser = await User.findById(userId);
      if (!rawUser) throw AppError.notFound('Người dùng');
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
    const User    = require('../../3_DataAccess/Models/User.model');
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
