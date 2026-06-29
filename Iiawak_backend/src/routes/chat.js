'use strict';
const express         = require('express');
const router          = express.Router();
const ChatController  = require('../controllers/ChatController');
const { verifyToken } = require('../middlewares/auth.middleware');

// ─── AI CHAT: Gửi & nhận ─────────────────────────────────────────────────────
router.post('/ai/send',      verifyToken, ChatController.sendMessageToAi.bind(ChatController));
router.post('/ai/stream',    verifyToken, ChatController.sendMessageToAiStream.bind(ChatController));

// ─── AI CHAT: Điều khiển lịch sử (SillyTavern: Regenerate / Edit / Delete) ──
router.post('/ai/regenerate',              verifyToken, ChatController.regenerateLastResponse.bind(ChatController));
router.patch('/ai/message/:messageIndex',  verifyToken, ChatController.editMessage.bind(ChatController));
router.delete('/ai/last',                  verifyToken, ChatController.deleteLastExchange.bind(ChatController));

// ─── AI CHAT: Bộ nhớ (SillyTavern: Memory Freeze toggle) ────────────────────
router.patch('/ai/memory/freeze',          verifyToken, ChatController.setMemoryFrozen.bind(ChatController));

// ─── AI CHAT: Lịch sử session ────────────────────────────────────────────────
router.get('/sessions',                    verifyToken, ChatController.getAiSessions.bind(ChatController));
router.get('/sessions/:characterId',       verifyToken, ChatController.getAiChatHistory.bind(ChatController));

// ─── DIRECT MESSAGES (User - User) ───────────────────────────────────────────
router.get('/direct/conversations',        verifyToken, ChatController.getDirectConversations.bind(ChatController));
router.get('/direct/:otherUserId',         verifyToken, ChatController.getDirectChatHistory.bind(ChatController));

module.exports = router;
