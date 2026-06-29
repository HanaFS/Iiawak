'use strict';
const communityService = require('../Services/CommunityService');
const CommunityDTO     = require('../DTOs/community.dto');

/**
 * CommunityController — Gác cổng cho Community endpoints.
 */
class CommunityController {

  async getFeed(req, res) {
    try {
      const { sort = 'viral', limit = 30, skip = 0 } = req.query;
      const userId = req.user?.id || null;
      const posts  = await communityService.getFeed({ sort, limit, skip, userId });
      res.json({ success: true, data: posts.map(p => CommunityDTO.toPostResponse(p, userId)) });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async getMyPosts(req, res) {
    try {
      const { limit = 30, skip = 0 } = req.query;
      const posts = await communityService.getMyPosts(req.user.id, { limit, skip });
      res.json({ success: true, data: posts.map(p => CommunityDTO.toPostResponse(p, req.user.id)) });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async getUserPosts(req, res) {
    try {
      const { limit = 30, skip = 0 } = req.query;
      const userId = req.user?.id || null;
      const posts = await communityService.getUserPosts(userId, req.params.userId, { limit, skip });
      res.json({ success: true, data: posts.map(p => CommunityDTO.toPostResponse(p, userId)) });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async createPost(req, res) {
    const validation = CommunityDTO.validateCreatePost(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.errors.join(', ') });
    }
    try {
      const post = await communityService.createPost(req.user.id, req.body);
      res.status(201).json({ success: true, data: CommunityDTO.toPostResponse(post, req.user.id) });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async firePost(req, res) {
    try {
      const result = await communityService.firePost(req.params.id, req.user.id);
      res.json({ success: true, ...result });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async updatePost(req, res) {
    try {
      const post = await communityService.updatePost(req.params.id, req.user.id, req.body);
      res.json({ success: true, data: CommunityDTO.toPostResponse(post, req.user.id) });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async hidePost(req, res) {
    try {
      await communityService.hidePost(req.params.id, req.user.id);
      res.json({ success: true, message: 'Đã ẩn bài đăng' });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async unhidePost(req, res) {
    try {
      await communityService.unhidePost(req.params.id, req.user.id);
      res.json({ success: true, message: 'Đã bỏ ẩn bài đăng' });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async deletePost(req, res) {
    try {
      await communityService.deletePost(req.params.id, req.user.id);
      res.json({ success: true, message: 'Đã xóa bài đăng' });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async getComments(req, res) {
    try {
      const comments = await communityService.getComments(req.params.postId);
      res.json({ success: true, data: comments.map(c => CommunityDTO.toCommentResponse(c)) });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async createComment(req, res) {
    const validation = CommunityDTO.validateCreateComment(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.errors.join(', ') });
    }
    try {
      const comment = await communityService.createComment(req.params.postId, req.user.id, req.body.content);
      res.status(201).json({ success: true, data: CommunityDTO.toCommentResponse(comment) });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async deleteComment(req, res) {
    try {
      await communityService.deleteComment(req.params.postId, req.params.commentId, req.user.id);
      res.json({ success: true, message: 'Đã xóa bình luận' });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }
}

module.exports = new CommunityController();
