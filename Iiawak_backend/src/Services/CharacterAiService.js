'use strict';
const CharacterAI = require('node_characterai');
const config      = require('../../config');
const logger      = require('../Logger/logger');
const AppError    = require('../Exceptions/AppError');

/**
 * CharacterAiService — Tích hợp thư viện node_characterai.
 * Cho phép backend chat với các nhân vật thuộc hệ sinh thái Character.AI.
 */
class CharacterAiService {
  constructor() {
    this.cai = new CharacterAI();
    this.isAuthenticated = false;
    this.isInitializing = false;
  }

  /**
   * Khởi tạo kết nối với Character.AI.
   * Gọi lúc boot server hoặc lazy load khi có request đầu tiên.
   */
  async init() {
    if (this.isAuthenticated) return;
    if (this.isInitializing) {
      // Đợi cho đến khi quá trình init hoàn tất
      while (this.isInitializing) {
        await new Promise(r => setTimeout(r, 500));
      }
      return;
    }

    this.isInitializing = true;
    try {
      // Dùng session token từ biến môi trường (Khuyên dùng)
      if (process.env.CAI_SESSION_TOKEN && process.env.CAI_SESSION_TOKEN.trim() !== '') {
        await this.cai.authenticateWithToken(process.env.CAI_SESSION_TOKEN);
        logger.info('✅ Character.AI authenticated with CAI_SESSION_TOKEN');
      } else {
        // Fallback: Guest authentication (Bị giới hạn tính năng)
        logger.info('⏳ Bắt đầu authenticateAsGuest() qua Puppeteer...');
        // Thêm timeout 15 giây để tránh treo vĩnh viễn do Cloudflare chặn
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Cloudflare block timeout')), 15000)
        );
        await Promise.race([this.cai.authenticateAsGuest(), timeoutPromise]);
        logger.info('⚠️ Character.AI authenticated as GUEST. (CAI_SESSION_TOKEN not found)');
      }
      this.isAuthenticated = true;
    } catch (err) {
      logger.error('❌ Failed to authenticate Character.AI:', err.message);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Gửi tin nhắn đến một character ID trên Character.AI.
   * Nếu đã có externalChatId (caiChatId) từ phiên trước, dùng nó để tiếp tục.
   *
   * @param {string} caiCharacterId - Ví dụ: "8_1NyR8w1dOXmI1uWaieQcd147hecbdIK7CeEAIrdJw"
   * @param {string} caiChatId      - ID phiên chat của CAI (lưu trong ChatSession)
   * @param {string} message        - Nội dung tin nhắn của user
   * @returns {Promise<Object>} { text: string, newCaiChatId: string }
   */
  async sendMessage(caiCharacterId, caiChatId, message) {
    await this.init();

    if (!this.isAuthenticated) {
      throw new AppError('Character.AI backend is not authenticated or currently unavailable', 503);
    }

    if (!caiCharacterId) {
      throw new AppError('Missing caiCharacterId for Character.AI backend', 400);
    }

    try {
      // 1. Tạo hoặc lấy phiên chat. node_characterai tự động xử lý caiChatId cũ nếu chat.chatId khớp.
      // Tuy nhiên thư viện thiết kế chủ yếu gọi createOrContinueChat bằng characterId.
      // Theo docs, có chức năng createOrContinueChat(characterId, externalChatId) (nếu thư viện support)
      // Hiện tại 1.x support `createOrContinueChat(characterId)`
      // Cứ gọi createOrContinueChat, nếu session của account CAI đã có chat cũ với char này, nó sẽ lấy chat mới nhất.
      const chat = await this.cai.createOrContinueChat(caiCharacterId);
      
      // Nếu có caiChatId nhưng không khớp, có thể cần set chat.chatId hoặc dùng hàm khác
      // Với node_characterai 1.x, createOrContinueChat trả về object `chat` chứa state
      // Nếu backend muốn force dùng caiChatId:
      if (caiChatId && chat.externalId !== caiChatId) {
        // Có thể cần fetch history theo caiChatId, nhưng ta giữ đơn giản:
        chat.externalId = caiChatId; // Cập nhật ID nội bộ (dành cho node_characterai <= 1.2.5)
      }

      // 2. Gửi tin nhắn và đợi phản hồi
      logger.info(`Sending message to CAI char ${caiCharacterId}...`);
      const response = await chat.sendAndAwaitResponse(message, true);
      
      logger.info(`CAI Response received: ${JSON.stringify(response)}`);

      // 3. Trả về text và externalId mới (để cập nhật vào ChatSession model)
      return {
        text: response?.text || "[Character.AI không trả về văn bản - API có thể đã thay đổi]",
        newCaiChatId: chat.externalId,
      };
    } catch (err) {
      logger.error(`❌ Character.AI Chat Error (char: ${caiCharacterId}):`, err.message);
      throw new AppError('Lỗi khi giao tiếp với Character.AI: ' + err.message, 500);
    }
  }
}

module.exports = new CharacterAiService();
