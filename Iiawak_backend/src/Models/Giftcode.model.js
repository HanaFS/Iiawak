const mongoose = require('mongoose');
const giftcodeSchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true },
  rewardKch:    { type: Number, required: true },
  maxUses:      { type: Number, default: 1 },
  usedCount:    { type: Number, default: 0 },
  scope:        { type: String, enum: ['server', 'new', 'user'], default: 'server' },
  active:       { type: Boolean, default: true },
  unlimitedQty: { type: Boolean, default: false },
  uid:          { type: String, default: '' }, // comma separated usernames or IDs
  noLimit:      { type: Boolean, default: false },
  startDate:    { type: Date },
  endDate:      { type: Date },
  expiresAt:    { type: Date }, // legacy
  usedBy:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt:    { type: Date, default: Date.now },
});
module.exports = mongoose.model('Giftcode', giftcodeSchema);
