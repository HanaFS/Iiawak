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
  advancedSettings: {
    npcs:           { type: String, default: '' },
    otherInfo:      { type: String, default: '' },
    userIdentity:   { type: String, default: '' },
    speakingStyle:  { type: String, default: '' },
    lifeExperience: { type: String, default: '' },
  },
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
