import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
    });

    this.client.on('error', (err) => {
      // Dev-friendly: log and continue without crashing on DNS/connection errors
      console.warn('[redis] connection error:', err?.message || err);
    });

    // Attempt a non-blocking connect
    this.client.connect().catch((err) => {
      console.warn('[redis] initial connect failed:', err?.message || err);
    });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, expiration: number) {
    await this.client.set(key, value, 'EX', expiration);
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  pipeline() {
    return this.client.pipeline();
  }
}
