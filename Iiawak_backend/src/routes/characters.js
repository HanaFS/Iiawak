'use strict';
const express             = require('express');
const router              = express.Router();
const CharacterController = require('../controllers/CharacterController');
const { verifyToken }     = require('../middlewares/auth.middleware');

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/',           CharacterController.getCharacters.bind(CharacterController));
router.get('/macros',     CharacterController.getSupportedMacros.bind(CharacterController)); // Danh sách macro hỗ trợ
router.get('/:id',        CharacterController.getCharacterById.bind(CharacterController));

// ─── Protected: CRUD Nhân vật ─────────────────────────────────────────────────
router.post('/',          verifyToken, CharacterController.createCharacter.bind(CharacterController));
router.put('/:id',        verifyToken, CharacterController.updateCharacter.bind(CharacterController));

// ─── Protected: Lorebook (World Info) — Creator only ─────────────────────────
// Tương đương World Info management panel trong SillyTavern
router.get('/:id/lorebook',                    verifyToken, CharacterController.getLorebookEntries.bind(CharacterController));
router.post('/:id/lorebook',                   verifyToken, CharacterController.addLorebookEntry.bind(CharacterController));
router.patch('/:id/lorebook/:entryId',         verifyToken, CharacterController.updateLorebookEntry.bind(CharacterController));
router.delete('/:id/lorebook/:entryId',        verifyToken, CharacterController.deleteLorebookEntry.bind(CharacterController));

// ─── Protected: Dialogue Examples — Creator only ──────────────────────────────
// Tương đương Example Dialogue section trong SillyTavern Character Card V2
router.post('/:id/dialogue-examples',          verifyToken, CharacterController.addDialogueExample.bind(CharacterController));
router.delete('/:id/dialogue-examples/:index', verifyToken, CharacterController.deleteDialogueExample.bind(CharacterController));

module.exports = router;
