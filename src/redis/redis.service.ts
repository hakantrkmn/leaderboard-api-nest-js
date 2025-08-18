/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async set(key: string, value: any, ttl?: number): Promise<void> {
    console.log(' Redis: Setting key:', key);
    if (ttl) {
      await this.redisClient.setex(key, ttl, JSON.stringify(value));
    } else {
      await this.redisClient.set(key, JSON.stringify(value));
    }
    console.log('✅ Redis: Set successful');
  }

  async get(key: string): Promise<any> {
    const value = await this.redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  // Leaderboard cache methods
  async getTopPlayers(gameMode: string, count: number): Promise<any> {
    const key = `lb:top:${gameMode}:${count}`;
    return await this.get(key);
  }

  async setTopPlayers(
    gameMode: string,
    count: number,
    data: any,
  ): Promise<void> {
    try {
      const key = `lb:top:${gameMode}:${count}`;
      console.log('�� Redis: Setting key:', key);
      console.log('🔄 Redis: Data:', data);

      await this.set(key, data, 300); // 5 dakika TTL

      console.log('✅ Redis: Data set successfully');
    } catch (error) {
      console.error('❌ Redis: Error setting data:', error);
      throw error;
    }
  }

  async invalidateLeaderboardCache(): Promise<void> {}
}
