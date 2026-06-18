'use strict';

const aiService = require('./AiService');

// ─────────────────────────────────────────────────────────────────────────────
// CẤU HÌNH MẶC ĐỊNH (tham khảo từ SillyTavern defaultSettings)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  // Tóm tắt sau mỗi N tin nhắn (đếm cả user + assistant)
  summarizeEveryN: 20,

  // Số từ tối đa của bản tóm tắt
  maxSummaryWords: 200,

  // Số tin nhắn "mới nhất" GIỮ LẠI nguyên vẹn, không nén (luôn gửi nguyên)
  // Giúp AI hiểu ngữ cảnh gần nhất, tránh bị "ngơ ngác"
  recentMessagesKept: 10,

  // Template để inject summary vào system prompt
  summaryTemplate: '[Bộ nhớ cuộc trò chuyện trước: {{summary}}]',
};

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT TÓM TẮT (dịch và tối ưu từ SillyTavern defaultPrompt)
// ─────────────────────────────────────────────────────────────────────────────
const SUMMARIZE_PROMPT = (maxWords, existingSummary) => `
Nhiệm vụ của bạn là tóm tắt các sự kiện và thông tin quan trọng nhất trong cuộc hội thoại bên dưới.
${existingSummary ? `Bạn đã có sẵn bản tóm tắt cũ sau đây, hãy dùng nó làm nền và bổ sung thêm thông tin mới:\n"${existingSummary}"\n` : ''}
Giới hạn tóm tắt trong ${maxWords} từ hoặc ít hơn.
CHỈ trả lời bằng nội dung tóm tắt, không có lời dẫn hay giải thích thêm.
`.trim();

/**
 * MemoryService — Hệ thống nén & lưu trữ bộ nhớ hội thoại.
 *
 * Lấy cảm hứng từ extension Memory của SillyTavern, được viết lại
 * cho kiến trúc Node.js/Express/MongoDB của Iiawak_backend.
 *
 * Luồng hoạt động:
 *   1. shouldSummarize()  — Kiểm tra có cần tóm tắt chưa?
 *   2. summarizeHistory() — Gửi lịch sử cũ sang AI, nhận bản tóm tắt.
 *   3. buildContextForAi()— Dựng prompt context: [summary] + [tin nhắn gần đây].
 */
class MemoryService {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ─── 1. KIỂM TRA ĐIỀU KIỆN TÓM TẮT ────────────────────────────────────────

  /**
   * Quyết định có nên chạy tóm tắt sau tin nhắn này không.
   *
   * Logic (tham khảo SillyTavern):
   *   - Chỉ tóm tắt khi có đủ số tin nhắn mới kể từ lần tóm tắt trước.
   *   - Nếu đã bị "đóng băng" (frozen), bỏ qua.
   *
   * @param {Object} session - Chat session object từ MongoDB
   * @returns {boolean}
   */
  shouldSummarize(session) {
    if (session.memoryFrozen) return false;

    const totalMessages = session.messages.length;

    // Chưa đủ tin để tóm tắt lần đầu
    if (totalMessages < this.config.summarizeEveryN) return false;

    // Tính số tin nhắn kể từ lần tóm tắt cuối
    const lastSummarizedAt = session.lastSummarizedAt || 0;
    const messagesSinceLastSummary = totalMessages - lastSummarizedAt;

    return messagesSinceLastSummary >= this.config.summarizeEveryN;
  }

  // ─── 2. CHẠY TÓM TẮT ───────────────────────────────────────────────────────

  /**
   * Tóm tắt phần lịch sử chat cũ (không bao gồm N tin nhắn mới nhất).
   *
   * Ý tưởng cốt lõi từ SillyTavern:
   *   - Lấy tất cả tin nhắn CŨ (loại trừ recentMessagesKept tin mới nhất)
   *   - Nếu đã có summary cũ, dùng làm "nền" và mở rộng thêm ("expand with new facts")
   *   - Gửi sang Gemini với prompt tóm tắt chuyên biệt
   *
   * @param {Object} session - Chat session object
   * @param {Object} character - Character object (dùng để tạo context cho AI)
   * @returns {string|null} Bản tóm tắt mới, hoặc null nếu thất bại
   */
  async summarizeHistory(session, character) {
    const { recentMessagesKept, maxSummaryWords } = this.config;
    const messages = session.messages;

    // Lấy phần tin nhắn CŨ cần được tóm tắt (bỏ qua N tin nhắn mới nhất)
    const messagesToSummarize = messages.slice(0, messages.length - recentMessagesKept);

    if (messagesToSummarize.length === 0) return null;

    // Chuyển đổi sang dạng văn bản dễ đọc để gửi cho AI tóm tắt
    const historyText = messagesToSummarize
      .map(msg => {
        const speaker = msg.role === 'user' ? 'Người dùng' : character.name;
        return `${speaker}: ${msg.content}`;
      })
      .join('\n');

    // Bản tóm tắt hiện tại (nếu có) sẽ được dùng làm nền
    const existingSummary = session.memorySummary || null;

    // Dựng system instruction cho tác vụ tóm tắt
    // Lưu ý: đây là một lời gọi AI riêng biệt, không liên quan đến roleplay
    const summarizeInstruction = SUMMARIZE_PROMPT(maxSummaryWords, existingSummary);

    try {
      const newSummary = await aiService.generateResponse(
        summarizeInstruction,
        [], // Không cần history cho tác vụ tóm tắt
        `Đây là lịch sử hội thoại cần tóm tắt:\n\n${historyText}`
      );

      return newSummary ? newSummary.trim() : null;
    } catch (err) {
      console.error('❌ MemoryService: Tóm tắt thất bại:', err.message);
      return null; // Không crash app, chỉ bỏ qua tóm tắt lần này
    }
  }

  // ─── 3. DỰNG CONTEXT ĐỂ GỬI CHO AI ─────────────────────────────────────────

  /**
   * Xây dựng system prompt và history tối ưu để gửi cho Gemini.
   *
   * Kết quả là sự kết hợp của:
   *   - System Instruction gốc (tính cách nhân vật)
   *   - [Memory Block] chứa bản tóm tắt lịch sử (nếu có)
   *   - N tin nhắn MỚI NHẤT (nguyên vẹn, không bị nén)
   *
   * @param {string} characterSystemInstruction - System prompt gốc của nhân vật
   * @param {Object} session - Chat session object
   * @returns {{ systemInstruction: string, history: Array }}
   */
  buildContextForAi(characterSystemInstruction, session) {
    const { recentMessagesKept, summaryTemplate } = this.config;

    // Phần 1: Chèn bản tóm tắt vào System Instruction
    let finalSystemInstruction = characterSystemInstruction;
    if (session.memorySummary) {
      const memoryBlock = summaryTemplate.replace('{{summary}}', session.memorySummary);
      finalSystemInstruction = `${characterSystemInstruction}\n\n${memoryBlock}`;
    }

    // Phần 2: Chỉ lấy N tin nhắn mới nhất làm history gửi cho AI
    // (Phần cũ đã được nén vào summary, không cần gửi lại)
    const recentMessages = session.messages.slice(-recentMessagesKept);
    const history = recentMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    return { systemInstruction: finalSystemInstruction, history };
  }

  // ─── 4. HÀM TIỆN ÍCH ────────────────────────────────────────────────────────

  /**
   * Format bản tóm tắt theo template (giống formatMemoryValue của SillyTavern).
   * @param {string} summary
   * @returns {string}
   */
  formatSummary(summary) {
    if (!summary) return '';
    return this.config.summaryTemplate.replace('{{summary}}', summary.trim());
  }

  /**
   * Lấy thông tin thống kê về bộ nhớ của session.
   * Hữu ích để debug hoặc hiển thị trên admin dashboard.
   * @param {Object} session
   * @returns {Object}
   */
  getMemoryStats(session) {
    return {
      totalMessages: session.messages.length,
      hasSummary: !!session.memorySummary,
      summaryLength: session.memorySummary ? session.memorySummary.split(' ').length : 0,
      lastSummarizedAt: session.lastSummarizedAt || null,
      messagesSinceLastSummary: session.messages.length - (session.lastSummarizedAt || 0),
      memoryFrozen: session.memoryFrozen || false,
    };
  }
}

module.exports = new MemoryService();
