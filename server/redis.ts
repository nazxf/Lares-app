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
  private memoryCache = new Map<string, { expiresAt: number; value: unknown }>();
  private redisWriteDisabled = false;

  constructor() {
    this.redis = getRedisClient();
  }

  private getMemory<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    if (cached.expiresAt <= Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }

    console.log(`Memory cache HIT: ${key}`);
    return cached.value as T;
  }

  private setMemory<T>(key: string, value: T, ttlSeconds: number): void {
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private delMemoryPattern(pattern: string): void {
    const regex = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const memoryValue = this.getMemory<T>(key);
    if (memoryValue !== null) return memoryValue;

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
    this.setMemory(key, value, ttlSeconds);
    if (!this.redis || this.redisWriteDisabled) return;

    try {
      await this.redis.set(key, value, { ex: ttlSeconds });
      console.log(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('NOPERM')) {
        this.redisWriteDisabled = true;
        console.warn(`Redis writes disabled by token permissions. Using memory cache fallback for ${key}.`);
        return;
      }
      console.warn(`Redis SET error for ${key}. Using memory cache fallback.`, error);
    }
  }

  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (!this.redis || this.redisWriteDisabled) return;

    try {
      await this.redis.del(key);
      console.log(`Cache DEL: ${key}`);
    } catch (error) {
      console.warn(`Redis DEL error for ${key}:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    this.delMemoryPattern(pattern);
    if (!this.redis || this.redisWriteDisabled) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`Cache DEL pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      console.warn(`Redis DEL pattern error for ${pattern}:`, error);
    }
  }

  async flush(): Promise<void> {
    this.memoryCache.clear();
    if (!this.redis || this.redisWriteDisabled) return;

    try {
      await this.redis.flushdb();
      console.log('Cache FLUSHED');
    } catch (error) {
      console.warn('Redis FLUSH error:', error);
    }
  }

  isEnabled(): boolean {
    return this.redis !== null;
  }
}

export const cache = new CacheHelper();
