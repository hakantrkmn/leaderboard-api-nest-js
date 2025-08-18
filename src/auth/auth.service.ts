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
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // 1. Kullanıcı adı kontrolü
    const existingUser = await this.userRepository.findOne({
      where: { Username: registerDto.username },
    });

    if (existingUser) {
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

    return {
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 saat
      user: {
        id: savedUser.Id,
        username: savedUser.Username,
        playerLevel: savedUser.PlayerLevel,
        trophyCount: savedUser.TrophyCount,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // 1. Kullanıcıyı bul
    const user = await this.userRepository.findOne({
      where: { Username: loginDto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.PasswordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. JWT token oluştur
    const token = this.jwtService.sign({
      userId: user.Id,
      username: user.Username,
    });

    return {
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 saat
      user: {
        id: user.Id,
        username: user.Username,
        playerLevel: user.PlayerLevel,
        trophyCount: user.TrophyCount,
      },
    };
  }
}
