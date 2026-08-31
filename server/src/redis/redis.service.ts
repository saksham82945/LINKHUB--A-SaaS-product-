import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private store = new Map<string, any>();

  constructor(private config: ConfigService) {}

  onModuleInit() {
    console.log('✅ Using In-Memory Fallback for Redis (Local Dev)');
  }

  async onModuleDestroy() {
    this.store.clear();
  }

  // ── Basic Operations
  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, value);
    if (ttlSeconds) {
      setTimeout(() => this.store.delete(key), ttlSeconds * 1000);
    }
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  // ── JSON helpers (most common use case)
  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  // ── Counters (for view counts, rate limiting)
  async incr(key: string): Promise<number> {
    const current = parseInt(this.store.get(key) || '0', 10);
    this.store.set(key, (current + 1).toString());
    return current + 1;
  }

  async incrBy(key: string, amount: number): Promise<number> {
    const current = parseInt(this.store.get(key) || '0', 10);
    this.store.set(key, (current + amount).toString());
    return current + amount;
  }

  // ── HyperLogLog (unique visitor count)
  async pfadd(key: string, element: string): Promise<void> {
    // mock behavior
  }

  async pfcount(key: string): Promise<number> {
    return 1;
  }

  // ── Cache Keys
  static keys = {
    profile: (username: string) => `profile:${username}`,
    leetcode: (username: string) => `leetcode:${username}`,
    codechef: (username: string) => `codechef:${username}`,
    github: (username: string) => `github:${username}`,
    scorecard: (profileId: string) => `scorecard:${profileId}`,
    profileViews: (profileId: string) => `views:${profileId}`,
    docViews: (docId: string) => `docviews:${docId}`,
  };
}
