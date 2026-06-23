const mongoose = require('mongoose');
const chatSessionSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  characterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', required: true },
  mode:        { type: String, enum: ['normal', 'story'], default: 'normal' },
  messages: [{
    role:      { type: String, enum: ['user', 'assistant'], required: true },
    content:   { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],

  // ── SillyTavern: Memory / Summarization fields ──────────────────────────────
  memorySummary:    { type: String, default: '' },    // Bản tóm tắt lịch sử hiện tại
  lastSummarizedAt: { type: Number, default: 0 },     // Index tin nhắn lúc tóm tắt gần nhất
  memoryFrozen:     { type: Boolean, default: false }, // Tạm dừng tóm tắt tự động

  // ── Character.AI field ──
  caiChatId:        { type: String, default: '' },    // ID của đoạn chat trên Character.AI


  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
chatSessionSchema.index({ userId: 1, characterId: 1 });
module.exports = mongoose.model('ChatSession', chatSessionSchema);

