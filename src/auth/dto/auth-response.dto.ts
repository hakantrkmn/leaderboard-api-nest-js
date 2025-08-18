export class AuthResponseDto {
  token: string;
  expiresAt: Date;
  user: {
    id: string;
    username: string;
    playerLevel: number;
    trophyCount: number;
  };
}
