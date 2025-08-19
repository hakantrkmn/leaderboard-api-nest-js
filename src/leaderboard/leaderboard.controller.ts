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
import { CurrentUser, JwtPayload } from 'src/decorators/current-user.decorator';
import { IdempotencyGuard } from 'src/guards/idempotency.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GameMode } from '../database/entities/leaderboard.entity';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard) // Tüm endpoint'ler için JWT authentication
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Post('submit')
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
  async getTopPlayers(
    @Param('gameMode') gameMode: string,
    @Query('n') count: number = 100,
  ) {
    const gameModeEnum = GameMode[gameMode as keyof typeof GameMode];
    return await this.leaderboardService.getTopPlayers(gameModeEnum, count);
  }

  @Get('me/:gameMode')
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
