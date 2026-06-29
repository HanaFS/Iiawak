'use strict';
const redisClient = require('../Cache/redisClient');

/**
 * Cache Manager — Quản lý caching strategy cho các data types
 * Định nghĩa TTL, key patterns, invalidation rules
 */
class CacheManager {
  constructor() {
    // Define cache TTL strategies
    this.TTL = {
      SHORT: 300,        // 5 minutes
      MEDIUM: 1800,      // 30 minutes
      LONG: 3600,        // 1 hour
      VERY_LONG: 86400,  // 24 hours
    };

    // Define cache key patterns
    this.KEYS = {
      USER_PROFILE: (userId) => `user:${userId}:profile`,
      USER_SOCIAL: (userId) => `user:${userId}:social`,
      CHARACTERS_LIST: (userId) => `characters:${userId}:list`,
      CHARACTER_DETAIL: (charId) => `character:${charId}:detail`,
      FEED: (userId, page = 1) => `feed:${userId}:page:${page}`,
      PACKAGES: 'packages:topup:list',
      SUGGESTED_FRIENDS: (userId) => `suggested:${userId}:friends`,
      USER_TRANSACTIONS: (userId, page = 1) => `transactions:${userId}:page:${page}`,
      LEADERBOARD: 'leaderboard:global',
      CHAT_HISTORY: (chatId, page = 1) => `chat:${chatId}:page:${page}`,
    };
  }

  // ── User Profile Caching ──────────────────────────────────────────────────

  async getCachedUserProfile(userId) {
    return redisClient.get(this.KEYS.USER_PROFILE(userId));
  }

  async cacheUserProfile(userId, profileData) {
    return redisClient.set(
      this.KEYS.USER_PROFILE(userId),
      profileData,
      this.TTL.LONG
    );
  }

  async invalidateUserProfile(userId) {
    await redisClient.delete(this.KEYS.USER_PROFILE(userId));
    await redisClient.delete(this.KEYS.USER_SOCIAL(userId));
  }

  // ── Character List Caching ────────────────────────────────────────────────

  async getCachedCharactersList(userId) {
    return redisClient.get(this.KEYS.CHARACTERS_LIST(userId));
  }

  async cacheCharactersList(userId, characters) {
    return redisClient.set(
      this.KEYS.CHARACTERS_LIST(userId),
      characters,
      this.TTL.MEDIUM
    );
  }

  async invalidateCharactersList(userId) {
    await redisClient.delete(this.KEYS.CHARACTERS_LIST(userId));
  }

  // ── Character Detail Caching ──────────────────────────────────────────────

  async getCachedCharacter(charId) {
    return redisClient.get(this.KEYS.CHARACTER_DETAIL(charId));
  }

  async cacheCharacter(charId, characterData) {
    return redisClient.set(
      this.KEYS.CHARACTER_DETAIL(charId),
      characterData,
      this.TTL.LONG
    );
  }

  async invalidateCharacter(charId) {
    await redisClient.delete(this.KEYS.CHARACTER_DETAIL(charId));
  }

  // ── Feed Caching ──────────────────────────────────────────────────────────

  async getCachedFeed(userId, page = 1) {
    return redisClient.get(this.KEYS.FEED(userId, page));
  }

  async cacheFeed(userId, page, feedData) {
    return redisClient.set(
      this.KEYS.FEED(userId, page),
      feedData,
      this.TTL.SHORT
    );
  }

  async invalidateFeed(userId) {
    // Invalidate all pages for this user
    return redisClient.deletePattern(`feed:${userId}:page:*`);
  }

  async invalidateGlobalFeed() {
    // Invalidate all feeds when new post is created
    return redisClient.deletePattern('feed:*:page:*');
  }

  // ── Top-up Packages Caching ───────────────────────────────────────────────

  async getCachedPackages() {
    return redisClient.get(this.KEYS.PACKAGES);
  }

  async cachePackages(packages) {
    return redisClient.set(
      this.KEYS.PACKAGES,
      packages,
      this.TTL.LONG
    );
  }

  async invalidatePackages() {
    await redisClient.delete(this.KEYS.PACKAGES);
  }

  // ── Suggested Friends Caching ────────────────────────────────────────────

  async getCachedSuggestedFriends(userId) {
    return redisClient.get(this.KEYS.SUGGESTED_FRIENDS(userId));
  }

  async cacheSuggestedFriends(userId, friends) {
    return redisClient.set(
      this.KEYS.SUGGESTED_FRIENDS(userId),
      friends,
      this.TTL.MEDIUM
    );
  }

  async invalidateSuggestedFriends(userId) {
    await redisClient.delete(this.KEYS.SUGGESTED_FRIENDS(userId));
  }

  // ── Transactions Caching ──────────────────────────────────────────────────

  async getCachedTransactions(userId, page = 1) {
    return redisClient.get(this.KEYS.USER_TRANSACTIONS(userId, page));
  }

  async cacheTransactions(userId, page, transactions) {
    return redisClient.set(
      this.KEYS.USER_TRANSACTIONS(userId, page),
      transactions,
      this.TTL.MEDIUM
    );
  }

  async invalidateUserTransactions(userId) {
    return redisClient.deletePattern(`transactions:${userId}:page:*`);
  }

  // ── Leaderboard Caching ───────────────────────────────────────────────────

  async getCachedLeaderboard() {
    return redisClient.get(this.KEYS.LEADERBOARD);
  }

  async cacheLeaderboard(leaderboard) {
    return redisClient.set(
      this.KEYS.LEADERBOARD,
      leaderboard,
      this.TTL.MEDIUM
    );
  }

  async invalidateLeaderboard() {
    await redisClient.delete(this.KEYS.LEADERBOARD);
  }

  // ── Chat History Caching ──────────────────────────────────────────────────

  async getCachedChatHistory(chatId, page = 1) {
    return redisClient.get(this.KEYS.CHAT_HISTORY(chatId, page));
  }

  async cacheChatHistory(chatId, page, messages) {
    return redisClient.set(
      this.KEYS.CHAT_HISTORY(chatId, page),
      messages,
      this.TTL.SHORT
    );
  }

  async invalidateChatHistory(chatId) {
    return redisClient.deletePattern(`chat:${chatId}:page:*`);
  }

  // ── Utility Methods ───────────────────────────────────────────────────────

  /**
   * Invalidate all caches (use with caution!)
   */
  async invalidateAll() {
    console.warn('⚠️  Invalidating ALL caches');
    return redisClient.flushAll();
  }

  /**
   * Get cache stats
   */
  async getStats() {
    const info = await redisClient.getInfo();
    return {
      connected: redisClient.connected,
      info: info ? info.stats : null,
    };
  }

  /**
   * Warm up critical caches on startup
   */
  async warmUp() {

    // This can be called after database seeding
    // For now, it's a placeholder
  }
}

module.exports = new CacheManager();
