/**
 * MongoDB Index Creation & Database Optimization
 * Run this script to create performance indexes
 * Usage: node scripts/createIndexes.js
 */

const mongoose = require('mongoose');
const logger = require('../src/4_Core/Logger/logger');
require('dotenv').config();

// Import models
const User = require('../src/3_DataAccess/Models/User.model');
const Post = require('../src/3_DataAccess/Models/Post.model');
const Character = require('../src/3_DataAccess/Models/Character.model');
const Message = require('../src/3_DataAccess/Models/Message.model');
const Transaction = require('../src/3_DataAccess/Models/Transaction.model');
const Notification = require('../src/3_DataAccess/Models/Notification.model');
const Comment = require('../src/3_DataAccess/Models/Comment.model');

const createIndexes = async () => {
  try {
    logger.info('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iiawak');

    logger.info('📊 Creating indexes...');

    // ─── User Indexes ────────────────────────────────────────────────────────
    await User.collection.createIndex({ email: 1 }, { unique: true });
    logger.info('✅ User: email index created');

    await User.collection.createIndex({ username: 1 }, { unique: true });
    logger.info('✅ User: username index created');

    await User.collection.createIndex({ phone: 1 }, { sparse: true, unique: true });
    logger.info('✅ User: phone index created');

    await User.collection.createIndex({ createdAt: -1 });
    logger.info('✅ User: createdAt index created');

    await User.collection.createIndex({ 'profile.level': -1, 'profile.experience': -1 });
    logger.info('✅ User: profile leaderboard index created');

    // ─── Post Indexes ────────────────────────────────────────────────────────
    await Post.collection.createIndex({ authorId: 1, createdAt: -1 });
    logger.info('✅ Post: authorId + createdAt index created');

    await Post.collection.createIndex({ createdAt: -1 });
    logger.info('✅ Post: createdAt (feed) index created');

    await Post.collection.createIndex({ title: 'text', content: 'text' });
    logger.info('✅ Post: full-text search index created');

    await Post.collection.createIndex({ hashtags: 1, createdAt: -1 });
    logger.info('✅ Post: hashtags index created');

    // ─── Character Indexes ───────────────────────────────────────────────────
    await Character.collection.createIndex({ creatorId: 1, createdAt: -1 });
    logger.info('✅ Character: creatorId + createdAt index created');

    await Character.collection.createIndex({ name: 1 });
    logger.info('✅ Character: name index created');

    await Character.collection.createIndex({ 'stats.level': -1, 'stats.experience': -1 });
    logger.info('✅ Character: level/experience leaderboard index created');

    // ─── Message Indexes ─────────────────────────────────────────────────────
    await Message.collection.createIndex({ conversationId: 1, createdAt: -1 });
    logger.info('✅ Message: conversationId + createdAt index created');

    await Message.collection.createIndex({ senderId: 1, createdAt: -1 });
    logger.info('✅ Message: senderId + createdAt index created');

    await Message.collection.createIndex({ receiverId: 1, read: 1 });
    logger.info('✅ Message: receiverId + read index created');

    // ─── Transaction Indexes ─────────────────────────────────────────────────
    await Transaction.collection.createIndex({ userId: 1, createdAt: -1 });
    logger.info('✅ Transaction: userId + createdAt index created');

    await Transaction.collection.createIndex({ txId: 1 }, { unique: true });
    logger.info('✅ Transaction: txId index created');

    await Transaction.collection.createIndex({ status: 1, type: 1, createdAt: -1 });
    logger.info('✅ Transaction: status + type index created');

    await Transaction.collection.createIndex({ 'vnp_TransactionNo': 1 }, { sparse: true });
    logger.info('✅ Transaction: VNPay transaction number index created');

    // ─── Notification Indexes ───────────────────────────────────────────────
    await Notification.collection.createIndex({ userId: 1, read: 1, createdAt: -1 });
    logger.info('✅ Notification: userId + read + createdAt index created');

    await Notification.collection.createIndex({ userId: 1, createdAt: -1 });
    logger.info('✅ Notification: userId + createdAt index created');

    // ─── Comment Indexes ─────────────────────────────────────────────────────
    await Comment.collection.createIndex({ postId: 1, createdAt: -1 });
    logger.info('✅ Comment: postId + createdAt index created');

    await Comment.collection.createIndex({ authorId: 1, createdAt: -1 });
    logger.info('✅ Comment: authorId + createdAt index created');

    // ─── TTL Indexes (Auto-delete old temporary data) ────────────────────────
    // Optional: Delete notifications after 90 days
    await Notification.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
    logger.info('✅ Notification: TTL index created (90 days)');

    logger.info('🎉 All indexes created successfully!');

    // ─── Index Statistics ────────────────────────────────────────────────────
    const stats = await User.collection.getIndexes();
    logger.info(`\n📈 Index Statistics:\n${JSON.stringify(stats, null, 2)}`);

    await mongoose.connection.close();
    logger.info('✅ MongoDB connection closed');
  } catch (error) {
    logger.error(`❌ Error creating indexes: ${error.message}`);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  createIndexes();
}

module.exports = { createIndexes };
