import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: { Id: payload.userId },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return {
      userId: user.Id,
      username: user.Username,
      playerLevel: user.PlayerLevel,
      trophyCount: user.TrophyCount,
    };
  }
}
export interface JwtPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}
