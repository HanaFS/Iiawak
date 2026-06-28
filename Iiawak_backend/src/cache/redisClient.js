'use strict';
const { createClient } = require('redis');
const config = require('../config');
const logger = require('../Logger/logger');

/**
 * Redis Client Wrapper — Đảm bảo tương thích với CacheManager
 */
const client = createClient({
  url: config.redis.uri
});

client.on('error', (err) => logger.error('❌ Redis Client Error:', err));
client.on('connect', () => logger.info('✅ Redis đang kết nối...'));
client.on('ready', () => logger.info('✅ Redis đã sẵn sàng'));

// Wrapper object
const redisClient = {
  internalClient: client,

  async connect() {
    if (!client.isOpen) {
      await client.connect();
    }
  },

  async disconnect() {
    if (client.isOpen) {
      await client.disconnect();
    }
  },

  async get(key) {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  },

  async set(key, value, ttl = 3600) {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      return client.set(key, stringValue, { EX: ttl });
    }
    return client.set(key, stringValue);
  },

  async delete(key) {
    return client.del(key);
  },

  async deletePattern(pattern) {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      return client.del(keys);
    }
    return 0;
  },

  async flushAll() {
    return client.flushAll();
  },

  async getInfo() {
    const info = await client.info();
    return { stats: info };
  },

  get connected() {
    return client.isOpen;
  }
};

module.exports = redisClient;
