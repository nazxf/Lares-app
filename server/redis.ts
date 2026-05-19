import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Redis credentials not found. Caching disabled.');
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('Redis client initialized');
  }

  return redisClient;
}

export class CacheHelper {
  private redis: Redis | null;

  constructor() {
    this.redis = getRedisClient();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const data = await this.redis.get<T>(key);
      if (data !== null) {
        console.log(`Cache HIT: ${key}`);
      } else {
        console.log(`Cache MISS: ${key}`);
      }
      return data;
    } catch (error) {
      console.error(`Redis GET error for ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 120): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.setex(key, ttlSeconds, value);
      console.log(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      console.error(`Redis SET error for ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(key);
      console.log(`Cache DEL: ${key}`);
    } catch (error) {
      console.error(`Redis DEL error for ${key}:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`Cache DEL pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      console.error(`Redis DEL pattern error for ${pattern}:`, error);
    }
  }

  async flush(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.flushdb();
      console.log('Cache FLUSHED');
    } catch (error) {
      console.error('Redis FLUSH error:', error);
    }
  }

  isEnabled(): boolean {
    return this.redis !== null;
  }
}

export const cache = new CacheHelper();
