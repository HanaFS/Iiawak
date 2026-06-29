const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
  authorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:       { type: String, required: true },
  images:        [{ type: String }],
  characterTag:  { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
  fireCount:     { type: Number, default: 0 },
  viewCount:     { type: Number, default: 0 },
  likedBy:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentCount:  { type: Number, default: 0 },
  isViral:       { type: Boolean, default: false },
  isHidden:      { type: Boolean, default: false },
  distributionStep: { type: Number, default: 100 },
  createdAt:     { type: Date, default: Date.now },
});
module.exports = mongoose.model('Post', postSchema);
