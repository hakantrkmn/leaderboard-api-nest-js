import {
  BadRequestException,
  CanActivate,
  ConflictException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from 'src/decorators/current-user.decorator';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<JwtPayload>();
    const userId = request.userId;
    const idempotencyKey = request.headers['idempotency-key'] as string;
    const timestamp = request.headers['x-timestamp'] as string;

    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    if (!timestamp) {
      throw new BadRequestException('X-Timestamp header is required');
    }

    // Timestamp validation (±10 dakika)
    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);
    const timeDiff = Math.abs(currentTime - requestTime);

    if (timeDiff > 600) {
      // 10 dakika = 600 saniye
      throw new BadRequestException('Request timestamp is too old or too new');
    }

    // Idempotency check
    const cacheKey = `idem:lb:${userId}:${idempotencyKey}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const existing = await this.redisService.get(cacheKey);

    if (existing) {
      throw new ConflictException('Duplicate request detected');
    }

    // Store idempotency key (5 dakika TTL)
    await this.redisService.set(cacheKey, '1', 300);

    return true;
  }
}
