'use strict';
const characterRepository = require('../../3_DataAccess/Repositories/CharacterRepository');
const chatRepository      = require('../../3_DataAccess/Repositories/ChatRepository');
const AppError            = require('../../4_Core/Exceptions/AppError');
const Errors              = require('../../4_Core/Constants/errorMessages');
const { GEMINI_MODEL, CHAT_SESSION_MAX_MESSAGES } = require('../../4_Core/Constants/appConstants');
const axios = require('axios');
const config = require('../../config');

/**
 * CharacterService — Nghiệp vụ quản lý Nhân vật và Chat AI.
 * DB calls → CharacterRepository / ChatRepository.
 * AI calls → Gemini API.
 */
class CharacterService {

  // ─── CRUD Nhân vật ────────────────────────────────────────────────────────

  async createCharacter(userId, data) {
    const {
      name, avatar, gender, tags, slogan, creatorNotes, privacy, ageRating,
      publicInfo, personality, openingLine, bio, firstMessage, status,
      chatMode, advancedSettings,
    } = data;

    // Nghiệp vụ: kiểm tra các trường bắt buộc
    if (!name || !avatar || !gender || !slogan || !privacy || !ageRating ||
        !publicInfo || !personality || !openingLine || !bio || !firstMessage || !status) {
      throw AppError.badRequest(Errors.CHARACTER.REQUIRED_FIELDS, 'MISSING_FIELDS');
    }

    const tagsArr = Array.isArray(tags)
      ? tags
      : (tags ? tags.split(',').map(t => t.trim()) : []);

    return characterRepository.create({
      name, avatar, gender, tags: tagsArr, slogan, creatorNotes, privacy, ageRating,
      publicInfo, personality, openingLine, bio, firstMessage, status,
      chatMode: chatMode || 'both', advancedSettings,
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

    // Nghiệp vụ: chỉ creator mới được sửa
    if (char.creatorId?._id?.toString() !== userId.toString()) {
      throw AppError.forbidden(Errors.CHARACTER.UNAUTHORIZED_EDIT);
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

  // ─── Chat AI ──────────────────────────────────────────────────────────────

  async chat(characterId, userId, message, mode = 'normal') {
    const char = await characterRepository.findById(characterId);
    if (!char) throw AppError.notFound(Errors.CHAT.CHARACTER_NOT_FOUND);
    if (char.isBanned) throw AppError.forbidden(Errors.CHARACTER.BANNED);

    // Lấy hoặc tạo session (Repository lo)
    const session = await chatRepository.findOrCreateSession(userId, char._id, mode);

    // Nếu session mới và có firstMessage → thêm vào lịch sử
    if (session.messages.length === 0 && char.firstMessage) {
      session.messages.push({ role: 'assistant', content: char.firstMessage });
    }

    session.messages.push({ role: 'user', content: message });

    // Gọi AI (nghiệp vụ quan trọng — giữ ở Service)
    const systemPrompt = this._buildSystemPrompt(char, mode);
    const aiReply      = await this._callGeminiAI(systemPrompt, session.messages, mode, char);

    session.messages.push({ role: 'assistant', content: aiReply });

    // Nghiệp vụ: giới hạn kích thước session
    if (session.messages.length > CHAT_SESSION_MAX_MESSAGES) {
      session.messages = session.messages.slice(-CHAT_SESSION_MAX_MESSAGES);
    }

    await chatRepository.saveSession(session);
    await characterRepository.incrementChats(char._id);

    return { reply: aiReply, sessionId: session._id };
  }

  async getChatHistory(characterId, userId, mode = 'normal') {
    const session = await chatRepository.findSession(userId, characterId, mode);
    return session ? session.messages : [];
  }

  // ─── Private AI Methods (Nghiệp vụ — ở lại Service) ─────────────────────

  _buildSystemPrompt(char, mode) {
    const modeInstruction = mode === 'story'
      ? `Bạn đang viết một câu chuyện tương tác. Phản hồi PHẢI dài từ 150-400 từ, viết theo phong cách tiểu thuyết/truyện ngắn, dùng ngôi thứ nhất. Mô tả hành động, cảm xúc, ngoại cảnh chi tiết. Kết thúc bằng một câu hỏi hoặc tình huống kích thích người đọc phản hồi.`
      : `Bạn đang chat thân mật với người dùng. Phản hồi ngắn gọn (2-5 câu), tự nhiên như nhắn tin, dùng emoji phù hợp với tính cách.`;

    return `Bạn là "${char.name}", một nhân vật với các đặc điểm sau:

GIỚI TÍNH: ${char.gender}
TÍNH CÁCH: ${char.personality}
TIỂU SỬ: ${char.bio}
TRẠNG THÁI HIỆN TẠI: ${char.status}
THÔNG TIN CÔNG KHAI: ${char.publicInfo}
${char.advancedSettings?.speakingStyle ? `PHONG CÁCH NÓI: ${char.advancedSettings.speakingStyle}` : ''}
${char.advancedSettings?.userIdentity   ? `NHẬN DẠNG NGƯỜI DÙNG: ${char.advancedSettings.userIdentity}` : ''}
${char.advancedSettings?.lifeExperience ? `KINH NGHIỆM SỐNG: ${char.advancedSettings.lifeExperience}` : ''}

NHIỆM VỤ: ${modeInstruction}

QUAN TRỌNG: Luôn duy trì tính cách nhất quán. KHÔNG phá vỡ nhân vật. KHÔNG tiết lộ bạn là AI.`;
  }

  async _callGeminiAI(systemPrompt, messages, mode, char) {
    const apiKey = config.ai.geminiKey;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return this._getFallbackResponse(char, mode);
    }

    try {
      const historyText = messages.slice(-10).map(m =>
        m.role === 'user' ? `Người dùng: ${m.content}` : `${char.name}: ${m.content}`
      ).join('\n');
      const lastMsg = messages[messages.length - 1]?.content || '';

      const resp = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: `${systemPrompt}\n\n--- LỊCH SỬ ---\n${historyText}\n\n--- TIN MỚI NHẤT ---\nNgười dùng: ${lastMsg}\n${char.name}:` }] }],
          generationConfig: {
            temperature:     mode === 'story' ? 0.9 : 0.8,
            maxOutputTokens: mode === 'story' ? 600 : 200,
            topP: 0.95,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          ],
        },
        { timeout: 30000 }
      );

      return resp.data?.candidates?.[0]?.content?.parts?.[0]?.text
          || this._getFallbackResponse(char, mode);
    } catch (err) {
      console.error('Gemini API error:', err.message);
      return this._getFallbackResponse(char, mode);
    }
  }

  _getFallbackResponse(char, mode) {
    if (mode === 'story') {
      return `${char.openingLine}\n\n*${char.name} nhìn bạn với ánh mắt sâu thẳm...*\n\nBạn sẽ làm gì tiếp theo?`;
    }
    return char.openingLine || `Chào bạn! Tôi là ${char.name}. Bạn muốn nói chuyện gì nào? 😊`;
  }
}

module.exports = new CharacterService();
