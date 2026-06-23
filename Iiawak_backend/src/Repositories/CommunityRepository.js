'use strict';
const Post    = require('../Models/Post.model');
const Comment = require('../Models/Comment.model');
const User    = require('../Models/User.model');

/**
 * CommunityRepository — Tất cả Mongoose queries cho Post & Comment collections.
 */
class CommunityRepository {

  // ── Posts ─────────────────────────────────────────────────────────────────

  async findFeed({ sort = 'viral', limit = 30, skip = 0, followingIds = null }) {
    let query      = {};
    let sortOption = { fireCount: -1, createdAt: -1 };

    if (sort === 'latest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'following' && followingIds) {
      query      = { authorId: { $in: followingIds } };
      sortOption = { createdAt: -1 };
    }

    return Post.find(query)
      .populate('authorId',   'displayName username avatar')
      .populate('characterTag', 'name avatar _id')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
  }

  async findPostById(id) {
    return Post.findById(id);
  }

  async createPost(data) {
    const post = new Post(data);
    await post.save();
    return post
      .populate('authorId',   'displayName username avatar')
      .then(p => p.populate('characterTag', 'name avatar _id'));
  }

  async savePost(post) {
    return post.save();
  }

  async deletePost(id) {
    return Post.findByIdAndDelete(id);
  }

  // ── Comments ──────────────────────────────────────────────────────────────

  async findComments(postId) {
    return Comment.find({ postId })
      .populate('authorId', 'displayName username avatar')
      .sort({ createdAt: -1 });
  }

  async createComment(data) {
    const comment = new Comment(data);
    await comment.save();
    return comment.populate('authorId', 'displayName username avatar');
  }

  // ── Social helpers ────────────────────────────────────────────────────────

  async findFollowingIds(userId) {
    const user = await User.findById(userId).select('following');
    return user ? user.following : [];
  }
}

module.exports = new CommunityRepository();
