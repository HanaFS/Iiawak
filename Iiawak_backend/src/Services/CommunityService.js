'use strict';
const communityRepository = require('../../data-access/Repositories/CommunityRepository');
const AppError            = require('../../core/Exceptions/AppError');
const Errors              = require('../../core/Constants/errorMessages');

/**
 * CommunityService — Nghiệp vụ bài đăng cộng đồng.
 * DB calls → CommunityRepository.
 */
class CommunityService {

  async getFeed({ sort = 'viral', limit = 30, skip = 0, userId = null }) {
    let followingIds = null;

    // Nghiệp vụ: sort "following" cần danh sách following của user
    if (sort === 'following' && userId) {
      followingIds = await communityRepository.findFollowingIds(userId);
    }

    const posts = await communityRepository.findFeed({ sort, limit, skip, followingIds });

    // Nghiệp vụ: tính firedByMe cho từng post
    if (userId) {
      posts.forEach(p => {
        p.firedByMe = p.likedBy
          ? p.likedBy.some(id => id.toString() === userId.toString())
          : false;
        delete p.likedBy; // không gửi cả mảng về client
      });
    }

    return posts;
  }

  async createPost(userId, { content, images, characterTag }) {
    if (!content || !content.trim()) {
      throw AppError.badRequest(Errors.COMMUNITY.POST_EMPTY_CONTENT, 'POST_EMPTY');
    }

    return communityRepository.createPost({
      authorId: userId,
      content:  content.trim(),
      images:   images || [],
      characterTag: characterTag || undefined,
    });
  }

  async firePost(postId, userId) {
    const post = await communityRepository.findPostById(postId);
    if (!post) throw AppError.notFound('Bài đăng');

    // Nghiệp vụ: toggle fire
    const idx    = post.likedBy.findIndex(id => id.toString() === userId.toString());
    let isFired  = false;
    if (idx === -1) {
      post.likedBy.push(userId);
      post.fireCount += 1;
      isFired = true;
    } else {
      post.likedBy.splice(idx, 1);
      post.fireCount = Math.max(0, post.fireCount - 1);
    }

    await communityRepository.savePost(post);
    return { fireCount: post.fireCount, isFired };
  }

  async deletePost(postId, userId) {
    const post = await communityRepository.findPostById(postId);
    if (!post) throw AppError.notFound('Bài đăng');

    // Nghiệp vụ: chỉ tác giả mới được xóa
    if (post.authorId.toString() !== userId.toString()) {
      throw AppError.forbidden(Errors.COMMUNITY.DELETE_UNAUTHORIZED);
    }

    await communityRepository.deletePost(postId);
    return true;
  }

  async getComments(postId) {
    return communityRepository.findComments(postId);
  }

  async createComment(postId, userId, content) {
    if (!content || !content.trim()) {
      throw AppError.badRequest(Errors.COMMUNITY.COMMENT_EMPTY, 'COMMENT_EMPTY');
    }

    const post = await communityRepository.findPostById(postId);
    if (!post) throw AppError.notFound('Bài đăng');

    const comment = await communityRepository.createComment({
      postId,
      authorId: userId,
      content:  content.trim(),
    });

    // Nghiệp vụ: tăng commentCount trên post
    post.commentCount = (post.commentCount || 0) + 1;
    await communityRepository.savePost(post);

    return comment;
  }
}

module.exports = new CommunityService();
