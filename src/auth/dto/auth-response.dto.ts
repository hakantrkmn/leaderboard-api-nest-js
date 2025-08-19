export class AuthResponseDto {
  success: boolean;
  token: string;
  expiresAt: Date;
  user: {
    id: string;
    username: string;
    playerLevel: number;
    trophyCount: number;
  };
}
