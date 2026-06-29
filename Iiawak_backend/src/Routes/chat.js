'use strict';
const express = require('express');
const router = express.Router();
const chatController = require('../Controllers/ChatController');
const { verifyToken } = require('../Middlewares/auth.middleware');

router.use(verifyToken);
router.post('/ai/send', chatController.sendMessageToAi);
router.post('/ai/send/stream', chatController.sendMessageToAiStream);
router.post('/ai/regenerate', chatController.regenerateLastResponse);
router.put('/ai/edit', chatController.editMessage);
router.delete('/ai/delete-exchange', chatController.deleteLastExchange);
router.post('/ai/freeze-memory', chatController.setMemoryFrozen);
router.get('/ai/sessions', chatController.getAiSessions);
router.get('/ai/history/:sessionId', chatController.getAiChatHistory);
router.get('/direct/conversations', chatController.getDirectConversations);
router.get('/direct/history/:userId', chatController.getDirectChatHistory);

module.exports = router;
