'use strict';
const ChatService = require('../../2_BusinessLogic/Services/ChatService');

/**
 * ChatController — Gác cổng cho /api/chat/*
 */
class ChatController {

  async sendMessageToAi(req, res) {
    try {
      const { characterId, content, mode } = req.body;
      if (!characterId || !content) {
        return res.status(400).json({ success: false, message: 'Thiếu characterId hoặc nội dung' });
      }
      const result = await ChatService.sendMessageToAi(req.user.id, characterId, content, mode);
      res.json({ success: true, data: result });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async getAiSessions(req, res) {
    try {
      const sessions = await ChatService.getAiSessions(req.user.id);
      res.json({ success: true, data: sessions });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAiChatHistory(req, res) {
    try {
      const { characterId } = req.params;
      const { mode } = req.query;
      const history = await ChatService.getAiChatHistory(req.user.id, characterId, mode);
      res.json({ success: true, data: history });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getDirectConversations(req, res) {
    try {
      const conversations = await ChatService.getDirectConversations(req.user.id);
      res.json({ success: true, data: conversations });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getDirectChatHistory(req, res) {
    try {
      const messages = await ChatService.getDirectChatHistory(req.user.id, req.params.otherUserId);
      res.json({ success: true, data: messages });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new ChatController();
