import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { GameMode } from 'src/database/entities/leaderboard.entity';

export class SubmitScoreDto {
  @IsNumber()
  @Min(0)
  score: number;

  @IsEnum(GameMode)
  gameMode: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  playerLevel: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  trophyCount: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  bonus?: string[];
}
