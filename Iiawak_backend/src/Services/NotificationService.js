'use strict';
const userRepository = require('../../data-access/Repositories/UserRepository');
const emailService = require('./EmailService');
const logger = require('../../core/Logger/logger');
const AppError = require('../../core/Exceptions/AppError');

// In-memory store for user subscriptions (real-time notifications)
const userSubscriptions = new Map(); // userId -> Set of socketIds

/**
 * NotificationService — Quản lý thông báo multi-channel
 * Hỗ trợ: in-app, email, Socket.io real-time
 */
class NotificationService {
  constructor() {
    this.Notification = require('../../data-access/Models/Notification.model');
    this.notificationTypes = {
      PAYMENT: 'payment',
      FOLLOW: 'follow',
      COMMENT: 'comment',
      LIKE: 'like',
      CHARACTER_INTERACTION: 'character_interaction',
      SYSTEM: 'system',
      PROMOTION: 'promotion',
    };
  }

  /**
   * Tạo thông báo
   */
  async create(data) {
    try {
      const {
        userId,
        type = this.notificationTypes.SYSTEM,
        title,
        message,
        relatedId, // Post ID, Comment ID, etc.
        relatedType, // post, comment, follow, etc.
        actionUrl,
        sendEmail = false,
        user, // User object for email
      } = data;

      // Validate
      if (!userId || !title || !message) {
        throw AppError.badRequest('userId, title, message bắt buộc');
      }

      // Create in-app notification
      const notification = new this.Notification({
        userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        actionUrl,
        read: false,
        createdAt: new Date(),
      });

      await notification.save();
      logger.info('Notification created', { userId, type, title });

      // Send email if enabled
      if (sendEmail && user && user.email) {
        await emailService.sendEventNotificationEmail(user.email, {
          userName: user.displayName || user.username,
          title,
          description: message,
          date: new Date().toLocaleDateString('vi-VN'),
          actionUrl,
          actionText: 'Xem ngay',
        });
      }

      // Send real-time notification via Socket.io (if available)
      this.emitToUser(userId, 'notification_received', {
        id: notification._id,
        type,
        title,
        message,
        createdAt: notification.createdAt,
      });

      return notification;
    } catch (err) {
      logger.error('Notification creation failed', { error: err.message, data });
      throw err;
    }
  }

  /**
   * Tạo thông báo thanh toán thành công
   */
  async createPaymentNotification(userId, paymentData) {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('Người dùng');

    return this.create({
      userId,
      type: this.notificationTypes.PAYMENT,
      title: '💰 Nạp KCH thành công',
      message: `Bạn đã nạp ${paymentData.amountKch} KCH + ${paymentData.bonus} Bonus`,
      actionUrl: '/account/transactions',
      sendEmail: true,
      user,
    });
  }

  /**
   * Tạo thông báo follow
   */
  async createFollowNotification(userId, followerId) {
    const follower = await userRepository.findById(followerId);
    if (!follower) throw AppError.notFound('Người dùng');

    return this.create({
      userId,
      type: this.notificationTypes.FOLLOW,
      title: `👥 ${follower.displayName} đang follow bạn`,
      message: `${follower.displayName} (@${follower.username}) vừa follow bạn`,
      relatedId: followerId,
      relatedType: 'user',
      actionUrl: `/profile/${followerId}`,
    });
  }

  /**
   * Tạo thông báo comment
   */
  async createCommentNotification(userId, postId, commenterData) {
    return this.create({
      userId,
      type: this.notificationTypes.COMMENT,
      title: `💬 ${commenterData.displayName} đã comment bài viết của bạn`,
      message: commenterData.commentPreview || 'Xem comment...',
      relatedId: postId,
      relatedType: 'post',
      actionUrl: `/post/${postId}`,
    });
  }

  /**
   * Tạo thông báo like/fire
   */
  async createLikeNotification(userId, postId, likerData) {
    return this.create({
      userId,
      type: this.notificationTypes.LIKE,
      title: `🔥 ${likerData.displayName} đã like bài viết của bạn`,
      message: 'Bài viết của bạn được yêu thích!',
      relatedId: postId,
      relatedType: 'post',
      actionUrl: `/post/${postId}`,
    });
  }

  /**
   * Tạo thông báo tương tác character
   */
  async createCharacterInteractionNotification(userId, characterId, interactionData) {
    return this.create({
      userId,
      type: this.notificationTypes.CHARACTER_INTERACTION,
      title: `🎭 ${interactionData.title}`,
      message: interactionData.message,
      relatedId: characterId,
      relatedType: 'character',
      actionUrl: `/character/${characterId}`,
    });
  }

  /**
   * Tạo thông báo khuyến mãi
   */
  async createPromotionNotification(userId, promotionData) {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('Người dùng');

    return this.create({
      userId,
      type: this.notificationTypes.PROMOTION,
      title: `🎁 ${promotionData.title}`,
      message: promotionData.message,
      actionUrl: promotionData.actionUrl || '/packages',
      sendEmail: true,
      user,
    });
  }

  /**
   * Lấy danh sách thông báo của user
   */
  async getUserNotifications(userId, options = {}) {
    const {
      skip = 0,
      limit = 20,
      read = null, // null = all, true = read only, false = unread only
      type = null,
    } = options;

    const query = { userId };
    if (read !== null) query.read = read;
    if (type) query.type = type;

    const notifications = await this.Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.Notification.countDocuments(query);
    const unreadCount = await this.Notification.countDocuments({ userId, read: false });

    return {
      notifications,
      total,
      unreadCount,
      page: Math.floor(skip / limit) + 1,
      pageSize: limit,
    };
  }

  /**
   * Đánh dấu thông báo là đã đọc
   */
  async markAsRead(notificationId) {
    return this.Notification.findByIdAndUpdate(
      notificationId,
      { read: true, readAt: new Date() },
      { new: true }
    );
  }

  /**
   * Đánh dấu tất cả thông báo của user là đã đọc
   */
  async markAllAsRead(userId) {
    const result = await this.Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );
    logger.info('Marked all notifications as read', { userId, count: result.modifiedCount });
    return result;
  }

  /**
   * Xóa thông báo
   */
  async delete(notificationId) {
    return this.Notification.findByIdAndDelete(notificationId);
  }

  /**
   * Xóa tất cả thông báo của user
   */
  async deleteAll(userId) {
    const result = await this.Notification.deleteMany({ userId });
    logger.info('Deleted all notifications', { userId, count: result.deletedCount });
    return result;
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('Người dùng');

    return {
      emailNotifications: user.preferences?.emailNotifications ?? true,
      pushNotifications: user.preferences?.pushNotifications ?? true,
      inAppNotifications: user.preferences?.inAppNotifications ?? true,
    };
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId, preferences) {
    return userRepository.updateById(userId, {
      'preferences.emailNotifications': preferences.emailNotifications ?? true,
      'preferences.pushNotifications': preferences.pushNotifications ?? true,
      'preferences.inAppNotifications': preferences.inAppNotifications ?? true,
    });
  }

  // ── Socket.io Integration ──────────────────────────────────────────────────

  /**
   * Register user subscription for real-time notifications
   */
  registerUserSubscription(userId, socketId) {
    if (!userSubscriptions.has(userId)) {
      userSubscriptions.set(userId, new Set());
    }
    userSubscriptions.get(userId).add(socketId);
    logger.debug('User subscription registered', { userId, socketId });
  }

  /**
   * Unregister user subscription
   */
  unregisterUserSubscription(userId, socketId) {
    if (userSubscriptions.has(userId)) {
      userSubscriptions.get(userId).delete(socketId);
      if (userSubscriptions.get(userId).size === 0) {
        userSubscriptions.delete(userId);
      }
      logger.debug('User subscription unregistered', { userId, socketId });
    }
  }

  /**
   * Emit notification to specific user via Socket.io
   * @param {string} userId
   * @param {string} event
   * @param {object} data
   * @param {object} io - Socket.io instance (passed from server)
   */
  emitToUser(userId, event, data, io = null) {
    const socketIds = userSubscriptions.get(userId);
    if (socketIds && socketIds.size > 0 && io) {
      socketIds.forEach(socketId => {
        io.to(socketId).emit(event, data);
      });
      logger.debug('Notification emitted to user', { userId, event, socketCount: socketIds.size });
    }
  }

  /**
   * Broadcast to all connected users
   */
  broadcastToAll(event, data, io = null) {
    if (io) {
      io.emit(event, data);
      logger.info('Notification broadcasted to all', { event });
    }
  }
}

module.exports = new NotificationService();
