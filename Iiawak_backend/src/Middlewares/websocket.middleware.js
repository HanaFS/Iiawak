/**
 * WebSocket JWT Authentication Middleware
 * Validates JWT tokens on Socket.io connections
 * Manages user sessions and connection recovery
 */

const jwt = require('jsonwebtoken');
const logger = require('../Logger/logger');

class WebSocketManager {
  constructor() {
    this.userSessions = new Map(); // userId -> { socketId, connectedAt, isOnline }
    this.messageQueue = new Map(); // userId -> [messages]
    this.typingIndicators = new Map(); // userId -> { typingInRoom, lastTypedAt }
  }

  /**
   * Middleware: Authenticate Socket.io connection with JWT
   */
  authenticateSocket(socket, next) {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn(`[WebSocket] Connection attempt without token: ${socket.id}`);
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      logger.info(`[WebSocket] User authenticated: ${socket.userId} (socket: ${socket.id})`);
      next();
    } catch (error) {
      logger.warn(`[WebSocket] Invalid token: ${error.message}`);
      next(new Error('Authentication error: Invalid token'));
    }
  }

  /**
   * Handle user connection
   */
  handleUserConnect(socket, io) {
    const userId = socket.userId;

    // Update user session
    this.userSessions.set(userId, {
      socketId: socket.id,
      connectedAt: new Date(),
      isOnline: true,
    });

    // Process queued messages
    this.processMessageQueue(socket, userId);

    // Emit online status to other users
    io.emit('user:online', { userId, socketId: socket.id, timestamp: new Date() });

    logger.info(`[WebSocket] User connected: ${userId}`);
  }

  /**
   * Handle user disconnect (with 30-second grace period for reconnection)
   */
  handleUserDisconnect(socket, io) {
    const userId = socket.userId;
    const session = this.userSessions.get(userId);

    if (!session) return;

    // Mark as offline but keep session for 30 seconds (allow reconnection)
    session.isOnline = false;
    session.disconnectedAt = new Date();

    // Clean up after 30 seconds
    setTimeout(() => {
      const currentSession = this.userSessions.get(userId);
      if (currentSession && !currentSession.isOnline) {
        this.userSessions.delete(userId);
        this.typingIndicators.delete(userId);
        io.emit('user:offline', { userId, timestamp: new Date() });
        logger.info(`[WebSocket] User session closed: ${userId}`);
      }
    }, 30000);

    logger.info(`[WebSocket] User disconnected: ${userId} (reconnection window: 30s)`);
  }

  /**
   * Reconnection handler - restore user session
   */
  handleReconnect(socket, io) {
    const userId = socket.userId;
    const oldSession = this.userSessions.get(userId);

    if (oldSession && !oldSession.isOnline) {
      // Restore session
      oldSession.socketId = socket.id;
      oldSession.isOnline = true;
      oldSession.reconnectedAt = new Date();

      // Process queued messages
      this.processMessageQueue(socket, userId);

      // Notify others of re-connection
      io.emit('user:online', { userId, socketId: socket.id, timestamp: new Date() });
      logger.info(`[WebSocket] User reconnected: ${userId}`);
    }
  }

  /**
   * Queue message for offline users
   */
  queueMessage(userId, message) {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, []);
    }
    this.messageQueue.get(userId).push({
      ...message,
      queuedAt: new Date(),
    });

    // Keep only last 100 messages per user
    const queue = this.messageQueue.get(userId);
    if (queue.length > 100) {
      this.messageQueue.set(userId, queue.slice(-100));
    }
  }

  /**
   * Process queued messages when user reconnects
   */
  processMessageQueue(socket, userId) {
    const queue = this.messageQueue.get(userId);
    if (!queue || queue.length === 0) return;

    socket.emit('messages:queued', {
      count: queue.length,
      messages: queue,
    });

    logger.info(`[WebSocket] Delivered ${queue.length} queued messages to ${userId}`);
    this.messageQueue.delete(userId);
  }

  /**
   * Throttled typing indicator (prevent spam: max 1 per 2 seconds)
   */
  handleTypingIndicator(socket, io, data) {
    const userId = socket.userId;
    const now = Date.now();

    if (!this.typingIndicators.has(userId)) {
      this.typingIndicators.set(userId, {});
    }

    const userTyping = this.typingIndicators.get(userId);

    if (userTyping[data.chatSessionId] && now - userTyping[data.chatSessionId] < 2000) {
      return; // Throttle: reject if last typing indicator was < 2 seconds ago
    }

    userTyping[data.chatSessionId] = now;

    // Broadcast typing indicator
    socket.to(data.chatSessionId).emit('user:typing', {
      userId,
      username: socket.username,
      chatSessionId: data.chatSessionId,
      timestamp: new Date(),
    });

    logger.debug(`[WebSocket] Typing indicator: ${socket.username} in ${data.chatSessionId}`);
  }

  /**
   * Handle stop typing
   */
  handleStopTyping(socket, io, data) {
    const userId = socket.userId;

    if (this.typingIndicators.has(userId)) {
      const userTyping = this.typingIndicators.get(userId);
      delete userTyping[data.chatSessionId];
    }

    socket.to(data.chatSessionId).emit('user:stopTyping', {
      userId,
      chatSessionId: data.chatSessionId,
    });
  }

  /**
   * Get user session info
   */
  getUserSession(userId) {
    return this.userSessions.get(userId);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    const session = this.userSessions.get(userId);
    return session && session.isOnline;
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount() {
    let count = 0;
    for (const session of this.userSessions.values()) {
      if (session.isOnline) count++;
    }
    return count;
  }

  /**
   * Broadcast to specific room with fallback queueing
   */
  broadcastToRoom(io, roomId, event, data, recipientUserIds = []) {
    io.to(roomId).emit(event, {
      ...data,
      timestamp: new Date(),
    });

    // Queue for offline users in this room
    for (const userId of recipientUserIds) {
      if (!this.isUserOnline(userId)) {
        this.queueMessage(userId, {
          event,
          data,
          room: roomId,
        });
      }
    }
  }

  /**
   * Direct message with delivery confirmation
   */
  async sendDirectMessage(io, fromUserId, toUserId, message, messageRepository) {
    const toSession = this.getUserSession(toUserId);

    if (toSession && toSession.isOnline) {
      // User is online - send real-time
      io.to(toSession.socketId).emit('message:received', {
        from: fromUserId,
        message,
        deliveredAt: new Date(),
        status: 'delivered',
      });
      logger.debug(`[WebSocket] Message delivered to ${toUserId} in real-time`);
    } else {
      // User is offline - queue message
      this.queueMessage(toUserId, {
        event: 'message:received',
        data: {
          from: fromUserId,
          message,
          status: 'queued',
        },
      });
      logger.debug(`[WebSocket] Message queued for ${toUserId}`);
    }

    // Log to database (for history)
    try {
      await messageRepository.create({
        fromUserId,
        toUserId,
        content: message,
        status: toSession?.isOnline ? 'delivered' : 'pending',
        createdAt: new Date(),
      });
    } catch (error) {
      logger.error(`[WebSocket] Failed to save message: ${error.message}`);
    }
  }

  /**
   * Emit read receipt
   */
  emitReadReceipt(io, messageId, userId, chatSessionId) {
    io.to(chatSessionId).emit('message:read', {
      messageId,
      readBy: userId,
      readAt: new Date(),
    });
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const stats = {
      totalUsers: this.userSessions.size,
      onlineUsers: 0,
      queuedMessages: 0,
      typingUsers: 0,
    };

    for (const session of this.userSessions.values()) {
      if (session.isOnline) stats.onlineUsers++;
    }

    for (const queue of this.messageQueue.values()) {
      stats.queuedMessages += queue.length;
    }

    for (const typing of this.typingIndicators.values()) {
      stats.typingUsers += Object.keys(typing).length;
    }

    return stats;
  }
}

module.exports = new WebSocketManager();
