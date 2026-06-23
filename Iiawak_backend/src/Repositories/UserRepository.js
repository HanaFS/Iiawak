'use strict';
const User        = require('../Models/User.model');
const Transaction = require('../Models/Transaction.model');

/**
 * UserRepository — Lớp duy nhất được phép truy vấn collection User & Transaction.
 * Không chứa bất kỳ logic nghiệp vụ nào — chỉ CRUD thuần.
 */
class UserRepository {

  // ── Tìm kiếm ──────────────────────────────────────────────────────────────

  async findById(id) {
    return User.findById(id).select('-password');
  }

  async findByIdWithSocial(id) {
    return User.findById(id)
      .select('-password')
      .populate('following', 'displayName avatar username')
      .populate('followers', 'displayName avatar username');
  }

  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findByUsername(username) {
    return User.findOne({ username });
  }

  async findByEmailOrUsername(email, username) {
    return User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
  }

  async findSuggestedFriends(excludeIds) {
    return User.find({ _id: { $nin: excludeIds }, role: 'user', status: 'active' })
      .select('displayName avatar username')
      .limit(20);
  }

  // ── Tạo mới ───────────────────────────────────────────────────────────────

  async create({ username, email, password, displayName }) {
    const user = new User({ username, email, password, displayName });
    return user.save();
  }

  // ── Cập nhật ──────────────────────────────────────────────────────────────

  async updateById(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
  }

  async saveUser(user) {
    return user.save();
  }

  /** Thêm/bỏ follow */
  async toggleFollow(targetId, followerId, isFollowing) {
    if (isFollowing) {
      await User.findByIdAndUpdate(targetId,  { $pull:  { followers: followerId } });
      await User.findByIdAndUpdate(followerId, { $pull:  { following: targetId  } });
      return false;
    } else {
      await User.findByIdAndUpdate(targetId,  { $addToSet: { followers: followerId } });
      await User.findByIdAndUpdate(followerId, { $addToSet: { following: targetId  } });
      return true;
    }
  }

  // ── Transactions ──────────────────────────────────────────────────────────

  async findTransactionsByUser(userId) {
    return Transaction.find({ userId }).sort({ createdAt: -1 }).limit(50);
  }

  async createTransaction(data) {
    const tx = new Transaction(data);
    return tx.save();
  }

  async findTransactionByTxId(txId) {
    return Transaction.findOne({ txId });
  }

  async findTransactionById(id) {
    return Transaction.findById(id);
  }

  async updateTransaction(id, updateData) {
    return Transaction.findByIdAndUpdate(id, { ...updateData, updatedAt: new Date() }, { new: true });
  }

  async findTransactions(query = {}, options = {}) {
    const { skip = 0, limit = 20 } = options;
    return Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async countTransactions(query = {}) {
    return Transaction.countDocuments(query);
  }
}

module.exports = new UserRepository();
