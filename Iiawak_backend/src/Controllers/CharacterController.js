'use strict';
const characterService = require('../Services/CharacterService');

/**
 * CharacterController — Gác cổng cho Character endpoints.
 */
class CharacterController {

  // ─── CRUD Nhân vật ─────────────────────────────────────────────────────────

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

  // ─── Lorebook (World Info) ─────────────────────────────────────────────────

  /**
   * GET /api/characters/:id/lorebook
   * Lấy toàn bộ Lorebook entries (chỉ creator).
   */
  async getLorebookEntries(req, res) {
    try {
      const entries = await characterService.getLorebookEntries(req.params.id, req.user.id);
      res.json({ success: true, data: entries });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/characters/:id/lorebook
   * Thêm một Lorebook entry mới.
   * Body: { keys: ['từ khóa 1', 'từ khóa 2'], content: '...', position: 'before_char', priority: 0 }
   */
  async addLorebookEntry(req, res) {
    try {
      const entry = await characterService.addLorebookEntry(req.params.id, req.user.id, req.body);
      res.status(201).json({ success: true, data: entry });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  /**
   * PATCH /api/characters/:id/lorebook/:entryId
   * Cập nhật một Lorebook entry.
   */
  async updateLorebookEntry(req, res) {
    try {
      const entry = await characterService.updateLorebookEntry(
        req.params.id, req.user.id, req.params.entryId, req.body
      );
      res.json({ success: true, data: entry });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  /**
   * DELETE /api/characters/:id/lorebook/:entryId
   * Xóa một Lorebook entry.
   */
  async deleteLorebookEntry(req, res) {
    try {
      await characterService.deleteLorebookEntry(req.params.id, req.user.id, req.params.entryId);
      res.json({ success: true, message: 'Đã xóa Lorebook entry' });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  // ─── Dialogue Examples ─────────────────────────────────────────────────────

  /**
   * POST /api/characters/:id/dialogue-examples
   * Thêm một dialogue example (few-shot) vào Character Card.
   * Body: { user: 'Xin chào!', assistant: 'Chào ngươi, lữ khách!' }
   */
  async addDialogueExample(req, res) {
    try {
      const example = await characterService.addDialogueExample(req.params.id, req.user.id, req.body);
      res.status(201).json({ success: true, data: example });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  /**
   * DELETE /api/characters/:id/dialogue-examples/:index
   * Xóa một dialogue example theo index (0-based).
   */
  async deleteDialogueExample(req, res) {
    try {
      const index = parseInt(req.params.index, 10);
      await characterService.deleteDialogueExample(req.params.id, req.user.id, index);
      res.json({ success: true, message: 'Đã xóa dialogue example' });
    } catch (err) {
      const code = err.isAppError ? err.statusCode : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  // ─── Tiện ích ──────────────────────────────────────────────────────────────

  /**
   * GET /api/characters/macros
   * Trả về danh sách macro hợp lệ để hiển thị gợi ý trong editor.
   */
  async getSupportedMacros(req, res) {
    try {
      const macros = characterService.getSupportedMacros();
      res.json({ success: true, data: macros });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new CharacterController();
