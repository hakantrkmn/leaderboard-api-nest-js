import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from 'src/redis/redis.service';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private redisService: RedisService,
  ) {}

  async getUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { Id: id } });
    await this.redisService.setTopPlayers('test', 10, {
      id: '1',
      name: 'John Doe',
      score: 100,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
