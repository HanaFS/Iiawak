'use strict';
const characterRepository = require('../../data-access/Repositories/CharacterRepository');
const AppError            = require('../../core/Exceptions/AppError');
const Errors              = require('../../core/Constants/errorMessages');
const macroService        = require('./MacroService');

/**
 * CharacterService — Nghiệp vụ quản lý Nhân vật.
 *
 * Lưu ý kiến trúc:
 *   - Toàn bộ logic Chat AI đã được chuyển sang ChatService + AiService pipeline.
 *   - CharacterService chỉ lo CRUD nhân vật và quản lý các cài đặt nâng cao
 *     (Lorebook, Author's Note, Dialogue Examples, System Prompt Template).
 */
class CharacterService {

  // ─── CRUD Nhân vật ────────────────────────────────────────────────────────

  /**
   * Tạo nhân vật mới.
   * Hỗ trợ đầy đủ các fields SillyTavern-inspired:
   *   - systemPromptTemplate: Template với macro {{user}}, {{char}}...
   *   - dialogueExamples:     Few-shot examples để định hình văn phong
   *   - authorNote:           Lệnh cố định inject vào history
   *   - lorebook:             World Info entries (keyword → context)
   */
  async createCharacter(userId, data) {
    const {
      name, avatar, gender, tags, slogan, creatorNotes, privacy, ageRating,
      publicInfo, personality, openingLine, bio, firstMessage, status, chatMode,
      advancedSettings,
      // ── Fields mới (SillyTavern-inspired) ──
      systemPromptTemplate,
      dialogueExamples,
      authorNote,
      authorNoteDepth,
      lorebook,
      lorebookScanDepth,
    } = data;

    if (!name || !avatar || !gender || !slogan || !privacy || !ageRating ||
        !publicInfo || !personality || !openingLine || !bio || !firstMessage || !status) {
      throw AppError.badRequest(Errors.CHARACTER.REQUIRED_FIELDS, 'MISSING_FIELDS');
    }

    // Validate macro trong systemPromptTemplate (nếu có)
    if (systemPromptTemplate) {
      const validation = macroService.validateMacros(systemPromptTemplate);
      if (!validation.valid) {
        throw AppError.badRequest(
          `System Prompt chứa macro không hợp lệ: ${validation.unknownMacros.join(', ')}. ` +
          `Macro hợp lệ: ${validation.supportedMacros.slice(0, 8).join(', ')}...`,
          'INVALID_MACROS'
        );
      }
    }

    const tagsArr = Array.isArray(tags)
      ? tags
      : (tags ? tags.split(',').map(t => t.trim()) : []);

    return characterRepository.create({
      name, avatar, gender, tags: tagsArr, slogan, creatorNotes, privacy, ageRating,
      publicInfo, personality, openingLine, bio, firstMessage, status,
      chatMode: chatMode || 'both',
      advancedSettings,
      // ── SillyTavern fields ──
      systemPromptTemplate: systemPromptTemplate || '',
      dialogueExamples:     dialogueExamples     || [],
      authorNote:           authorNote           || '',
      authorNoteDepth:      authorNoteDepth      || 2,
      lorebook:             lorebook             || [],
      lorebookScanDepth:    lorebookScanDepth    || 5,
      creatorId: userId,
    });
  }

  async getCharacters(filters) {
    return characterRepository.findPublic(filters);
  }

  async getCharacterById(id) {
    const char = await characterRepository.findById(id);
    if (!char) throw AppError.notFound('Nhân vật');
    return char;
  }

  async updateCharacter(id, userId, updateData) {
    const char = await characterRepository.findById(id);
    if (!char) throw AppError.notFound('Nhân vật');

    if (char.creatorId?._id?.toString() !== userId.toString()) {
      throw AppError.forbidden(Errors.CHARACTER.UNAUTHORIZED_EDIT);
    }

    // Validate macro nếu có cập nhật systemPromptTemplate
    if (updateData.systemPromptTemplate) {
      const validation = macroService.validateMacros(updateData.systemPromptTemplate);
      if (!validation.valid) {
        throw AppError.badRequest(
          `System Prompt chứa macro không hợp lệ: ${validation.unknownMacros.join(', ')}`,
          'INVALID_MACROS'
        );
      }
    }

    return characterRepository.updateById(id, updateData);
  }

  async banCharacter(id) {
    await characterRepository.banById(id);
    return true;
  }

  async unbanCharacter(id) {
    await characterRepository.unbanById(id);
    return true;
  }

  // ─── Lorebook (World Info) CRUD ───────────────────────────────────────────

  /**
   * Lấy toàn bộ Lorebook entries của một nhân vật.
   * @param {string} charId
   * @param {string} userId - Chỉ creator mới xem được toàn bộ entries
   */
  async getLorebookEntries(charId, userId) {
    const char = await characterRepository.findById(charId);
    if (!char) throw AppError.notFound('Nhân vật');
    if (char.creatorId?.toString() !== userId.toString()) {
      throw AppError.forbidden('Chỉ creator mới có thể xem Lorebook');
    }
    return char.lorebook || [];
  }

  /**
   * Thêm một entry mới vào Lorebook.
   *
   * Tương đương "Add World Info Entry" trong SillyTavern.
   *
   * @param {string} charId
   * @param {string} userId
   * @param {Object} entryData - { keys[], content, position, priority, enabled }
   */
  async addLorebookEntry(charId, userId, entryData) {
    const char = await characterRepository.findById(charId);
    if (!char) throw AppError.notFound('Nhân vật');
    if (char.creatorId?.toString() !== userId.toString()) {
      throw AppError.forbidden('Chỉ creator mới có thể chỉnh sửa Lorebook');
    }

    const { keys, content, position, priority, enabled } = entryData;
    if (!content || !keys || keys.length === 0) {
      throw AppError.badRequest('Lorebook entry cần có keys và content', 'MISSING_FIELDS');
    }

    char.lorebook.push({
      keys:     keys.map(k => k.trim()).filter(Boolean),
      content:  content.trim(),
      position: position || 'before_char',
      priority: priority || 0,
      enabled:  enabled !== false,
    });

    await char.save();
    return char.lorebook[char.lorebook.length - 1]; // Trả về entry vừa tạo
  }

  /**
   * Cập nhật một Lorebook entry theo index.
   * @param {string} charId
   * @param {string} userId
   * @param {string} entryId - MongoDB ObjectId của entry
   * @param {Object} updateData
   */
  async updateLorebookEntry(charId, userId, entryId, updateData) {
    const char = await characterRepository.findById(charId);
    if (!char) throw AppError.notFound('Nhân vật');
    if (char.creatorId?.toString() !== userId.toString()) {
      throw AppError.forbidden('Chỉ creator mới có thể chỉnh sửa Lorebook');
    }

    const entry = char.lorebook.id(entryId);
    if (!entry) throw AppError.notFound('Lorebook entry');

    // Cập nhật từng field nếu có trong updateData
    if (updateData.keys !== undefined)    entry.keys    = updateData.keys.map(k => k.trim());
    if (updateData.content !== undefined) entry.content = updateData.content.trim();
    if (updateData.position !== undefined) entry.position = updateData.position;
    if (updateData.priority !== undefined) entry.priority = updateData.priority;
    if (updateData.enabled !== undefined)  entry.enabled  = updateData.enabled;

    await char.save();
    return entry;
  }

  /**
   * Xóa một Lorebook entry.
   * @param {string} charId
   * @param {string} userId
   * @param {string} entryId
   */
  async deleteLorebookEntry(charId, userId, entryId) {
    const char = await characterRepository.findById(charId);
    if (!char) throw AppError.notFound('Nhân vật');
    if (char.creatorId?.toString() !== userId.toString()) {
      throw AppError.forbidden('Chỉ creator mới có thể chỉnh sửa Lorebook');
    }

    const entry = char.lorebook.id(entryId);
    if (!entry) throw AppError.notFound('Lorebook entry');

    entry.deleteOne();
    await char.save();
    return true;
  }

  // ─── Dialogue Examples CRUD ───────────────────────────────────────────────

  /**
   * Thêm một dialogue example vào Character Card.
   * Tương đương "Add Dialogue Example" trong SillyTavern Character Card V2.
   *
   * @param {string} charId
   * @param {string} userId
   * @param {Object} example - { user: '...', assistant: '...' }
   */
  async addDialogueExample(charId, userId, example) {
    const char = await characterRepository.findById(charId);
    if (!char) throw AppError.notFound('Nhân vật');
    if (char.creatorId?.toString() !== userId.toString()) {
      throw AppError.forbidden('Chỉ creator mới có thể thêm dialogue example');
    }

    const { user, assistant } = example;
    if (!user || !assistant) {
      throw AppError.badRequest('Cần cung cấp cả user và assistant', 'MISSING_FIELDS');
    }

    char.dialogueExamples.push({ user: user.trim(), assistant: assistant.trim() });
    await char.save();
    return char.dialogueExamples[char.dialogueExamples.length - 1];
  }

  /**
   * Xóa một dialogue example theo index.
   */
  async deleteDialogueExample(charId, userId, exampleIndex) {
    const char = await characterRepository.findById(charId);
    if (!char) throw AppError.notFound('Nhân vật');
    if (char.creatorId?.toString() !== userId.toString()) {
      throw AppError.forbidden('Chỉ creator mới có thể xóa dialogue example');
    }

    if (exampleIndex < 0 || exampleIndex >= char.dialogueExamples.length) {
      throw AppError.badRequest('Index dialogue example không hợp lệ', 'INVALID_INDEX');
    }

    char.dialogueExamples.splice(exampleIndex, 1);
    await char.save();
    return true;
  }

  // ─── Tiện ích ─────────────────────────────────────────────────────────────

  /**
   * Kiểm tra và trả về danh sách macro hợp lệ.
   * Hữu ích để hiển thị gợi ý cho Creator khi viết systemPromptTemplate.
   */
  getSupportedMacros() {
    // Tạo một instance tạm để truy cập danh sách macro
    return macroService.validateMacros('').supportedMacros;
  }
}

module.exports = new CharacterService();
