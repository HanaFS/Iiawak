'use strict';
const Character = require('../Models/Character.model');

/**
 * CharacterRepository — Tất cả Mongoose queries cho Character collection.
 */
class CharacterRepository {

  async findPublic(filters = {}) {
    const { tag, gender, ageRating, chatMode, search } = filters;
    const query = { privacy: 'public', isBanned: false };

    if (tag)      query.tags      = tag;
    if (gender)   query.gender    = gender;
    if (ageRating) query.ageRating = ageRating;
    if (chatMode) query.chatMode  = { $in: [chatMode, 'both'] };
    if (search && search.trim()) {
      query.$or = [
        { name:   { $regex: search.trim(), $options: 'i' } },
        { slogan: { $regex: search.trim(), $options: 'i' } },
        { tags:   { $regex: search.trim(), $options: 'i' } },
      ];
    }

    return Character.find(query)
      .populate('creatorId', 'displayName avatar username')
      .sort({ totalChats: -1, createdAt: -1 });
  }

  async findById(id) {
    return Character.findById(id)
      .populate('creatorId', 'displayName avatar username');
  }

  async findByCreator(creatorId) {
    return Character.find({ creatorId }).sort({ createdAt: -1 });
  }

  async findAll() {
    return Character.find().populate('creatorId', 'displayName username').sort({ createdAt: -1 });
  }

  async create(data) {
    const char = new Character(data);
    return char.save();
  }

  async updateById(id, data) {
    data.updatedAt = new Date();
    return Character.findByIdAndUpdate(id, data, { new: true });
  }

  async incrementChats(id) {
    return Character.findByIdAndUpdate(id, { $inc: { totalChats: 1 } });
  }

  async banById(id) {
    return Character.findByIdAndUpdate(id, { isBanned: true }, { new: true });
  }

  async unbanById(id) {
    return Character.findByIdAndUpdate(id, { isBanned: false }, { new: true });
  }
}

module.exports = new CharacterRepository();
