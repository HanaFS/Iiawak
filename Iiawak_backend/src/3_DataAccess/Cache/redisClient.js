'use strict';
const redis = require('redis');

/**
 * Redis Client — Quản lý kết nối Redis
 * Hỗ trợ async/await operations
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  /**
   * Kết nối tới Redis
   */
  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
      
      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('❌ Redis: Vượt quá 10 lần kết nối lại');
              return new Error('Max retries exceeded');
            }
            return retries * 50;
          },
        },
        password: process.env.REDIS_PASSWORD || undefined,
      });

      // Event listeners
      this.client.on('error', (err) => {
        console.error('❌ Redis error:', err.message);
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.connected = true;
      });

      this.client.on('reconnecting', () => {
        console.warn('🔄 Redis reconnecting...');
        this.connected = false;
      });

      await this.client.connect();
    } catch (err) {
      console.error('❌ Redis connection error:', err.message);
      console.warn('⚠️  Caching disabled - continuing without Redis');
      this.connected = false;
    }
  }

  /**
   * Ngắt kết nối Redis
   */
  async disconnect() {
    if (this.client && this.connected) {
      await this.client.quit();
      this.connected = false;
      console.log('✅ Redis disconnected');
    }
  }

  /**
   * Lấy value từ cache
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    if (!this.connected) return null;
    try {
      const value = await this.client.get(key);
      if (value) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return null;
    } catch (err) {
      console.error(`Redis GET error (${key}):`, err.message);
      return null;
    }
  }

  /**
   * Lưu value vào cache
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = 3600) {
    if (!this.connected) return false;
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl) {
        await this.client.setEx(key, ttl, data);
      } else {
        await this.client.set(key, data);
      }
      return true;
    } catch (err) {
      console.error(`Redis SET error (${key}):`, err.message);
      return false;
    }
  }

  /**
   * Xóa key từ cache
   * @param {string|string[]} keys
   */
  async delete(keys) {
    if (!this.connected) return false;
    try {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      if (keyArray.length > 0) {
        await this.client.del(keyArray);
      }
      return true;
    } catch (err) {
      console.error(`Redis DELETE error:`, err.message);
      return false;
    }
  }

  /**
   * Xóa tất cả keys matching pattern
   * @param {string} pattern - e.g., "feed:user:*"
   */
  async deletePattern(pattern) {
    if (!this.connected) return false;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return keys.length;
    } catch (err) {
      console.error(`Redis DELETEPATTERN error (${pattern}):`, err.message);
      return 0;
    }
  }

  /**
   * Kiểm tra key tồn tại
   * @param {string} key
   */
  async exists(key) {
    if (!this.connected) return false;
    try {
      return await this.client.exists(key) > 0;
    } catch (err) {
      console.error(`Redis EXISTS error (${key}):`, err.message);
      return false;
    }
  }

  /**
   * Tăng giá trị counter
   * @param {string} key
   * @param {number} increment
   */
  async increment(key, increment = 1) {
    if (!this.connected) return null;
    try {
      return await this.client.incrBy(key, increment);
    } catch (err) {
      console.error(`Redis INCR error (${key}):`, err.message);
      return null;
    }
  }

  /**
   * Set TTL cho key
   * @param {string} key
   * @param {number} ttl - Time to live in seconds
   */
  async setTTL(key, ttl) {
    if (!this.connected) return false;
    try {
      return await this.client.expire(key, ttl);
    } catch (err) {
      console.error(`Redis SETTTL error (${key}):`, err.message);
      return false;
    }
  }

  /**
   * Lấy TTL của key
   * @param {string} key
   * @returns {number} TTL in seconds (-1 if no TTL, -2 if key not exists)
   */
  async getTTL(key) {
    if (!this.connected) return -1;
    try {
      return await this.client.ttl(key);
    } catch (err) {
      console.error(`Redis GETTTL error (${key}):`, err.message);
      return -1;
    }
  }

  /**
   * Làm trống tất cả cache
   */
  async flushAll() {
    if (!this.connected) return false;
    try {
      await this.client.flushAll();
      console.log('✅ Redis cache flushed');
      return true;
    } catch (err) {
      console.error('Redis FLUSHALL error:', err.message);
      return false;
    }
  }

  /**
   * Lấy thông tin Redis info
   */
  async getInfo() {
    if (!this.connected) return null;
    try {
      return await this.client.info();
    } catch (err) {
      console.error('Redis INFO error:', err.message);
      return null;
    }
  }
}

module.exports = new RedisClient();
