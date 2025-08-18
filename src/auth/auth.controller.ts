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
import { Request } from 'express';
import { AppLogger } from '../logger/logger.service';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLogger,
  ) {}

  @Post('register')
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
