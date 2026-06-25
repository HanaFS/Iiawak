'use strict';

/**
 * user.dto.js — DTOs cho User endpoints.
 */
const UserDTO = {

  validateUpdateProfile({ displayName, username, bio, avatar }) {
    const errors = [];
    if (displayName !== undefined && displayName.trim().length < 2)
      errors.push('Tên hiển thị phải có ít nhất 2 ký tự');
    if (username !== undefined && username.trim().length < 3)
      errors.push('Tên người dùng phải có ít nhất 3 ký tự');
    if (bio !== undefined && bio.length > 500)
      errors.push('Bio tối đa 500 ký tự');
    return { valid: errors.length === 0, errors };
  },

  validateChangePassword({ oldPassword, newPassword }) {
    const errors = [];
    if (!oldPassword)               errors.push('Mật khẩu cũ không được trống');
    if (!newPassword || newPassword.length < 6) errors.push('Mật khẩu mới phải có ít nhất 6 ký tự');
    return { valid: errors.length === 0, errors };
  },

  /** Response đầy đủ (cho chủ tài khoản xem) */
  toUserResponse(user) {
    return {
      id:            user._id,
      username:      user.username,
      email:         user.email,
      displayName:   user.displayName,
      avatar:        user.avatar,
      bio:           user.bio,
      kchBalance:    user.kchBalance,
      role:          user.role,
      status:        user.status,
      isCreator:     user.isCreator,
      checkedInDays: user.checkedInDays,
      following:     user.following,
      followers:     user.followers,
      strikeCount:   user.strikeCount || 0,
      createdAt:     user.createdAt,
    };
  },

  /** Response công khai (cho người khác xem) */
  toUserPublicResponse(user) {
    return {
      id:          user._id,
      username:    user.username,
      displayName: user.displayName,
      avatar:      user.avatar,
      bio:         user.bio,
      following:   user.following?.length ?? 0,
      followers:   user.followers?.length ?? 0,
    };
  },
};

module.exports = UserDTO;
