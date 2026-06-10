'use strict';
const ChatSession = require('../../3_DataAccess/Models/ChatSession.model');
const Message     = require('../../3_DataAccess/Models/Message.model');
const User        = require('../../3_DataAccess/Models/User.model');

/**
 * ChatService — Nghiệp vụ chat (AI sessions + Direct messages).
 */
class ChatService {

  async getAiSessions(userId) {
    return ChatSession.find({ userId })
      .populate('characterId', 'name avatar slogan')
      .sort({ updatedAt: -1 });
  }

  async getAiChatHistory(userId, characterId, mode = 'normal') {
    const session = await ChatSession.findOne({ userId, characterId, mode });
    return session ? session.messages : [];
  }

  async getDirectConversations(userId) {
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 });

    const conversations = [];
    const seen = new Set();

    for (const msg of messages) {
      if (!seen.has(msg.conversationId)) {
        seen.add(msg.conversationId);
        const otherId = msg.senderId.toString() === userId.toString()
          ? msg.receiverId.toString()
          : msg.senderId.toString();
        conversations.push({
          conversationId: msg.conversationId,
          otherId,
          lastMessage: msg.content,
          lastTime: msg.createdAt,
        });
      }
    }

    return Promise.all(
      conversations.map(async (conv) => {
        const otherUser = await User.findById(conv.otherId)
          .select('displayName username avatar');
        return { ...conv, otherUser };
      })
    );
  }

  async getDirectChatHistory(userId, otherUserId) {
    const conversationId = [userId, otherUserId].sort().join('_');
    return Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(100);
  }
}

module.exports = new ChatService();
