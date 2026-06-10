'use strict';
const axios  = require('axios');
const config = require('../../config');

/**
 * AiService — Giao tiếp với Gemini API.
 */
class AiService {
  constructor() {
    this.apiKey = config.ai.geminiKey;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  /**
   * Gửi prompt đến Gemini và nhận phản hồi.
   * @param {string} systemInstruction - Mô tả tính cách nhân vật (System Prompt)
   * @param {Array} history - Lịch sử trò chuyện [{role: 'user'|'model', parts: [{text: '...'}]}]
   * @param {string} userMessage - Tin nhắn mới của user
   */
  async generateResponse(systemInstruction, history, userMessage) {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      return "[Hệ thống] Gemini API Key chưa được cấu hình. Vui lòng kiểm tra file .env";
    }

    try {
      const response = await axios.post(`${this.apiUrl}?key=${this.apiKey}`, {
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          ...history,
          {
            role: 'user',
            parts: [{ text: userMessage }]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1024,
        }
      });

      if (response.data && response.data.candidates && response.data.candidates[0].content) {
        return response.data.candidates[0].content.parts[0].text;
      }

      return "Nhân vật đang suy nghĩ... Hãy thử lại sau nhé.";
    } catch (err) {
      console.error('❌ Gemini API Error:', err.response ? err.response.data : err.message);
      return "Có lỗi xảy ra khi kết nối với trí tuệ nhân vật.";
    }
  }
}

module.exports = new AiService();
