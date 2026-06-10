'use strict';
const characterService = require('../../2_BusinessLogic/Services/CharacterService');

/**
 * CharacterController — Gác cổng cho Character endpoints.
 */
class CharacterController {

  async getCharacters(req, res) {
    try {
      const characters = await characterService.getCharacters(req.query);
      res.json({ success: true, data: characters });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getCharacterById(req, res) {
    try {
      const char = await characterService.getCharacterById(req.params.id);
      res.json({ success: true, data: char });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async createCharacter(req, res) {
    try {
      const char = await characterService.createCharacter(req.user.id, req.body);
      res.status(201).json({ success: true, data: char });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async updateCharacter(req, res) {
    try {
      const char = await characterService.updateCharacter(req.params.id, req.user.id, req.body);
      res.json({ success: true, data: char });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async chat(req, res) {
    try {
      const { message, mode = 'normal', userId } = req.body;
      const result = await characterService.chat(req.params.id, userId || req.user?.id, message, mode);
      res.json({ success: true, data: result });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  async getChatHistory(req, res) {
    try {
      const { userId, mode = 'normal' } = req.query;
      const messages = await characterService.getChatHistory(req.params.id, userId, mode);
      res.json({ success: true, data: messages });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new CharacterController();
