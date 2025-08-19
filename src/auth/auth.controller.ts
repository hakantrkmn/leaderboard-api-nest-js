import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AppLogger } from '../logger/logger.service';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLogger,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Kullanıcı kaydı',
    description: 'Yeni kullanıcı hesabı oluşturur',
  })
  @ApiResponse({
    status: 201,
    description: 'Kullanıcı başarıyla kaydedildi',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 409, description: 'Kullanıcı adı zaten mevcut' })
  @UsePipes(new ValidationPipe())
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    this.logger.info('Register endpoint called', {
      username: registerDto.username,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Kullanıcı girişi',
    description: 'Kullanıcı girişi yapar ve JWT token döner',
  })
  @ApiResponse({
    status: 200,
    description: 'Giriş başarılı',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 401, description: 'Geçersiz kimlik bilgileri' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    this.logger.info('Login endpoint called', {
      username: loginDto.username,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return this.authService.login(loginDto);
  }
}
