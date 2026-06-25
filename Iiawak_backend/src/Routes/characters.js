'use strict';
const express = require('express');
const router = express.Router();
const characterController = require('../Controllers/CharacterController');
const { verifyToken } = require('../Middlewares/auth.middleware');

router.get('/', characterController.getCharacters);
router.get('/:id', characterController.getCharacterById);

router.use(verifyToken);
router.post('/', characterController.createCharacter);
router.put('/:id', characterController.updateCharacter);

router.get('/:id/lorebooks', characterController.getLorebookEntries);
router.post('/:id/lorebooks', characterController.addLorebookEntry);
router.put('/:id/lorebooks/:entryId', characterController.updateLorebookEntry);
router.delete('/:id/lorebooks/:entryId', characterController.deleteLorebookEntry);

router.post('/:id/dialogues', characterController.addDialogueExample);
router.delete('/:id/dialogues/:dialogueId', characterController.deleteDialogueExample);
router.get('/macros/supported', characterController.getSupportedMacros);

module.exports = router;
