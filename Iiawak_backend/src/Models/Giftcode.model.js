const mongoose = require('mongoose');
const giftcodeSchema = new mongoose.Schema({
  code:      { type: String, required: true, unique: true },
  rewardKch: { type: Number, required: true },
  maxUses:   { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date },
  usedBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Giftcode', giftcodeSchema);
