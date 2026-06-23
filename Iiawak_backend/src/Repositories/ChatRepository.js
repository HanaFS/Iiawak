'use strict';
const ChatSession = require('../Models/ChatSession.model');

/**
 * ChatRepository — Tất cả Mongoose queries cho ChatSession collection.
 */
class ChatRepository {

  async findSession(userId, characterId, mode) {
    return ChatSession.findOne({ userId, characterId, mode });
  }

  async createSession(userId, characterId, mode) {
    const session = new ChatSession({ userId, characterId, mode, messages: [] });
    return session.save();
  }

  async findOrCreateSession(userId, characterId, mode) {
    let session = await this.findSession(userId, characterId, mode);
    if (!session) {
      session = await this.createSession(userId, characterId, mode);
    }
    return session;
  }

  async saveSession(session) {
    session.updatedAt = new Date();
    return session.save();
  }

  async getHistoryByUser(userId) {
    return ChatSession.find({ userId })
      .populate('characterId', 'name avatar')
      .sort({ updatedAt: -1 })
      .limit(20);
  }

  async clearSession(userId, characterId, mode) {
    return ChatSession.findOneAndUpdate(
      { userId, characterId, mode },
      { $set: { messages: [], updatedAt: new Date() } },
      { new: true }
    );
  }
}

module.exports = new ChatRepository();
