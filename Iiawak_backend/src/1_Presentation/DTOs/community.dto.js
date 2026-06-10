'use strict';

/**
 * community.dto.js — DTOs cho Community (Post, Comment) endpoints.
 */
const CommunityDTO = {

  validateCreatePost({ content }) {
    const errors = [];
    if (!content || !content.trim()) errors.push('Nội dung bài đăng không được trống');
    if (content && content.length > 2000) errors.push('Nội dung tối đa 2000 ký tự');
    return { valid: errors.length === 0, errors };
  },

  validateCreateComment({ content }) {
    const errors = [];
    if (!content || !content.trim()) errors.push('Bình luận không được trống');
    if (content && content.length > 500) errors.push('Bình luận tối đa 500 ký tự');
    return { valid: errors.length === 0, errors };
  },

  toPostResponse(post, currentUserId) {
    return {
      id:           post._id,
      authorId:     post.authorId?._id  || post.authorId,
      authorName:   post.authorId?.displayName || 'Iiawak User',
      authorAvatar: post.authorId?.avatar || '',
      content:      post.content,
      images:       post.images || [],
      characterTag: post.characterTag ? {
        id:     post.characterTag._id,
        name:   post.characterTag.name,
        avatar: post.characterTag.avatar,
      } : null,
      fireCount:    post.fireCount,
      commentCount: post.commentCount,
      firedByMe:    post.firedByMe || false,
      createdAt:    post.createdAt,
    };
  },

  toCommentResponse(comment) {
    return {
      id:           comment._id,
      authorId:     comment.authorId?._id   || comment.authorId,
      authorName:   comment.authorId?.displayName || 'Iiawak User',
      authorAvatar: comment.authorId?.avatar || '',
      content:      comment.content,
      createdAt:    comment.createdAt,
    };
  },
};

module.exports = CommunityDTO;
