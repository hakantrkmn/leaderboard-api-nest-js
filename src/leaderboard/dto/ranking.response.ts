export class RankingResponseDto {
  success: boolean;
  message: string;
  data: {
    userId: string;
    score: number;
    rank: number;
    playerLevel: number;
    trophyCount: number;
  };
}
