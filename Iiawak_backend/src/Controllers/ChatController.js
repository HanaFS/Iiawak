'use strict';
const ChatService = require('../Services/ChatService');

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

  /**
   * POST /api/chat/ai/stream
   * Gửi tin nhắn và nhận phản hồi theo dạng Server-Sent Events (streaming).
   * Client đọc từng chunk text ngay khi AI trả về, không cần chờ response đầy đủ.
   */
  async sendMessageToAiStream(req, res) {
    try {
      const { characterId, content, mode } = req.body;
      if (!characterId || !content) {
        return res.status(400).json({ success: false, message: 'Thiếu characterId hoặc nội dung' });
      }
      await ChatService.sendMessageToAiStream(req.user.id, characterId, content, mode, res);
    } catch (err) {
      if (!res.headersSent) {
        const code = err.isAppError ? err.statusCode : 500;
        res.status(code).json({ success: false, message: err.message });
      }
    }
  }

  /**
   * POST /api/chat/ai/regenerate
   * Tạo lại phản hồi cuối cùng của AI (SillyTavern: Regenerate button).
   */
  async regenerateLastResponse(req, res) {
    try {
      const { characterId, mode } = req.body;
      if (!characterId) {
        return res.status(400).json({ success: false, message: 'Thiếu characterId' });
      }
      const result = await ChatService.regenerateLastResponse(req.user.id, characterId, mode);
      res.json({ success: true, data: result });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  /**
   * PATCH /api/chat/ai/message/:messageIndex
   * Sửa nội dung một tin nhắn (SillyTavern: Edit Message).
   * Tất cả tin nhắn SAU đó sẽ bị xóa.
   */
  async editMessage(req, res) {
    try {
      const { characterId, mode, newContent } = req.body;
      const messageIndex = parseInt(req.params.messageIndex, 10);
      if (!characterId || !newContent || isNaN(messageIndex)) {
        return res.status(400).json({ success: false, message: 'Thiếu dữ liệu' });
      }
      const result = await ChatService.editMessage(req.user.id, characterId, messageIndex, newContent, mode);
      res.json({ success: true, data: result });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  /**
   * DELETE /api/chat/ai/last
   * Xóa cặp tin nhắn cuối (user + assistant). SillyTavern: Delete last message.
   */
  async deleteLastExchange(req, res) {
    try {
      const { characterId, mode } = req.body;
      if (!characterId) {
        return res.status(400).json({ success: false, message: 'Thiếu characterId' });
      }
      const result = await ChatService.deleteLastExchange(req.user.id, characterId, mode);
      res.json({ success: true, data: result });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  /**
   * PATCH /api/chat/ai/memory/freeze
   * Bật/tắt Memory Freeze. SillyTavern: "Memory Frozen" toggle.
   */
  async setMemoryFrozen(req, res) {
    try {
      const { characterId, mode, frozen } = req.body;
      if (!characterId || frozen === undefined) {
        return res.status(400).json({ success: false, message: 'Thiếu characterId hoặc trạng thái frozen' });
      }
      const result = await ChatService.setMemoryFrozen(req.user.id, characterId, frozen, mode);
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
