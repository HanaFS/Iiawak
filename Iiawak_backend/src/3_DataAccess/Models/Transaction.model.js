const mongoose = require('mongoose');
const transactionSchema = new mongoose.Schema({
  txId:      { type: String, required: true, unique: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amountKch: { type: Number, required: true },
  priceVnd:  { type: Number },
  type:      { type: String, enum: ['TOPUP', 'GIFTCODE', 'SPEND', 'REWARD'], required: true },
  status:    { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'success' },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Transaction', transactionSchema);
