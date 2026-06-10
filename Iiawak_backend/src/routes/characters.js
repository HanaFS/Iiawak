'use strict';
const express          = require('express');
const router           = express.Router();
const CharacterController = require('../1_Presentation/Controllers/CharacterController');
const { verifyToken, optionalAuth } = require('../1_Presentation/Middlewares/auth.middleware');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/',      CharacterController.getCharacters.bind(CharacterController));
router.get('/:id',   CharacterController.getCharacterById.bind(CharacterController));

// ── Chat (không bắt buộc token, userId từ request body) ─────────────────────
router.post('/:id/chat',         CharacterController.chat.bind(CharacterController));
router.get('/:id/chat/history',  CharacterController.getChatHistory.bind(CharacterController));

// ── Protected ─────────────────────────────────────────────────────────────────
router.post('/',      verifyToken, CharacterController.createCharacter.bind(CharacterController));
router.put('/:id',   verifyToken, CharacterController.updateCharacter.bind(CharacterController));

module.exports = router;
