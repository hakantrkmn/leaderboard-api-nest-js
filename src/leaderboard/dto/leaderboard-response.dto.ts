export class LeaderboardPlayerDto {
  userId: string;
  score: number;
  playerLevel: number;
  trophyCount: number;
  registrationDateUtc: Date;
}

export class LeaderboardResponseDto {
  success: boolean;
  message: string;
  data: LeaderboardPlayerDto[];
}
