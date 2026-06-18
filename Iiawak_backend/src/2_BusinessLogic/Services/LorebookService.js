'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// LorebookService — Hệ thống World Info / Lorebook.
//
// Lấy cảm hứng từ SillyTavern's World Info system (world-info.js).
//
// Ý tưởng cốt lõi của SillyTavern:
//   1. Creator định nghĩa các "entry" (từ điển ngữ cảnh), mỗi entry có:
//      - keys[]:      Từ khóa kích hoạt (regex hoặc plaintext)
//      - content:     Đoạn văn bản ngữ cảnh được chèn vào prompt
//      - priority:    Thứ tự ưu tiên nếu vượt quá giới hạn token
//      - position:    Chèn vào đầu (before_char) hay cuối (after_char) context
//   2. Trước mỗi lần gọi AI, SillyTavern scan toàn bộ history gần nhất
//      để tìm từ khóa khớp, rồi inject nội dung của các entry khớp vào prompt.
//
// Module này triển khai lại logic đó cho MongoDB + Mongoose.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vị trí chèn Lorebook entry vào context (tương đương position trong SillyTavern)
 */
const LOREBOOK_POSITION = {
  BEFORE_CHAR:  'before_char',  // Chèn VÀO ĐẦU system instruction
  AFTER_CHAR:   'after_char',   // Chèn VÀO CUỐI system instruction
  AUTHOR_NOTE:  'author_note',  // Chèn như Author's Note (ở vị trí depth nhất định)
};

class LorebookService {

  /**
   * [CORE] Scan lịch sử chat gần đây và trả về danh sách entry được kích hoạt.
   *
   * Tương đương SillyTavern's checkWorldInfoTriggers() trong world-info.js.
   * SillyTavern scan toàn bộ (hoặc N tin gần nhất) để tìm key matches.
   *
   * @param {Array}  lorebookEntries - Mảng entry [{keys, content, position, priority, enabled}]
   * @param {Array}  recentMessages  - Lịch sử chat gần đây để scan [{role, content}]
   * @param {number} scanDepth       - Số tin nhắn gần nhất để scan (mặc định 5)
   * @returns {Object} { beforeChar: string[], afterChar: string[], authorNote: string[] }
   */
  getActivatedEntries(lorebookEntries, recentMessages, scanDepth = 5) {
    if (!lorebookEntries || lorebookEntries.length === 0) {
      return { beforeChar: [], afterChar: [], authorNote: [] };
    }

    // Lấy N tin nhắn gần nhất để scan (giống SillyTavern's "scan depth")
    const messagesToScan = recentMessages.slice(-scanDepth);
    const textToScan = messagesToScan.map(m => m.content || '').join('\n').toLowerCase();

    const beforeChar  = [];
    const afterChar   = [];
    const authorNote  = [];

    // Sắp xếp theo priority (cao = ưu tiên trước), giống SillyTavern
    const sortedEntries = [...lorebookEntries]
      .filter(e => e.enabled !== false)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const entry of sortedEntries) {
      if (!entry.content || !entry.keys || entry.keys.length === 0) continue;

      // Kiểm tra xem bất kỳ key nào có khớp với text không
      const isTriggered = entry.keys.some(key => {
        if (!key || !key.trim()) return false;

        // Hỗ trợ regex key (bắt đầu và kết thúc bằng /)
        if (key.startsWith('/') && key.lastIndexOf('/') > 0) {
          try {
            const lastSlash = key.lastIndexOf('/');
            const pattern = key.slice(1, lastSlash);
            const flags   = key.slice(lastSlash + 1) || 'i';
            return new RegExp(pattern, flags).test(textToScan);
          } catch {
            return false; // Invalid regex → bỏ qua
          }
        }

        // Plain text key (case-insensitive, word boundary aware)
        return textToScan.includes(key.toLowerCase().trim());
      });

      if (isTriggered) {
        const position = entry.position || LOREBOOK_POSITION.BEFORE_CHAR;
        if (position === LOREBOOK_POSITION.BEFORE_CHAR) {
          beforeChar.push(entry.content);
        } else if (position === LOREBOOK_POSITION.AFTER_CHAR) {
          afterChar.push(entry.content);
        } else if (position === LOREBOOK_POSITION.AUTHOR_NOTE) {
          authorNote.push(entry.content);
        }
      }
    }

    return { beforeChar, afterChar, authorNote };
  }

  /**
   * [CORE] Inject Lorebook entries vào System Instruction.
   *
   * Tương đương SillyTavern's injectWorldInfo() —
   * chèn activated entries vào đầu / cuối system prompt.
   *
   * Cấu trúc cuối cùng:
   *   [beforeChar entries]
   *   [Character System Instruction gốc]
   *   [afterChar entries]
   *
   * @param {string} systemInstruction  - System instruction gốc của nhân vật
   * @param {Object} activated          - Kết quả từ getActivatedEntries()
   * @returns {string} System instruction đã được inject lorebook
   */
  injectIntoSystemInstruction(systemInstruction, activated) {
    const parts = [];

    // Chèn beforeChar entries (World Info Before Char)
    if (activated.beforeChar.length > 0) {
      parts.push('## World Context');
      parts.push(activated.beforeChar.join('\n\n'));
      parts.push('');
    }

    // System instruction gốc
    parts.push(systemInstruction);

    // Chèn afterChar entries (World Info After Char)
    if (activated.afterChar.length > 0) {
      parts.push('');
      parts.push('## Additional World Details');
      parts.push(activated.afterChar.join('\n\n'));
    }

    return parts.join('\n').trim();
  }

  /**
   * Inject Author's Note vào history ở vị trí depth nhất định.
   *
   * Tương đương Author's Note trong SillyTavern:
   * Chèn một lệnh cố định vào giữa history (thường ở depth=2 từ cuối)
   * để ép AI tuân thủ nghiêm ngặt (ví dụ: phong cách viết, ngôn ngữ...).
   *
   * @param {Array}  history      - Mảng Gemini history format
   * @param {string} authorNote   - Nội dung Author's Note
   * @param {number} depth        - Vị trí từ cuối (mặc định 2 = cách 2 tin từ cuối)
   * @returns {Array} History đã được inject Author's Note
   */
  injectAuthorNote(history, authorNote, depth = 2) {
    if (!authorNote || !authorNote.trim() || history.length === 0) {
      return history;
    }

    const result = [...history];

    // Tính vị trí chèn (đếm từ cuối, nhưng phải là turn của 'user')
    // SillyTavern chèn Author's Note như một "system message" vào giữa conversation
    const insertAt = Math.max(0, result.length - depth * 2);

    const noteEntry = {
      role: 'user',
      parts: [{ text: `[AUTHOR'S INSTRUCTION: ${authorNote}]` }],
    };
    const noteAck = {
      role: 'model',
      parts: [{ text: '[Understood. I will follow this instruction.]' }],
    };

    result.splice(insertAt, 0, noteEntry, noteAck);
    return result;
  }

  /**
   * Pipeline đầy đủ: Scan + Inject vào cả system instruction và history.
   *
   * Đây là hàm chính được gọi từ ChatService.
   *
   * @param {string} systemInstruction  - System instruction từ _buildSystemInstruction()
   * @param {Array}  history            - Recent history array (Gemini format)
   * @param {Array}  rawMessages        - Raw session messages để scan keywords
   * @param {Object} character          - Character document (có .lorebook, .authorNote)
   * @returns {{ systemInstruction: string, history: Array }}
   */
  process(systemInstruction, history, rawMessages, character) {
    let finalSystem  = systemInstruction;
    let finalHistory = history;

    // Bước 1: Xử lý Lorebook entries (nếu character có lorebook)
    if (character.lorebook && character.lorebook.length > 0) {
      const scanDepth = character.lorebookScanDepth || 5;
      const activated = this.getActivatedEntries(character.lorebook, rawMessages, scanDepth);

      finalSystem = this.injectIntoSystemInstruction(finalSystem, activated);

      // Author Note entries từ lorebook cũng được inject vào history
      if (activated.authorNote.length > 0) {
        const combinedNote = activated.authorNote.join(' ');
        finalHistory = this.injectAuthorNote(finalHistory, combinedNote);
      }
    }

    // Bước 2: Xử lý Author's Note cố định của character (nếu có)
    // (Khác với Lorebook — cái này luôn được chèn, không cần trigger keyword)
    if (character.authorNote && character.authorNote.trim()) {
      const noteDepth = character.authorNoteDepth || 2;
      finalHistory = this.injectAuthorNote(finalHistory, character.authorNote, noteDepth);
    }

    return { systemInstruction: finalSystem, history: finalHistory };
  }
}

module.exports = new LorebookService();
