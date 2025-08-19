import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from 'src/redis/redis.service';
import { Repository } from 'typeorm';
import { GameMode, Leaderboard } from '../database/entities/leaderboard.entity';
import {
  LeaderboardPlayerDto,
  LeaderboardResponseDto,
} from './dto/leaderboard-response.dto';
import { RankingResponseDto } from './dto/ranking.response';
import { SubmitScoreDto } from './dto/submit-score.dto';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Leaderboard)
    private leaderboardRepository: Repository<Leaderboard>,
    private redisService: RedisService,
  ) {}

  async submitScore(userId: string, submitScoreDto: SubmitScoreDto) {
    // 1. Bonus hesaplama
    let finalScore = submitScoreDto.score;

    if (submitScoreDto.bonus && submitScoreDto.bonus.length > 0) {
      finalScore = this.calculateBonus(finalScore, submitScoreDto.bonus);
    }

    // 2. Database'e kaydetme (upsert)
    await this.leaderboardRepository.upsert(
      {
        UserId: userId,
        GameMode: GameMode[submitScoreDto.gameMode as keyof typeof GameMode],
        Score: finalScore,
        PlayerLevel: submitScoreDto.playerLevel,
        TrophyCount: submitScoreDto.trophyCount,
      },
      {
        conflictPaths: ['UserId', 'GameMode'], // Composite primary key
        skipUpdateIfNoValuesChanged: true,
      },
    );

    // 3. Cache invalidation
    // TODO: Redis cache temizleme
    await this.redisService.del(`lb:top:${submitScoreDto.gameMode}:100`);
    await this.redisService.setTopPlayers(
      submitScoreDto.gameMode,
      100,
      await this.getTopPlayers(
        GameMode[submitScoreDto.gameMode as keyof typeof GameMode],
        100,
      ),
    );

    return {
      success: true,
      message: 'Score submitted successfully',
      data: {
        userId,
        score: finalScore,
        gameMode: submitScoreDto.gameMode,
      },
    };
  }

  async getTopPlayers(
    gameMode: GameMode,
    count: number = 100,
  ): Promise<LeaderboardPlayerDto[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cachedPlayers = await this.redisService.getTopPlayers(
      gameMode.toString(),
      count,
    );
    if (cachedPlayers) {
      return cachedPlayers as LeaderboardPlayerDto[];
    }
    const topPlayers = await this.leaderboardRepository
      .createQueryBuilder('leaderboard')
      .select([
        'leaderboard.UserId as userId',
        'leaderboard.Score as score',
        'leaderboard.PlayerLevel as playerLevel',
        'leaderboard.TrophyCount as trophyCount',
        'leaderboard.RegistrationDateUtc as registrationDateUtc',
        'ROW_NUMBER() OVER (ORDER BY leaderboard.Score DESC, leaderboard.RegistrationDateUtc ASC, leaderboard.PlayerLevel DESC, leaderboard.TrophyCount DESC) as rank',
      ])
      .where('leaderboard.GameMode = :gameMode', { gameMode })
      .orderBy('leaderboard.Score', 'DESC')
      .addOrderBy('leaderboard.RegistrationDateUtc', 'ASC')
      .addOrderBy('leaderboard.PlayerLevel', 'DESC')
      .addOrderBy('leaderboard.TrophyCount', 'DESC')
      .limit(count)
      .getRawMany();

    await this.redisService.setTopPlayers(
      gameMode.toString(),
      count,
      topPlayers,
    );

    return topPlayers as LeaderboardPlayerDto[];
  }

  async getMyRanking(
    userId: string,
    gameMode: GameMode,
  ): Promise<RankingResponseDto> {
    const result = await this.leaderboardRepository
      .createQueryBuilder('leaderboard')
      .select([
        'leaderboard.UserId as userId',
        'leaderboard.Score as score',
        'leaderboard.PlayerLevel as playerLevel',
        'leaderboard.TrophyCount as trophyCount',
      ])
      .addSelect(
        '(SELECT COUNT(*) + 1 FROM "Leaderboard" l2 WHERE l2."GameMode" = leaderboard."GameMode" AND (l2."Score" > leaderboard."Score" OR (l2."Score" = leaderboard."Score" AND l2."RegistrationDateUtc" < leaderboard."RegistrationDateUtc") OR (l2."Score" = leaderboard."Score" AND l2."RegistrationDateUtc" = leaderboard."RegistrationDateUtc" AND l2."PlayerLevel" > leaderboard."PlayerLevel") OR (l2."Score" = leaderboard."Score" AND l2."RegistrationDateUtc" = leaderboard."RegistrationDateUtc" AND l2."PlayerLevel" = leaderboard."PlayerLevel" AND l2."TrophyCount" > leaderboard."TrophyCount"))) as rank',
      )
      .where('leaderboard.GameMode = :gameMode', { gameMode })
      .andWhere('leaderboard.UserId = :userId', { userId })
      .getRawOne<{
        userId: string;
        score: number;
        playerLevel: number;
        trophyCount: number;
        rank: string;
      }>();

    if (!result) {
      return {
        success: false,
        message: 'User not found in leaderboard',
        data: {
          userId: '',
          score: 0,
          rank: 0,
          playerLevel: 0,
          trophyCount: 0,
        },
      };
    }

    return {
      success: true,
      message: 'User ranking retrieved successfully',
      data: {
        userId: result.userId,
        score: result.score,
        rank: parseInt(result.rank),
        playerLevel: result.playerLevel,
        trophyCount: result.trophyCount,
      },
    };
  }
  async getPlayersAroundMe(
    userId: string,
    gameMode: GameMode,
    count: number = 5,
  ): Promise<LeaderboardResponseDto> {
    // Tek sorgu ile around me hesapla
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const playersAroundMe = await this.leaderboardRepository.query(
      `
      WITH user_ranking AS (
        SELECT
          ROW_NUMBER() OVER (
            ORDER BY "Score" DESC, "RegistrationDateUtc" ASC, "PlayerLevel" DESC, "TrophyCount" DESC
          ) as rn
        FROM "Leaderboard"
        WHERE "GameMode" = $1 AND "UserId" = $2
      ),
      all_rankings AS (
        SELECT
          "UserId",
          "Score",
          "PlayerLevel",
          "TrophyCount",
          "RegistrationDateUtc",
          ROW_NUMBER() OVER (
            ORDER BY "Score" DESC, "RegistrationDateUtc" ASC, "PlayerLevel" DESC, "TrophyCount" DESC
          ) as rn
        FROM "Leaderboard"
        WHERE "GameMode" = $1
      )
      SELECT
        ar."UserId" as "userId",
        ar."Score" as "score",
        ar."PlayerLevel" as "playerLevel",
        ar."TrophyCount" as "trophyCount",
        ar."RegistrationDateUtc" as "registrationDateUtc",
        ar.rn as "rank"
      FROM all_rankings ar, user_ranking ur
      WHERE ar.rn BETWEEN ur.rn - $3 AND ur.rn + $3
      ORDER BY ar.rn ASC
    `,
      [gameMode, userId, count],
    );

    return {
      success: true,
      message: `Players around user retrieved successfully`,
      data: playersAroundMe as LeaderboardPlayerDto[],
    };
  }

  private calculateBonus(baseScore: number, bonuses: string[]): number {
    let finalScore = baseScore;
    for (const bonus of bonuses) {
      switch (bonus) {
        case 'weekend_bonus': {
          const currentDate = new Date();
          const isWeekend =
            currentDate.getDay() === 0 || currentDate.getDay() === 6;
          if (isWeekend) {
            finalScore = Math.floor(finalScore * 1.05); // %5 bonus
          }
          break;
        }
        // Diğer bonus'lar buraya eklenebilir
      }
    }

    return finalScore;
  }
}
