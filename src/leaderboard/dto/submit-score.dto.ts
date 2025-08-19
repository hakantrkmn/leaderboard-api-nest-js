import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'Oyuncunun skoru',
    example: 1500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiProperty({
    description: 'Oyun modu',
    enum: GameMode,
    example: 'CLASSIC',
  })
  @IsEnum(GameMode)
  gameMode: string;

  @ApiProperty({
    description: 'Oyuncunun seviyesi',
    example: 5,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  playerLevel: number;

  @ApiProperty({
    description: 'Oyuncunun kupa sayısı',
    example: 10,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  trophyCount: number;

  @ApiProperty({
    description: 'Bonus özellikler listesi',
    example: ['speed_boost', 'double_points'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  bonus?: string[];
}
