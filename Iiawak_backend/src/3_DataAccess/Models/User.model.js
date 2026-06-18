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
