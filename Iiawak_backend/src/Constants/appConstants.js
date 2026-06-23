'use strict';

/**
 * appConstants.js — Hằng số và Enum toàn hệ thống.
 * Import từ đây thay vì dùng magic strings.
 */

const UserRole = Object.freeze({
  USER  : 'user',
  ADMIN : 'admin',
});

const UserStatus = Object.freeze({
  ACTIVE : 'active',
  BANNED : 'banned',
});

const CharacterPrivacy = Object.freeze({
  PUBLIC  : 'public',
  PRIVATE : 'private',
});

const AgeRating = Object.freeze({
  ALL   : 'all',
  ADULT : 'adult',
});

const ChatMode = Object.freeze({
  NORMAL : 'normal',
  STORY  : 'story',
  BOTH   : 'both',
});

const TransactionType = Object.freeze({
  TOPUP    : 'TOPUP',
  GIFTCODE : 'GIFTCODE',
  SPEND    : 'SPEND',
  REWARD   : 'REWARD',
});

const TransactionStatus = Object.freeze({
  PENDING  : 'pending',
  SUCCESS  : 'success',
  FAILED   : 'failed',
  REFUNDED : 'refunded',
});

const FeedSort = Object.freeze({
  VIRAL     : 'viral',
  FOLLOWING : 'following',
  LATEST    : 'latest',
});

/** JWT expiry */
const JWT_EXPIRES_IN = '7d';

/** Số tin nhắn tối đa giữ lại trong một ChatSession */
const CHAT_SESSION_MAX_MESSAGES = 50;

/** Gemini AI model đang dùng */
const GEMINI_MODEL = 'gemini-1.5-flash-latest';

module.exports = {
  UserRole,
  UserStatus,
  CharacterPrivacy,
  AgeRating,
  ChatMode,
  TransactionType,
  TransactionStatus,
  FeedSort,
  JWT_EXPIRES_IN,
  CHAT_SESSION_MAX_MESSAGES,
  GEMINI_MODEL,
};
