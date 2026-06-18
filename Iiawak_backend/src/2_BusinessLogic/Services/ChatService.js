'use strict';

const ChatSession      = require('../../3_DataAccess/Models/ChatSession.model');
const Character        = require('../../3_DataAccess/Models/Character.model');
const Message          = require('../../3_DataAccess/Models/Message.model');
const User             = require('../../3_DataAccess/Models/User.model');
const aiService        = require('./AiService');
const memoryService    = require('./MemoryService');
const macroService     = require('./MacroService');
const lorebookService  = require('./LorebookService');
const AppError         = require('../../4_Core/Exceptions/AppError');

/**
 * ChatService — Nghiệp vụ chat (AI sessions + Direct messages).
 *
 * Luồng xử lý "gửi tin nhắn AI" (tham khảo SillyTavern's generateReply()):
 *
 *   [Client gửi request]
 *        ↓
 *   1. _getOrCreateSession()     — Tìm / tạo ChatSession trong MongoDB
 *        ↓
 *   2. _buildSystemInstruction() — Ghép Character Persona thành System Prompt
 *        ↓
 *   3. memoryService.buildContextForAi() — Chèn Memory + cắt lịch sử cũ (nếu có)
 *        ↓
 *   4. aiService.generateResponse()      — Gửi payload lên Gemini API
 *        ↓
 *   5. _saveMessages()          — Lưu user message + AI response vào DB
 *        ↓
 *   6. memoryService.shouldSummarize() → summarizeHistory() (nếu đủ điều kiện)
 *        ↓
 *   7. Trả về response cho client
 */
class ChatService {

  // ─── HÀM PRIVATE: HỖ TRỢ ──────────────────────────────────────────────────

  /**
   * Tìm session hiện có hoặc tạo mới.
   * @param {string} userId
   * @param {string} characterId
   * @param {string} mode
   * @returns {Promise<Object>} session document
   */
  async _getOrCreateSession(userId, characterId, mode = 'normal') {
    let session = await ChatSession.findOne({ userId, characterId, mode });
    if (!session) {
      session = new ChatSession({ userId, characterId, mode, messages: [] });
    }
    return session;
  }

  /**
   * [CORE] Xây dựng System Instruction từ thông tin nhân vật.
   *
   * Mới: Hỗ trợ hai chế độ (tương đương SillyTavern Character Card V2):
   *   1. Template Mode: Nếu character.systemPromptTemplate tồn tại,
   *      chạy MacroService.substitute() để điền biến vào template.
   *   2. Auto-build Mode: Nếu không có template, tự ghép từ các trường riêng lẻ
   *      (giống behavior cũ nhưng sạch hơn).
   *
   * @param {Object} character - Document từ MongoDB
   * @param {Object} user      - User document
   * @param {Object} session   - ChatSession document
   * @returns {string} System instruction đã được xử lý macro
   */
  _buildSystemInstruction(character, user, session) {
    // Chế độ 1: Template Mode — dùng custom template nếu creator có viết sẵn
    if (character.systemPromptTemplate && character.systemPromptTemplate.trim()) {
      return macroService.substitute(character.systemPromptTemplate, {
        user, character, session,
      });
    }

    // Chế độ 2: Auto-build Mode — tự ghép từ các trường
    const userName = user?.displayName || user?.username || 'Người dùng';
    const lines = [
      `You are ${character.name}, a character in the Iiawak app.`,
      `The user you are talking to is named "${userName}". Address them by name occasionally.`,
      `NEVER break character. NEVER reveal you are an AI.`,
      '',
      `## Personality`,
      character.personality || 'Friendly and engaging.',
      '',
      `## Background`,
      character.bio || '',
      '',
      `## Speaking Style`,
      character.advancedSettings?.speakingStyle || 'Natural, warm, and concise.',
      '',
      `## Context`,
      character.publicInfo || '',
      '',
      `## Current Status`,
      `${character.name} is currently: ${character.status || 'available'}.`,
      '',
      `## Rules`,
      `- Keep responses focused and in-character.`,
      `- Use the language the user is speaking.`,
      `- Be expressive but concise (1-3 paragraphs max).`,
    ];

    // Chèn User Identity nếu có (tương đương advancedSettings.userIdentity)
    if (character.advancedSettings?.userIdentity) {
      lines.push('', `## The User's Role`, character.advancedSettings.userIdentity);
    }

    return lines.join('\n').trim();
  }

  /**
   * Xây dựng Dialogue Examples để chèn vào history trước khi gọi AI.
   *
   * Tương đương cách SillyTavern dùng example_dialogue trong Character Card V2:
   * Chèn các đoạn hội thoại mẫu vào đầu history (few-shot prompting)
   * để AI học văn phong và cách xưng hô của nhân vật.
   *
   * @param {Object} character
   * @returns {Array} Mảng Gemini history format
   */
  _buildDialogueExamples(character) {
    if (!character.dialogueExamples || character.dialogueExamples.length === 0) {
      return [];
    }

    const examples = [];
    for (const ex of character.dialogueExamples) {
      if (ex.user && ex.assistant) {
        examples.push({ role: 'user',  parts: [{ text: ex.user }] });
        examples.push({ role: 'model', parts: [{ text: ex.assistant }] });
      }
    }
    return examples;
  }

  /**
   * Lưu cặp tin nhắn (user + assistant) vào session.
   * @param {Object} session
   * @param {string} userContent
   * @param {string} aiContent
   */
  async _saveMessages(session, userContent, aiContent) {
    const now = new Date();
    session.messages.push({ role: 'user',      content: userContent, timestamp: now });
    session.messages.push({ role: 'assistant', content: aiContent,   timestamp: now });
    session.updatedAt = now;
    await session.save();
  }

  // ─── API CÔNG KHAI ────────────────────────────────────────────────────────────

  /**
   * Gửi tin nhắn đến AI nhân vật và nhận phản hồi đầy đủ (non-streaming).
   *
   * Tương đương luồng generateReply() → sendRequest() (stream=false) trong SillyTavern.
   *
   * @param {string} userId
   * @param {string} characterId
   * @param {string} content     - Tin nhắn của user
   * @param {string} mode        - 'normal' | 'story' | 'nsfw' (v.v.)
   * @returns {Promise<Object>}  { session, response, history, memoryStats }
   */
  async sendMessageToAi(userId, characterId, content, mode = 'normal') {
    // 1. Lấy hoặc tạo session & character & user (song song)
    const [session, character, user] = await Promise.all([
      this._getOrCreateSession(userId, characterId, mode),
      Character.findById(characterId),
      User.findById(userId).select('displayName username'),
    ]);

    if (!character) throw AppError.notFound('Nhân vật');

    // 2. Build System Instruction với Macro Substitution
    const baseSystemInstruction = this._buildSystemInstruction(character, user, session);

    // 3. Kết hợp Memory (nếu có) vào context
    const { systemInstruction: withMemory, history: recentHistory } = memoryService.buildContextForAi(
      baseSystemInstruction,
      session
    );

    // 4. Chèn Dialogue Examples vào đầu history (few-shot prompting)
    const dialogueExamples = this._buildDialogueExamples(character);
    const historyWithExamples = [...dialogueExamples, ...recentHistory];

    // 5. Xử lý Lorebook (World Info) + Author's Note
    //    — Scan history để tìm từ khóa, inject ngữ cảnh vào prompt
    const { systemInstruction, history } = lorebookService.process(
      withMemory,
      historyWithExamples,
      session.messages,  // raw messages để scan keyword
      character
    );

    // 6. Gọi AI (non-streaming hoặc Character.AI)
    let aiResponse = '';
    if (character.aiBackend === 'character_ai') {
      const characterAiService = require('./CharacterAiService');
      const caiResult = await characterAiService.sendMessage(character.caiCharacterId, session.caiChatId, content);
      aiResponse = caiResult.text;
      if (caiResult.newCaiChatId && session.caiChatId !== caiResult.newCaiChatId) {
        session.caiChatId = caiResult.newCaiChatId;
      }
    } else {
      aiResponse = await aiService.generateResponse(systemInstruction, history, content);
    }

    // 7. Lưu tin nhắn vào DB
    await this._saveMessages(session, content, aiResponse);

    // 8. Cập nhật thống kê nhân vật
    await Character.findByIdAndUpdate(characterId, { $inc: { totalChats: 1 } });

    // 9. Chạy Memory Summarization (bất đồng bộ)
    if (memoryService.shouldSummarize(session)) {
      this._runMemorySummarization(session, character).catch(err =>
        console.error('⚠️ Memory summarization failed silently:', err.message)
      );
    }

    return {
      session:     session._id,
      response:    aiResponse,
      history:     session.messages.slice(-10),
      memoryStats: memoryService.getMemoryStats(session),
    };
  }

  /**
   * Gửi tin nhắn đến AI và STREAM phản hồi về client theo thời gian thực.
   *
   * Tương đương SillyTavern's forwardFetchResponse() — pipe SSE stream.
   *
   * Client phải xử lý Server-Sent Events:
   *   const es = new EventSource('/api/chat/ai/stream');
   *   es.onmessage = (e) => {
   *     if (e.data === '[DONE]') { es.close(); return; }
   *     const { text } = JSON.parse(e.data);
   *     appendToChat(text);
   *   };
   *
   * @param {string}   userId
   * @param {string}   characterId
   * @param {string}   content
   * @param {string}   mode
   * @param {Object}   res - Express Response (để pipe stream)
   */
  async sendMessageToAiStream(userId, characterId, content, mode = 'normal', res) {
    const [session, character, user] = await Promise.all([
      this._getOrCreateSession(userId, characterId, mode),
      Character.findById(characterId),
      User.findById(userId).select('displayName username'),
    ]);

    if (!character) {
      res.write(`data: ${JSON.stringify({ error: 'Nhân vật không tồn tại' })}\n\n`);
      res.end();
      return;
    }

    // Áp dụng toàn bộ pipeline (macro + memory + dialogue + lorebook)
    const baseSystemInstruction = this._buildSystemInstruction(character, user, session);
    const { systemInstruction: withMemory, history: recentHistory } = memoryService.buildContextForAi(
      baseSystemInstruction,
      session
    );
    const dialogueExamples = this._buildDialogueExamples(character);
    const historyWithExamples = [...dialogueExamples, ...recentHistory];
    const { systemInstruction, history } = lorebookService.process(
      withMemory,
      historyWithExamples,
      session.messages,
      character
    );

    // ─── ĐỊNH TUYẾN: Gemini vs Character.AI ───
    let fullAiResponse = '';
    if (character.aiBackend === 'character_ai') {
      const characterAiService = require('./CharacterAiService');
      // Character.AI wrapper có thể không hỗ trợ stream dễ dàng qua API này, 
      // ta fallback về gọi full response và fake stream 1 lần
      const caiResult = await characterAiService.sendMessage(character.caiCharacterId, session.caiChatId, content);
      fullAiResponse = caiResult.text;
      if (caiResult.newCaiChatId && session.caiChatId !== caiResult.newCaiChatId) {
        session.caiChatId = caiResult.newCaiChatId;
      }
      res.setHeader('Content-Type', 'text/event-stream');
      res.write(`data: ${JSON.stringify({ text: fullAiResponse })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Pipe SSE stream về client từ Gemini
      fullAiResponse = await aiService.streamResponse(systemInstruction, history, content, res);
    }

    // Lưu vào DB sau khi stream kết thúc
    if (fullAiResponse) {
      await this._saveMessages(session, content, fullAiResponse);
      await Character.findByIdAndUpdate(characterId, { $inc: { totalChats: 1 } });

      if (memoryService.shouldSummarize(session)) {
        this._runMemorySummarization(session, character).catch(err =>
          console.error('⚠️ Memory summarization failed silently:', err.message)
        );
      }
    }
  }

  /**
   * Chạy tóm tắt bộ nhớ bất đồng bộ.
   * Được gọi ngầm, không ảnh hưởng đến tốc độ response.
   * @param {Object} session
   * @param {Object} character
   */
  async _runMemorySummarization(session, character) {
    const newSummary = await memoryService.summarizeHistory(session, character);
    if (newSummary) {
      session.memorySummary    = newSummary;
      session.lastSummarizedAt = session.messages.length;
      await session.save();
      console.log(`🧠 Memory updated for session ${session._id}: ${newSummary.substring(0, 60)}...`);
    }
  }

  // ─── REGENERATE / SWIPE / EDIT ──────────────────────────────────────────────

  /**
   * Tạo lại phản hồi cuối cùng của AI (Regenerate).
   *
   * Tương đương nút "Regenerate" của SillyTavern:
   *   - Xóa tin nhắn cuối cùng của AI khỏi session
   *   - Gọi lại toàn bộ pipeline với cùng context
   *   - Lưu response MỚI vào DB
   *
   * Lưu ý: Tin nhắn của user vẫn được giữ nguyên trong session,
   * chỉ response của AI bị thay thế.
   *
   * @param {string} userId
   * @param {string} characterId
   * @param {string} mode
   * @returns {Promise<Object>} { response, history }
   */
  async regenerateLastResponse(userId, characterId, mode = 'normal') {
    const [session, character, user] = await Promise.all([
      ChatSession.findOne({ userId, characterId, mode }),
      Character.findById(characterId),
      User.findById(userId).select('displayName username'),
    ]);

    if (!session) throw AppError.notFound('Phiên chat');
    if (!character) throw AppError.notFound('Nhân vật');
    if (session.messages.length < 2) {
      throw new AppError('Chưa có tin nhắn để tạo lại', 400);
    }

    // Tìm tin nhắn assistant cuối cùng và xóa nó
    // (Giống SillyTavern xóa swipe cũ và tạo swipe mới)
    const messages = session.messages;
    let lastAssistantIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        lastAssistantIdx = i;
        break;
      }
    }

    if (lastAssistantIdx === -1) {
      throw new AppError('Không tìm thấy phản hồi AI để tạo lại', 400);
    }

    // Lấy nội dung tin nhắn user trước đó (để gửi lại cho AI)
    const userMessageIdx = lastAssistantIdx - 1;
    if (userMessageIdx < 0 || messages[userMessageIdx].role !== 'user') {
      throw new AppError('Cấu trúc lịch sử chat không hợp lệ', 400);
    }
    const originalUserContent = messages[userMessageIdx].content;

    // Xóa cặp (user + assistant) cuối cùng khỏi session để build context đúng
    // SillyTavern gọi đây là "popping" the last exchange
    session.messages = messages.slice(0, userMessageIdx);
    // Không save ngay — chỉ tạm thời để build context

    // Chạy toàn bộ pipeline như sendMessageToAi()
    const baseSystemInstruction = this._buildSystemInstruction(character, user, session);
    const { systemInstruction: withMemory, history: recentHistory } = memoryService.buildContextForAi(
      baseSystemInstruction,
      session
    );
    const dialogueExamples = this._buildDialogueExamples(character);
    const historyWithExamples = [...dialogueExamples, ...recentHistory];
    const { systemInstruction, history } = lorebookService.process(
      withMemory,
      historyWithExamples,
      session.messages,
      character
    );

    // Gọi AI với cùng user message nhưng không có response cũ
    const newAiResponse = await aiService.generateResponse(
      systemInstruction,
      history,
      originalUserContent
    );

    // Lưu lại cặp (user message gốc + AI response mới)
    await this._saveMessages(session, originalUserContent, newAiResponse);

    return {
      response: newAiResponse,
      history:  session.messages.slice(-10),
    };
  }

  /**
   * Sửa một tin nhắn trong lịch sử chat (Edit Message).
   *
   * Tương đương chức năng "Edit Message" trong SillyTavern:
   *   - Cho phép sửa nội dung bất kỳ tin nhắn nào trong history
   *   - Tất cả tin nhắn SAU tin nhắn được sửa sẽ bị XÓA
   *     (vì context đã thay đổi → các response cũ không còn hợp lệ)
   *
   * @param {string} userId
   * @param {string} characterId
   * @param {number} messageIndex  - Index của tin nhắn cần sửa (0-based)
   * @param {string} newContent    - Nội dung mới
   * @param {string} mode
   * @returns {Promise<Object>} { history } — lịch sử đã được trim
   */
  async editMessage(userId, characterId, messageIndex, newContent, mode = 'normal') {
    const session = await ChatSession.findOne({ userId, characterId, mode });
    if (!session) throw AppError.notFound('Phiên chat');

    if (messageIndex < 0 || messageIndex >= session.messages.length) {
      throw new AppError('Index tin nhắn không hợp lệ', 400);
    }
    if (!newContent || !newContent.trim()) {
      throw new AppError('Nội dung mới không được rỗng', 400);
    }

    // Sửa nội dung tin nhắn được chỉ định
    session.messages[messageIndex].content = newContent.trim();
    session.messages[messageIndex].timestamp = new Date();

    // Xóa tất cả tin nhắn SAU tin nhắn được sửa
    // (SillyTavern cũng làm vậy — branch cũ không còn hợp lệ)
    session.messages = session.messages.slice(0, messageIndex + 1);
    session.updatedAt = new Date();
    await session.save();

    return { history: session.messages };
  }

  /**
   * Xóa cặp tin nhắn cuối cùng (user + assistant) khỏi session.
   *
   * Hữu ích khi user muốn "undo" tin nhắn gần nhất.
   * Trong SillyTavern: "Delete last message" button.
   *
   * @param {string} userId
   * @param {string} characterId
   * @param {string} mode
   * @returns {Promise<Object>} { history }
   */
  async deleteLastExchange(userId, characterId, mode = 'normal') {
    const session = await ChatSession.findOne({ userId, characterId, mode });
    if (!session) throw AppError.notFound('Phiên chat');
    if (session.messages.length < 2) {
      throw new AppError('Không có đủ tin nhắn để xóa', 400);
    }

    // Xóa 2 tin nhắn cuối (assistant + user trước đó)
    session.messages = session.messages.slice(0, -2);
    session.updatedAt = new Date();
    await session.save();

    return { history: session.messages };
  }

  /**
   * Bật/tắt đóng băng bộ nhớ (Memory Freeze).
   *
   * Tương đương "Memory Frozen" toggle trong SillyTavern's Memory extension.
   * Khi bật: MemoryService sẽ không chạy tóm tắt tự động nữa,
   * bản tóm tắt hiện tại được giữ nguyên.
   *
   * @param {string}  userId
   * @param {string}  characterId
   * @param {boolean} frozen
   * @param {string}  mode
   * @returns {Promise<Object>}
   */
  async setMemoryFrozen(userId, characterId, frozen, mode = 'normal') {
    const session = await ChatSession.findOne({ userId, characterId, mode });
    if (!session) throw AppError.notFound('Phiên chat');

    session.memoryFrozen = Boolean(frozen);
    await session.save();

    return {
      memoryFrozen: session.memoryFrozen,
      memoryStats:  memoryService.getMemoryStats(session),
    };
  }

  // ─── CÁC ENDPOINT KHÁC ───────────────────────────────────────────────────────

  async getAiSessions(userId) {
    return ChatSession.find({ userId })
      .populate('characterId', 'name avatar slogan')
      .sort({ updatedAt: -1 });
  }

  async getAiChatHistory(userId, characterId, mode = 'normal') {
    const session = await ChatSession.findOne({ userId, characterId, mode });
    return session ? session.messages : [];
  }

  async getDirectConversations(userId) {
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 });

    const seen = new Set();
    const conversations = [];

    for (const msg of messages) {
      if (!seen.has(msg.conversationId)) {
        seen.add(msg.conversationId);
        const otherId = msg.senderId.toString() === userId.toString()
          ? msg.receiverId.toString()
          : msg.senderId.toString();
        conversations.push({
          conversationId: msg.conversationId,
          otherId,
          lastMessage: msg.content,
          lastTime:    msg.createdAt,
        });
      }
    }

    return Promise.all(
      conversations.map(async (conv) => {
        const otherUser = await User.findById(conv.otherId)
          .select('displayName username avatar');
        return { ...conv, otherUser };
      })
    );
  }

  async getDirectChatHistory(userId, otherUserId) {
    const conversationId = [userId, otherUserId].sort().join('_');
    return Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(100);
  }
}

module.exports = new ChatService();
