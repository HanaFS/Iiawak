const mongoose = require('mongoose');
const transactionSchema = new mongoose.Schema({
  txId:               { type: String, required: true, unique: true },
  userId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amountKch:          { type: Number, required: true },
  priceVnd:           { type: Number },
  type:               { type: String, enum: ['TOPUP', 'GIFTCODE', 'SPEND', 'REWARD'], required: true },
  status:             { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'success' },
  paymentMethod:      { type: String, enum: ['VNPAY', 'GIFTCODE', 'SYSTEM'], default: 'SYSTEM' },
  packageId:          { type: mongoose.Schema.Types.ObjectId, ref: 'TopupPackage' },
  // VNPay specific fields
  vnp_TransactionNo:  { type: String },
  vnp_BankCode:       { type: String },
  vnp_BankTranNo:     { type: String },
  vnp_PayDate:        { type: String },
  vnp_ResponseCode:   { type: String },
  // Refund fields
  refundReason:       { type: String },
  refundedAt:         { type: Date },
  createdAt:          { type: Date, default: Date.now },
  updatedAt:          { type: Date, default: Date.now },
});

// Index for quick queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
