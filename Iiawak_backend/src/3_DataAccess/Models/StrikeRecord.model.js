const mongoose = require('mongoose');
const strikeSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason:    { type: String, required: true },
  severity:  { type: String, enum: ['warning', 'strike', 'ban'], default: 'warning' },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('StrikeRecord', strikeSchema);
