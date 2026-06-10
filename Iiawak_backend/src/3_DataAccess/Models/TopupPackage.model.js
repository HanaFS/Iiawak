const mongoose = require('mongoose');
const topupPackageSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  kch:       { type: Number, required: true },
  bonus:     { type: Number, default: 0 },
  icon:      { type: String, default: '💎' },
  isActive:  { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('TopupPackage', topupPackageSchema);
