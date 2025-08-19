import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from 'src/decorators/current-user.decorator';
import { IdempotencyGuard } from 'src/guards/idempotency.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GameMode } from '../database/entities/leaderboard.entity';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@Controller('leaderboard')
@UseGuards(JwtAuthGuard) // Tüm endpoint'ler için JWT authentication
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Post('submit')
  @ApiOperation({
    summary: 'Skor gönder',
    description: "Kullanıcının oyun skorunu leaderboard'a gönderir",
  })
  @ApiResponse({ status: 201, description: 'Skor başarıyla gönderildi' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 401, description: 'Yetkilendirme hatası' })
  @ApiResponse({ status: 409, description: 'Duplicate request detected' })
  @ApiHeader({
    name: 'idempotency-key',
    description: 'İsteğin benzersiz kimliği (idempotency için)',
    example: 'req_123456789',
    required: true,
  })
  @ApiHeader({
    name: 'x-timestamp',
    description: "İsteğin timestamp'i (Unix timestamp - saniye)",
    example: '1703123456',
    required: true,
  })
  @UsePipes(new ValidationPipe())
  @UseGuards(IdempotencyGuard)
  async submitScore(
    @Body() submitScoreDto: SubmitScoreDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const userId = user.userId;
    return await this.leaderboardService.submitScore(userId, submitScoreDto);
  }

  @Get('top/:gameMode')
  @ApiOperation({
    summary: 'En iyi oyuncuları getir',
    description: 'Belirtilen oyun modunda en yüksek skorlu oyuncuları listeler',
  })
  @ApiParam({
    name: 'gameMode',
    description: 'Oyun modu (CLASSIC, TIMED, SURVIVAL)',
    enum: GameMode,
  })
  @ApiQuery({
    name: 'n',
    description: 'Kaç oyuncu getirileceği',
    required: false,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'En iyi oyuncular listesi' })
  @ApiResponse({ status: 400, description: 'Geçersiz oyun modu' })
  async getTopPlayers(
    @Param('gameMode') gameMode: string,
    @Query('n') count: number = 100,
  ) {
    const gameModeEnum = GameMode[gameMode as keyof typeof GameMode];
    return await this.leaderboardService.getTopPlayers(gameModeEnum, count);
  }

  @Get('me/:gameMode')
  @ApiOperation({
    summary: 'Benim sıralamamı getir',
    description: 'Kullanıcının belirtilen oyun modundaki sıralamasını getirir',
  })
  @ApiParam({
    name: 'gameMode',
    description: 'Oyun modu (CLASSIC, TIMED, SURVIVAL)',
    enum: GameMode,
  })
  @ApiResponse({ status: 200, description: 'Kullanıcının sıralaması' })
  @ApiResponse({ status: 401, description: 'Yetkilendirme hatası' })
  async getMyRanking(
    @Param('gameMode') gameMode: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const userId = user.userId;
    const gameModeEnum = GameMode[gameMode as keyof typeof GameMode];
    console.log(userId, gameModeEnum);
    return await this.leaderboardService.getMyRanking(userId, gameModeEnum);
  }

  @Get('around-me/:gameMode')
  @ApiOperation({
    summary: 'Etrafımdaki oyuncuları getir',
    description: 'Kullanıcının etrafındaki oyuncuları getirir',
  })
  @ApiParam({
    name: 'gameMode',
    description: 'Oyun modu (CLASSIC, TIMED, SURVIVAL)',
    enum: GameMode,
  })
  @ApiQuery({
    name: 'k',
    description: 'Kaç oyuncu getirileceği',
    required: false,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Etrafımdaki oyuncular listesi' })
  @ApiResponse({ status: 401, description: 'Yetkilendirme hatası' })
  async getPlayersAroundMe(
    @Param('gameMode') gameMode: string,
    @Query('k') count: number = 5,
    @CurrentUser() user: JwtPayload,
  ) {
    const userId = user.userId;
    const gameModeEnum = GameMode[gameMode as keyof typeof GameMode];
    return await this.leaderboardService.getPlayersAroundMe(
      userId,
      gameModeEnum,
      count,
    );
  }
}
