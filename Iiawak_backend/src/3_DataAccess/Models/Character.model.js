const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  avatar:       { type: String, required: true },
  gender:       { type: String, required: true },
  tags:         [{ type: String }],
  slogan:       { type: String, required: true, maxlength: 200 },
  creatorNotes: { type: String },
  privacy:      { type: String, enum: ['public', 'private'], default: 'public' },
  ageRating:    { type: String, enum: ['all', 'adult'], default: 'all' },
  publicInfo:   { type: String, required: true },
  personality:  { type: String, required: true },
  openingLine:  { type: String, required: true },
  bio:          { type: String, required: true },
  firstMessage: { type: String, required: true },
  status:       { type: String, required: true },
  chatMode:     { type: String, enum: ['normal', 'story', 'both'], default: 'both' },

  // ── Backend AI Provider (Mặc định: gemini, Mới: character_ai) ──
  aiBackend:      { type: String, enum: ['gemini', 'character_ai'], default: 'gemini' },
  caiCharacterId: { type: String, default: '' }, // ID của nhân vật trên trang web character.ai

  // SillyTavern-style: System Prompt template hỗ trợ macro {{user}}, {{char}}, {{personality}}...
  // Nếu để trống, ChatService sẽ tự build từ các trường riêng lẻ.
  systemPromptTemplate: { type: String, default: '' },

  // SillyTavern-style: Dialogue Examples (few-shot examples) để định hình văn phong AI.
  // Format: mảng các cặp { user: '...', assistant: '...' }
  dialogueExamples: [{
    user:      { type: String, required: true },
    assistant: { type: String, required: true },
  }],

  advancedSettings: {
    npcs:           { type: String, default: '' },
    otherInfo:      { type: String, default: '' },
    userIdentity:   { type: String, default: '' },
    speakingStyle:  { type: String, default: '' },
    lifeExperience: { type: String, default: '' },
  },

  // ── SillyTavern: Author's Note ────────────────────────────────────────────
  // Lệnh cố định được chèn vào history ở độ sâu nhất định.
  // Ví dụ: "Hãy viết theo phong cách thơ lục bát", "Chỉ dùng tiếng Việt thuần"
  authorNote:      { type: String, default: '' },
  authorNoteDepth: { type: Number, default: 2, min: 1, max: 10 },

  // ── SillyTavern: Lorebook / World Info ───────────────────────────────────
  // Mảng từ điển ngữ cảnh. Mỗi entry có từ khóa, khi xuất hiện trong chat
  // sẽ tự động chèn content của entry đó vào prompt.
  lorebook: [{
    keys:     [{ type: String }],    // Từ khóa kích hoạt (hỗ trợ /regex/)
    content:  { type: String, required: true }, // Nội dung ngữ cảnh được chèn
    position: { type: String, enum: ['before_char', 'after_char', 'author_note'], default: 'before_char' },
    priority: { type: Number, default: 0 },     // Ưu tiên cao hơn = được chèn trước
    enabled:  { type: Boolean, default: true },
  }],
  lorebookScanDepth: { type: Number, default: 5 }, // Scan bao nhiêu tin gần nhất

  isApproved:   { type: Boolean, default: true },
  isBanned:     { type: Boolean, default: false },
  totalChats:   { type: Number, default: 0 },
  totalLikes:   { type: Number, default: 0 },
  creatorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now },
});

characterSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Character', characterSchema);
