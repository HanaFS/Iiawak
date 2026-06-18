'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// MacroService — Hệ thống thay thế biến động trong System Prompt.
//
// Lấy cảm hứng từ SillyTavern's substituteParams() và MacrosParser.
//
// SillyTavern hỗ trợ hàng chục macro như:
//   {{user}}, {{char}}, {{personality}}, {{description}},
//   {{scenario}}, {{example_dialogue}}, {{time}}, {{date}},
//   {{random::A::B::C}}, {{pick::A::B}}, ...
//
// Module này triển khai lại bộ macro thiết yếu nhất cho Iiawak,
// phù hợp với Character schema hiện tại.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tập hợp tất cả macro được hỗ trợ.
 * Mỗi key là tên macro (không có dấu {{}}), value là mô tả để tham khảo.
 */
const SUPPORTED_MACROS = {
  // ── Danh tính ──────────────────────────────────────────────────────────────
  'user':            'Tên hiển thị của người dùng',
  'username':        'Username (tên đăng nhập) của người dùng',
  'char':            'Tên nhân vật AI',
  // ── Nhân vật ───────────────────────────────────────────────────────────────
  'personality':     'Tính cách của nhân vật (Character.personality)',
  'description':     'Mô tả công khai (Character.publicInfo)',
  'bio':             'Tiểu sử (Character.bio)',
  'scenario':        'Kịch bản/Bối cảnh (Character.advancedSettings.otherInfo)',
  'speaking_style':  'Phong cách nói (Character.advancedSettings.speakingStyle)',
  'user_identity':   'Vai trò của user trong thế giới nhân vật (Character.advancedSettings.userIdentity)',
  'first_message':   'Lời chào đầu tiên của nhân vật',
  'status':          'Trạng thái hiện tại của nhân vật',
  // ── Thời gian ──────────────────────────────────────────────────────────────
  'time':            'Giờ hiện tại (HH:MM)',
  'date':            'Ngày hiện tại (DD/MM/YYYY)',
  'weekday':         'Thứ trong tuần (Thứ Hai, Thứ Ba...)',
  // ── Ngữ cảnh chat ──────────────────────────────────────────────────────────
  'memory':          'Bản tóm tắt bộ nhớ hội thoại (nếu có)',
  'message_count':   'Số tin nhắn đã gửi trong session',
};

class MacroService {
  // ─── HÀM PRIVATE ──────────────────────────────────────────────────────────

  /**
   * Trả về tên thứ trong tuần bằng tiếng Việt.
   * @returns {string}
   */
  _getVietnameseWeekday() {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[new Date().getDay()];
  }

  /**
   * Xử lý macro đặc biệt {{random::A::B::C}} — chọn ngẫu nhiên 1 trong các giá trị.
   * SillyTavern gọi đây là "roll macro".
   *
   * @param {string} text
   * @returns {string}
   */
  _processRandomMacro(text) {
    return text.replace(/\{\{random::([^}]+)\}\}/g, (_, options) => {
      const choices = options.split('::');
      return choices[Math.floor(Math.random() * choices.length)];
    });
  }

  /**
   * Xử lý macro {{pick::A::B}} — chọn ngẫu nhiên (alias của random).
   * @param {string} text
   * @returns {string}
   */
  _processPickMacro(text) {
    return text.replace(/\{\{pick::([^}]+)\}\}/g, (_, options) => {
      const choices = options.split('::');
      return choices[Math.floor(Math.random() * choices.length)];
    });
  }

  // ─── API CÔNG KHAI ──────────────────────────────────────────────────────────

  /**
   * [CORE] Thay thế tất cả macro trong một chuỗi văn bản.
   *
   * Tương đương substituteParams() và MacrosParser.replace() trong SillyTavern.
   *
   * Ví dụ đầu vào:
   *   "Xin chào {{user}}! Tôi là {{char}}, {{personality}}."
   *
   * Ví dụ đầu ra:
   *   "Xin chào Hana! Tôi là Kira, một cô gái vui vẻ và năng động."
   *
   * @param {string} template   - Chuỗi văn bản chứa macro (ví dụ: System Prompt)
   * @param {Object} context    - Dữ liệu để điền vào macro
   * @param {Object} context.user       - User document (có .displayName, .username)
   * @param {Object} context.character  - Character document từ MongoDB
   * @param {Object} context.session    - ChatSession document (có .memorySummary, .messages)
   * @returns {string} Văn bản đã được thay thế macro
   */
  substitute(template, context = {}) {
    if (!template) return '';

    const { user, character, session } = context;
    const now = new Date();

    // Xây dựng bảng tra cứu giá trị cho từng macro
    const macroValues = {
      // ── Danh tính ──
      'user':           user?.displayName || user?.username || 'Người dùng',
      'username':       user?.username || 'user',
      'char':           character?.name || 'AI',

      // ── Nhân vật ──
      'personality':    character?.personality || '',
      'description':    character?.publicInfo || '',
      'bio':            character?.bio || '',
      'scenario':       character?.advancedSettings?.otherInfo || '',
      'speaking_style': character?.advancedSettings?.speakingStyle || '',
      'user_identity':  character?.advancedSettings?.userIdentity || '',
      'first_message':  character?.firstMessage || '',
      'status':         character?.status || 'available',

      // ── Thời gian ──
      'time':    now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      'date':    now.toLocaleDateString('vi-VN'),
      'weekday': this._getVietnameseWeekday(),

      // ── Ngữ cảnh chat ──
      'memory':         session?.memorySummary || '',
      'message_count':  String(session?.messages?.length || 0),
    };

    // Thay thế từng macro theo pattern {{tên_macro}}
    let result = template;
    for (const [macro, value] of Object.entries(macroValues)) {
      // Dùng regex để thay thế không phân biệt chữ hoa/thường, giống SillyTavern
      result = result.replace(new RegExp(`\\{\\{${macro}\\}\\}`, 'gi'), value);
    }

    // Xử lý macro phức tạp (random, pick)
    result = this._processRandomMacro(result);
    result = this._processPickMacro(result);

    // Dọn dẹp: xóa các macro không nhận ra (thay bằng chuỗi rỗng)
    result = result.replace(/\{\{[^}]+\}\}/g, '');

    return result;
  }

  /**
   * Tiện ích: Build System Instruction với macro đã được thay thế.
   * Đây là hàm wrapper thuận tiện để dùng trong ChatService.
   *
   * @param {string} template   - System Instruction template (có thể chứa macro)
   * @param {Object} context    - { user, character, session }
   * @returns {string}
   */
  buildSystemInstruction(template, context) {
    return this.substitute(template, context);
  }

  /**
   * Kiểm tra xem một chuỗi có chứa macro hay không.
   * Hữu ích để kiểm tra trước khi xử lý.
   *
   * @param {string} text
   * @returns {boolean}
   */
  hasMacros(text) {
    return /\{\{[^}]+\}\}/.test(text);
  }

  /**
   * Liệt kê tất cả macro được tìm thấy trong chuỗi văn bản.
   * Hữu ích để debug hoặc validate Character Card từ user input.
   *
   * @param {string} text
   * @returns {string[]} Danh sách tên macro (không có dấu {{}})
   */
  extractMacros(text) {
    const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(m => m.replace(/\{\{|\}\}/g, '').toLowerCase());
  }

  /**
   * Validate xem Character Card template có dùng macro không hợp lệ không.
   *
   * @param {string} text
   * @returns {{ valid: boolean, unknownMacros: string[] }}
   */
  validateMacros(text) {
    const found = this.extractMacros(text);
    // Loại trừ macro động (random, pick)
    const staticMacros = found.filter(m => !m.startsWith('random::') && !m.startsWith('pick::'));
    const unknownMacros = staticMacros.filter(m => !(m in SUPPORTED_MACROS));
    return {
      valid: unknownMacros.length === 0,
      unknownMacros,
      supportedMacros: Object.keys(SUPPORTED_MACROS),
    };
  }
}

module.exports = new MacroService();
