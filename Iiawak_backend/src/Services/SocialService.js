'use strict';
const UserRepository = require('../../data-access/Repositories/UserRepository');
const AppError       = require('../../core/Exceptions/AppError');

/**
 * SocialService — Nghiệp vụ follow/unfollow và danh sách bạn bè.
 */
class SocialService {

  async toggleFollow(currentUserId, targetId) {
    if (targetId === currentUserId) {
      throw AppError.badRequest('Bạn không thể theo dõi chính mình', 'SELF_FOLLOW');
    }

    const [currentUser, targetUser] = await Promise.all([
      UserRepository.findById(currentUserId),
      UserRepository.findById(targetId),
    ]);

    if (!targetUser) throw AppError.notFound('Người dùng');

    const isFollowing = currentUser.following.includes(targetId);

    if (!isFollowing) {
      currentUser.following.push(targetId);
      targetUser.followers.push(currentUserId);
    } else {
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetId);
      targetUser.followers  = targetUser.followers.filter(id => id.toString() !== currentUserId);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);
    return { isFollowing: !isFollowing };
  }

  async getFollowing(userId) {
    const user = await UserRepository.findById(userId, 'following');
    // Populate thủ công vì Repository không trả về Mongoose doc chưa populate
    const User = require('../../data-access/Models/User.model');
    const populated = await User.findById(userId)
      .populate('following', 'displayName username avatar bio');
    return populated.following;
  }

  async getFollowers(userId) {
    const User = require('../../data-access/Models/User.model');
    const populated = await User.findById(userId)
      .populate('followers', 'displayName username avatar bio');
    return populated.followers;
  }
}

module.exports = new SocialService();
