import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { AppLogger } from '../logger/logger.service';
import { PrometheusService } from '../prometheus/prometheus.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private readonly logger: AppLogger,
    private readonly metricsService: PrometheusService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.info('Registration attempt', {
      username: registerDto.username,
      deviceId: registerDto.deviceId,
    });

    try {
      // 1. Kullanıcı adı kontrolü
      const existingUser = await this.userRepository.findOne({
        where: { Username: registerDto.username },
      });

      if (existingUser) {
        this.logger.warn('Registration failed - username already exists', {
          username: registerDto.username,
        });
        throw new ConflictException('Username already exists');
      }

      // 2. Şifreyi hash'le
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // 3. Yeni kullanıcı oluştur
      const user = this.userRepository.create({
        Username: registerDto.username,
        PasswordHash: hashedPassword,
        DeviceId: registerDto.deviceId,
        PlayerLevel: 1,
        TrophyCount: 0,
      });

      const savedUser = await this.userRepository.save(user);

      // 4. JWT token oluştur
      const token = this.jwtService.sign({
        userId: savedUser.Id,
        username: savedUser.Username,
      });

      this.logger.info('Registration successful', {
        userId: savedUser.Id,
        username: savedUser.Username,
      });

      return {
        token,
        success: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 saat
        user: {
          id: savedUser.Id,
          username: savedUser.Username,
          playerLevel: savedUser.PlayerLevel,
          trophyCount: savedUser.TrophyCount,
        },
      };
    } catch (error) {
      this.logger.error(
        'Registration error',
        error instanceof Error ? error.stack : undefined,
        {
          username: registerDto.username,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.info('Login attempt', {
      username: loginDto.username,
    });

    try {
      // 1. Kullanıcıyı bul
      const user = await this.userRepository.findOne({
        where: { Username: loginDto.username },
      });

      if (!user) {
        this.logger.warn('Login failed - user not found', {
          username: loginDto.username,
        });
        this.metricsService.recordLoginAttempt('failed');
        throw new UnauthorizedException('Invalid credentials');
      }

      // 2. Şifreyi kontrol et
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.PasswordHash,
      );

      if (!isPasswordValid) {
        this.logger.warn('Login failed - invalid password', {
          username: loginDto.username,
        });
        this.metricsService.recordLoginAttempt('failed');
        throw new UnauthorizedException('Invalid credentials');
      }

      // 3. JWT token oluştur
      const token = this.jwtService.sign({
        userId: user.Id,
        username: user.Username,
      });

      this.logger.info('Login successful', {
        userId: user.Id,
        username: user.Username,
      });

      this.metricsService.recordLoginAttempt('success');

      return {
        token,
        success: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 saat
        user: {
          id: user.Id,
          username: user.Username,
          playerLevel: user.PlayerLevel,
          trophyCount: user.TrophyCount,
        },
      };
    } catch (error) {
      this.logger.error(
        'Login error',
        error instanceof Error ? error.stack : undefined,
        {
          username: loginDto.username,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );
      throw error;
    }
  }
}
