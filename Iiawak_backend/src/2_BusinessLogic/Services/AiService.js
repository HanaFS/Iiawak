'use strict';

const axios = require('axios');
const config = require('../../config');

// ─────────────────────────────────────────────────────────────────────────────
// CẤU HÌNH GEMINI
// Tham khảo: SillyTavern — src/endpoints/backends/chat-completions.js
// Hàm sendMakerSuiteRequest() xây dựng payload cho Google AI API.
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Danh sách model hỗ trợ, thêm vào đây khi cần nâng cấp
const GEMINI_MODELS = {
  FLASH:   'gemini-1.5-flash',
  PRO:     'gemini-1.5-pro',
  FLASH_2: 'gemini-2.0-flash',
};

// Cài đặt mặc định cho generation (tương đương generationConfig của SillyTavern)
const DEFAULT_GENERATION_CONFIG = {
  temperature:     0.9,   // Độ sáng tạo (0 = nghiêm túc, 1 = sáng tạo)
  topK:            40,    // Số token ứng cử viên hàng đầu để lấy mẫu
  topP:            0.95,  // Nucleus sampling
  maxOutputTokens: 1024,  // Giới hạn độ dài phản hồi
};

// Cài đặt an toàn nội dung (tương đương GEMINI_SAFETY trong SillyTavern)
// BLOCK_NONE = tắt bộ lọc (dùng cho app roleplay)
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

/**
 * AiService — Giao tiếp với Gemini API.
 *
 * Lấy cảm hứng từ SillyTavern's sendMakerSuiteRequest():
 *   - buildPayload()       ↔  convertGooglePrompt() + generationConfig builder
 *   - generateResponse()   ↔  sendMakerSuiteRequest() (non-streaming)
 *   - streamResponse()     ↔  sendMakerSuiteRequest() với stream=true + forwardFetchResponse()
 */
class AiService {
  constructor() {
    this.apiKey  = config.ai.geminiKey;
    this.model   = config.ai.geminiModel || GEMINI_MODELS.FLASH;
  }

  // ─── HÀM PRIVATE: XÂY DỰNG PAYLOAD ──────────────────────────────────────────

  /**
   * [CORE] Xây dựng payload chuẩn để gửi lên Gemini API.
   *
   * Tương đương convertGooglePrompt() + payload builder trong SillyTavern.
   * SillyTavern tách system_instruction ra khỏi contents[], Gemini yêu cầu điều này.
   *
   * Cấu trúc payload Gemini:
   * {
   *   system_instruction: { parts: [{ text: "..." }] },   ← System Prompt (character persona)
   *   contents: [                                          ← Lịch sử chat
   *     { role: "user",  parts: [{ text: "..." }] },
   *     { role: "model", parts: [{ text: "..." }] },
   *     { role: "user",  parts: [{ text: "tin nhắn mới" }] }  ← Luôn kết thúc bằng user
   *   ],
   *   generationConfig: { temperature, topK, topP, maxOutputTokens },
   *   safetySettings: [...]
   * }
   *
   * @param {string} systemInstruction - Persona/Character prompt
   * @param {Array}  history           - [{role: 'user'|'model', parts: [{text}]}]
   * @param {string} userMessage       - Tin nhắn mới nhất của user
   * @param {Object} options           - Override generation config
   * @returns {Object} Payload hoàn chỉnh
   */
  _buildPayload(systemInstruction, history, userMessage, options = {}) {
    // Đảm bảo history tuân thủ quy tắc alternating user/model của Gemini
    // SillyTavern cũng làm điều này trong convertGooglePrompt()
    const sanitizedHistory = this._sanitizeHistory(history);

    return {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        ...sanitizedHistory,
        // Tin nhắn mới nhất của user luôn ở cuối
        { role: 'user', parts: [{ text: userMessage }] },
      ],
      generationConfig: {
        ...DEFAULT_GENERATION_CONFIG,
        ...options.generationConfig, // Cho phép override từ bên ngoài
      },
      safetySettings: SAFETY_SETTINGS,
    };
  }

  /**
   * Làm sạch history: đảm bảo luân phiên user/model.
   * Gemini trả lỗi nếu có 2 tin nhắn cùng role liên tiếp.
   *
   * @param {Array} history
   * @returns {Array}
   */
  _sanitizeHistory(history) {
    if (!history || history.length === 0) return [];

    const cleaned = [];
    for (const msg of history) {
      // Chuẩn hóa role: 'assistant' → 'model' (SillyTavern cũng làm bước này)
      const role = msg.role === 'assistant' ? 'model' : msg.role;
      const lastMsg = cleaned[cleaned.length - 1];

      if (lastMsg && lastMsg.role === role) {
        // Gộp nội dung thay vì tạo 2 tin cùng role
        lastMsg.parts[0].text += '\n' + (msg.parts?.[0]?.text || msg.content || '');
      } else {
        cleaned.push({
          role,
          parts: [{ text: msg.parts?.[0]?.text || msg.content || '' }],
        });
      }
    }
    return cleaned;
  }

  /**
   * Lấy URL endpoint đầy đủ cho model và action (generateContent / streamGenerateContent).
   * @param {string} action
   * @returns {string}
   */
  _getEndpointUrl(action = 'generateContent') {
    return `${GEMINI_BASE_URL}/${this.model}:${action}?key=${this.apiKey}`;
  }

  // ─── API CÔNG KHAI ────────────────────────────────────────────────────────────

  /**
   * Gửi prompt đến Gemini và nhận TOÀN BỘ phản hồi (non-streaming).
   * Tương đương sendMakerSuiteRequest() với stream=false trong SillyTavern.
   *
   * @param {string} systemInstruction - Persona/Character prompt đã được build sẵn
   * @param {Array}  history           - Lịch sử chat đã format
   * @param {string} userMessage       - Tin nhắn mới của user
   * @param {Object} options           - Tùy chọn thêm (generationConfig override, v.v.)
   * @returns {Promise<string>} Nội dung phản hồi
   */
  async generateResponse(systemInstruction, history, userMessage, options = {}) {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      return '[Hệ thống] Gemini API Key chưa được cấu hình.';
    }

    const payload = this._buildPayload(systemInstruction, history, userMessage, options);

    try {
      const response = await axios.post(this._getEndpointUrl('generateContent'), payload);

      // Gemini trả về: response.data.candidates[0].content.parts[0].text
      const candidate = response.data?.candidates?.[0];

      if (!candidate?.content?.parts?.[0]?.text) {
        // Kiểm tra finish reason để đưa ra lỗi có nghĩa
        const finishReason = candidate?.finishReason;
        if (finishReason === 'SAFETY') {
          return '[Nội dung bị chặn bởi bộ lọc an toàn]';
        }
        return 'Nhân vật đang suy nghĩ... Hãy thử lại sau nhé.';
      }

      return candidate.content.parts[0].text;

    } catch (err) {
      console.error('❌ Gemini API Error:', err.response?.data || err.message);
      throw new Error('Có lỗi xảy ra khi kết nối với trí tuệ nhân vật.');
    }
  }

  /**
   * Gửi prompt đến Gemini và STREAM phản hồi về client theo thời gian thực.
   * Tương đương forwardFetchResponse() trong SillyTavern — pipe SSE stream.
   *
   * Cách dùng ở Controller:
   *   await aiService.streamResponse(systemInstruction, history, userMessage, res);
   *
   * Client nhận theo format Server-Sent Events (SSE):
   *   data: {"text": "Xin chào"}
   *   data: {"text": " bạn"}
   *   data: [DONE]
   *
   * @param {string}   systemInstruction
   * @param {Array}    history
   * @param {string}   userMessage
   * @param {Object}   res    - Express Response object (để pipe stream vào)
   * @param {Object}   options
   */
  async streamResponse(systemInstruction, history, userMessage, res, options = {}) {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      res.write('data: {"error": "API Key chưa cấu hình"}\n\n');
      res.end();
      return;
    }

    const payload = this._buildPayload(systemInstruction, history, userMessage, options);

    // Thiết lập headers cho SSE (Server-Sent Events)
    res.setHeader('Content-Type',  'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection',    'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Tắt nginx buffer

    try {
      // Dùng axios với responseType 'stream' để nhận dữ liệu theo từng chunk
      const streamResp = await axios.post(
        this._getEndpointUrl('streamGenerateContent'),
        payload,
        { responseType: 'stream' }
      );

      let buffer = '';
      let fullText = ''; // Tích lũy toàn bộ để lưu vào DB sau

      streamResp.data.on('data', (chunk) => {
        buffer += chunk.toString();

        // Gemini stream trả về nhiều JSON objects, mỗi cái trên 1 dòng
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Giữ lại dòng chưa hoàn chỉnh

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === '[' || trimmed === ']' || trimmed === ',') continue;

          // Loại bỏ prefix "data: " nếu có
          const jsonStr = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;

          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              fullText += text;
              // Đẩy từng chunk về client theo format SSE
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          } catch {
            // Bỏ qua JSON không hợp lệ (chunk chưa hoàn chỉnh)
          }
        }
      });

      streamResp.data.on('end', () => {
        res.write('data: [DONE]\n\n');
        res.end();
        // Trả về fullText để caller có thể lưu vào DB
        // (Xem cách dùng trong ChatService.sendMessageToAiStream())
        streamResp.data.emit('fullText', fullText);
      });

      streamResp.data.on('error', (err) => {
        console.error('❌ Gemini Stream Error:', err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      });

      // Hủy request nếu client ngắt kết nối (tương đương AbortController của SillyTavern)
      res.on('close', () => {
        streamResp.data.destroy();
      });

      // Trả về Promise resolve khi stream kết thúc kèm fullText
      return new Promise((resolve) => {
        streamResp.data.on('fullText', resolve);
        streamResp.data.on('error', () => resolve(''));
      });

    } catch (err) {
      console.error('❌ Gemini Stream Init Error:', err.response?.data || err.message);
      res.write(`data: ${JSON.stringify({ error: 'Lỗi kết nối AI' })}\n\n`);
      res.end();
      return '';
    }
  }
}

module.exports = new AiService();
