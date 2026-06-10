'use strict';
const express         = require('express');
const router          = express.Router();
const ChatController  = require('../1_Presentation/Controllers/ChatController');
const { verifyToken } = require('../1_Presentation/Middlewares/auth.middleware');

// ─── AI CHAT (User - Character) ──────────────────────────────────────────────
router.post('/ai/send',                   verifyToken, ChatController.sendMessageToAi.bind(ChatController));
router.get('/sessions',                   verifyToken, ChatController.getAiSessions.bind(ChatController));
router.get('/sessions/:characterId',      verifyToken, ChatController.getAiChatHistory.bind(ChatController));

// ─── DIRECT MESSAGES (User - User) ───────────────────────────────────────────
router.get('/direct/conversations',       verifyToken, ChatController.getDirectConversations.bind(ChatController));
router.get('/direct/:otherUserId',        verifyToken, ChatController.getDirectChatHistory.bind(ChatController));

module.exports = router;
