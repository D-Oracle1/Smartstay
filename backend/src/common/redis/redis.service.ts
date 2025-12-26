import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  // Room Lock Operations
  async lockRoom(roomId: string, bookingId: string, userId: string, ttl: number = 900): Promise<boolean> {
    const key = `room_lock:${roomId}`;
    const value = JSON.stringify({ bookingId, userId, lockedAt: new Date() });

    // NX: Only set if key doesn't exist
    const result = await this.client.set(key, value, 'EX', ttl, 'NX');
    return result === 'OK';
  }

  async unlockRoom(roomId: string): Promise<void> {
    const key = `room_lock:${roomId}`;
    await this.client.del(key);
  }

  async getRoomLock(roomId: string): Promise<any> {
    const key = `room_lock:${roomId}`;
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async getRoomLockTTL(roomId: string): Promise<number> {
    const key = `room_lock:${roomId}`;
    return await this.client.ttl(key);
  }

  // Cache Operations
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.client.setex(key, ttl, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  // Session Management
  async setSession(userId: string, token: string, ttl: number = 7200): Promise<void> {
    const key = `session:${userId}`;
    await this.client.setex(key, ttl, token);
  }

  async getSession(userId: string): Promise<string | null> {
    const key = `session:${userId}`;
    return await this.client.get(key);
  }

  async deleteSession(userId: string): Promise<void> {
    const key = `session:${userId}`;
    await this.client.del(key);
  }

  // Rate Limiting
  async incrementRateLimit(identifier: string, ttl: number = 60): Promise<number> {
    const key = `rate_limit:${identifier}`;
    const count = await this.client.incr(key);

    if (count === 1) {
      await this.client.expire(key, ttl);
    }

    return count;
  }

  async getRateLimit(identifier: string): Promise<number> {
    const key = `rate_limit:${identifier}`;
    const count = await this.client.get(key);
    return count ? parseInt(count, 10) : 0;
  }
}
