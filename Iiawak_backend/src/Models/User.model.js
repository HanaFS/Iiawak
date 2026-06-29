const mongoose = require('mongoose');
const bcrypt    = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username:       { type: String, required: true, unique: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true },
  password:       { type: String, required: true },
  displayName:    { type: String, required: true },
  avatar:         { type: String, default: '' },
  bio:            { type: String, default: '' },
  kchBalance:     { type: Number, default: 0 },
  checkedInDays:  { type: [String], default: [] }, // format YYYY-MM-DD
  role:           { type: String, enum: ['user', 'admin'], default: 'user' },
  status:         { type: String, enum: ['active', 'banned'], default: 'active' },
  following:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  strikeCount:    { type: Number, default: 0 },
  appLockEnabled: { type: Boolean, default: false },
  appLockPin:     { type: String, default: '' },

  // ── Bảo mật đăng nhập Admin ──────────────────────────────────────────────
  // Số lần nhập sai mật khẩu (reset về 0 khi đăng nhập thành công)
  loginAttempts:  { type: Number, default: 0 },
  // Trạng thái khoá tài khoản:
  //   'No'  → Bình thường, có thể đăng nhập
  //   'Yes' → Bị khoá vĩnh viễn, chỉ vào MongoDB đổi lại 'No' để mở khoá
  adminLocked:    { type: String, enum: ['Yes', 'No'], default: 'No' },

  // ── Khôi phục mật khẩu ──────────────────────────────────────────────────
  resetPasswordOtp:     { type: String },
  resetPasswordExpires: { type: Date },

  createdAt:      { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
