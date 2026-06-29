'use strict';
const UserRepository      = require('../Repositories/UserRepository');
const CharacterRepository = require('../Repositories/CharacterRepository');
const CommunityRepository = require('../Repositories/CommunityRepository');
const EconomyRepository   = require('../Repositories/EconomyRepository');
const User         = require('../Models/User.model');
const Character    = require('../Models/Character.model');
const Post         = require('../Models/Post.model');
const Transaction  = require('../Models/Transaction.model');
const StrikeRecord = require('../Models/StrikeRecord.model');
const AppError     = require('../Exceptions/AppError');

/**
 * AdminService — Nghiệp vụ quản trị hệ thống.
 * Tất cả thao tác DB đều đi qua Repository.
 */
class AdminService {

  async getDashboardStats() {
    const [totalUsers, totalChars, totalPosts, bannedUsers, totalKch] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Character.countDocuments({ isBanned: false }),
      Post.countDocuments(),
      User.countDocuments({ status: 'banned' }),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$kchBalance' } } }]),
    ]);
    return {
      totalUsers,
      totalChars,
      totalPosts,
      bannedUsers,
      totalKchInSystem: totalKch[0]?.total || 0,
    };
  }

  async getUsers(search, status, page = 1, limit = 20) {
    const filter = { role: 'user' };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { username:    { $regex: search, $options: 'i' } },
        { email:       { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(filter);
    return { users, total, page: Number(page) };
  }

  async getUserDetail(id) {
    const user = await User.findById(id).select('-password');
    if (!user) throw AppError.notFound('Người dùng');
    const strikes = await StrikeRecord.find({ userId: id });
    return { ...user.toObject(), strikes };
  }

  async takeActionOnUser(id, action, reason, adminId) {
    const user = await User.findById(id);
    if (!user) throw AppError.notFound('Người dùng');

    if (action === 'ban') {
      user.status = 'banned';
      await new StrikeRecord({ userId: user._id, adminId, reason, severity: 'ban' }).save();
    } else if (action === 'unban') {
      user.status = 'active';
    } else if (action === 'warn') {
      user.strikeCount += 1;
      await new StrikeRecord({ userId: user._id, adminId, reason, severity: 'warning' }).save();
      if (user.strikeCount >= 3) user.status = 'banned';
    } else if (action === 'reset_strikes') {
      user.strikeCount = 0;
      user.status = 'active'; // optional: unban when resetting strikes
      await StrikeRecord.deleteMany({ userId: user._id });
    } else if (action === 'update_username') {
      if (reason) user.username = reason; // reusing 'reason' for the new username
    } else if (action === 'delete') {
      await user.deleteOne();
      return null;
    }
    await user.save();
    return user;
  }

  async adjustUserKch(id, amount) {
    const user = await User.findById(id);
    if (!user) throw AppError.notFound('Người dùng');
    user.kchBalance = Math.max(0, user.kchBalance + Number(amount));
    await user.save();
    await new Transaction({
      txId     : `ADM-${Date.now()}`,
      userId   : user._id,
      amountKch: Number(amount),
      type     : 'REWARD',
      status   : 'success',
    }).save();
    return user;
  }

  async getCharacters() {
    return Character.find()
      .populate('creatorId', 'displayName username')
      .sort({ createdAt: -1 });
  }

  async updateCharacter(id, updateData) {
    return Character.findByIdAndUpdate(id, updateData, { new: true });
  }

  async banCharacter(id) {
    await Character.findByIdAndUpdate(id, { isBanned: true });
  }

  async getPosts() {
    return Post.find()
      .populate('authorId', 'displayName username')
      .sort({ createdAt: -1 });
  }

  async deletePost(id) {
    await Post.findByIdAndDelete(id);
  }
}

module.exports = new AdminService();
