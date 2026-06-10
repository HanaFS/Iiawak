'use strict';
const ChatSession = require('../../3_DataAccess/Models/ChatSession.model');
const Message     = require('../../3_DataAccess/Models/Message.model');
const User        = require('../../3_DataAccess/Models/User.model');
const Character   = require('../../3_DataAccess/Models/Character.model');
const aiService   = require('./AiService');
const AppError    = require('../../4_Core/Exceptions/AppError');

/**
 * ChatService — Nghiệp vụ chat (AI sessions + Direct messages).
 */
class ChatService {

  async sendMessageToAi(userId, characterId, content, mode = 'normal') {
    // 1. Tìm hoặc tạo session
    let session = await ChatSession.findOne({ userId, characterId, mode });
    const character = await Character.findById(characterId);

    if (!character) throw AppError.notFound('Nhân vật');

    if (!session) {
      session = new ChatSession({
        userId,
        characterId,
        mode,
        messages: []
      });
    }

    // 2. Chuẩn bị System Instruction dựa trên Profile nhân vật
    const systemInstruction = `
      You are ${character.name}.
      Personality: ${character.personality}.
      Bio: ${character.bio}.
      Speaking Style: ${character.advancedSettings?.speakingStyle || 'Natural and engaging'}.
      Context: ${character.publicInfo}.
      Current Status: ${character.status}.
      Always stay in character. Keep responses concise but evocative.
    `;

    // 3. Chuyển đổi lịch sử chat sang định dạng Gemini
    // Gemini roles: 'user' and 'model' (trước đây là 'assistant')
    const history = session.messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // 4. Gọi AI
    const aiResponse = await aiService.generateResponse(systemInstruction, history, content);

    // 5. Lưu vào database
    session.messages.push({ role: 'user', content, timestamp: new Date() });
    session.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
    session.updatedAt = new Date();
    await session.save();

    // 6. Cập nhật thống kê nhân vật
    character.totalChats += 1;
    await character.save();

    return {
      session: session._id,
      response: aiResponse,
      history: session.messages.slice(-10) // Trả về 10 tin nhắn cuối
    };
  }

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
