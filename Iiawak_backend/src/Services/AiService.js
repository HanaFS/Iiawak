'use strict';

const { GoogleGenAI } = require('@google/genai');
const config = require('../config');

// ─────────────────────────────────────────────────────────────────────────────
// CẤU HÌNH GEMINI — dùng SDK mới @google/genai với cơ chế ai.chats.create()
// SDK tự động quản lý lịch sử hội thoại gửi/nhận, không cần tự duy trì mảng
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_MODELS = {
  FLASH:   'gemini-1.5-flash',
  PRO:     'gemini-1.5-pro',
  FLASH_2: 'gemini-2.0-flash',
};

// Cài đặt an toàn: BLOCK_NONE để phù hợp với app roleplay
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

/**
 * AiService — Giao tiếp với Gemini API qua SDK @google/genai mới.
 *
 * Thay đổi chính so với phiên bản cũ (dùng axios + generateContent):
 *   - Dùng ai.chats.create() → SDK TỰ ĐỘNG quản lý lịch sử hội thoại
 *   - Không cần tự build/sanitize mảng history trước khi gọi
 *   - Lịch sử được khởi tạo từ session.messages trong MongoDB
 *   - Mỗi lần gọi sendMessageToAi sẽ tạo một Chat instance mới với history đầy đủ
 */
class AiService {
  constructor() {
    this.apiKey = config.ai.geminiKey;
    this.model  = config.ai.geminiModel || GEMINI_MODELS.FLASH_2;
    // Khởi tạo client một lần duy nhất
    this._ai = null;
  }

  /** Lazy-init GoogleGenAI client */
  _getClient() {
    if (!this._ai) {
      this._ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
    return this._ai;
  }

  /**
   * Chuẩn hóa mảng session.messages (MongoDB format) thành history format của SDK.
   *
   * MongoDB lưu: { role: 'user'|'assistant', content: '...' }
   * SDK cần:     { role: 'user'|'model',     parts: [{ text: '...' }] }
   *
   * SDK cũng yêu cầu history phải xen kẽ user/model đúng quy tắc.
   * Nếu có 2 tin nhắn cùng role liền kề → gộp lại.
   *
   * @param {Array} messages - session.messages từ MongoDB
   * @returns {Array} history đã chuẩn hóa theo SDK format
   */
  _buildHistoryFromSession(messages) {
    if (!messages || messages.length === 0) return [];

    const cleaned = [];
    for (const msg of messages) {
      // Chuẩn hóa role: 'assistant' → 'model'
      const role = msg.role === 'assistant' ? 'model' : msg.role;
      const text = msg.content || '';

      const last = cleaned[cleaned.length - 1];
      if (last && last.role === role) {
        // Gộp nội dung thay vì tạo 2 turn cùng role (Gemini không cho phép)
        last.parts[0].text += '\n' + text;
      } else {
        cleaned.push({ role, parts: [{ text }] });
      }
    }
    return cleaned;
  }

  /**
   * [CORE] Gửi tin nhắn đến Gemini và nhận phản hồi đầy đủ (non-streaming).
   *
   * Sử dụng ai.chats.create() thay vì gọi thẳng generateContent:
   *   - history: Lịch sử từ DB được nạp vào Chat instance
   *   - chat.sendMessage(userMessage): SDK tự append vào history và gửi lên Gemini
   *
   * @param {string} systemInstruction - System prompt (character persona)
   * @param {Array}  sessionMessages   - Mảng session.messages từ MongoDB
   * @param {string} userMessage       - Tin nhắn mới của user
   * @param {Object} options           - Override generation config
   * @returns {Promise<string>}        - Nội dung phản hồi của AI
   */
  async generateResponse(systemInstruction, sessionMessages, userMessage, options = {}) {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      return '[Hệ thống] Gemini API Key chưa được cấu hình.';
    }

    const ai      = this._getClient();
    const history = this._buildHistoryFromSession(sessionMessages);

    try {
      // Tạo Chat instance với system instruction và history đã có
      const chat = ai.chats.create({
        model: this.model,
        config: {
          systemInstruction,
          temperature:     options.temperature     ?? 0.9,
          topK:            options.topK            ?? 40,
          topP:            options.topP            ?? 0.95,
          maxOutputTokens: options.maxOutputTokens ?? 1024,
          safetySettings:  SAFETY_SETTINGS,
        },
        history,  // SDK tự quản lý lịch sử từ đây
      });

      // Gửi tin nhắn mới — SDK tự thêm vào history bên trong
      const response = await chat.sendMessage({ message: userMessage });
      const text = response.text;

      if (!text) {
        return 'Nhân vật đang suy nghĩ... Hãy thử lại sau nhé.';
      }
      return text;

    } catch (err) {
      console.error('❌ Gemini SDK Error (generateResponse):', err.message);
      throw new Error('Có lỗi xảy ra khi kết nối với trí tuệ nhân vật.');
    }
  }

  /**
   * Gửi tin nhắn và STREAM phản hồi về client qua Server-Sent Events.
   *
   * Dùng chat.sendMessageStream() thay cho streamGenerateContent:
   *   - Nhận AsyncIterable<GenerateContentResponse>
   *   - Pipe từng chunk về client theo format SSE
   *
   * @param {string}   systemInstruction
   * @param {Array}    sessionMessages   - session.messages từ DB
   * @param {string}   userMessage
   * @param {Object}   res              - Express Response (để pipe SSE)
   * @param {Object}   options
   * @returns {Promise<string>}          - fullText tích lũy (để lưu DB)
   */
  async streamResponse(systemInstruction, sessionMessages, userMessage, res, options = {}) {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      res.write('data: {"error": "API Key chưa cấu hình"}\n\n');
      res.end();
      return '';
    }

    const ai      = this._getClient();
    const history = this._buildHistoryFromSession(sessionMessages);

    // Thiết lập headers SSE
    res.setHeader('Content-Type',      'text/event-stream');
    res.setHeader('Cache-Control',     'no-cache');
    res.setHeader('Connection',        'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const chat = ai.chats.create({
        model: this.model,
        config: {
          systemInstruction,
          temperature:     options.temperature     ?? 0.9,
          topK:            options.topK            ?? 40,
          topP:            options.topP            ?? 0.95,
          maxOutputTokens: options.maxOutputTokens ?? 1024,
          safetySettings:  SAFETY_SETTINGS,
        },
        history,
      });

      // sendMessageStream trả về AsyncIterable
      const stream = await chat.sendMessageStream({ message: userMessage });

      let fullText = '';

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
      return fullText;

    } catch (err) {
      console.error('❌ Gemini SDK Stream Error:', err.message);
      if (!res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: 'Lỗi kết nối AI' })}\n\n`);
      }
      res.end();
      return '';
    }
  }
}

module.exports = new AiService();
