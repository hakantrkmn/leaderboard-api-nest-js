import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'İşlem başarı durumu',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'JWT token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Token geçerlilik süresi',
    example: '2024-12-31T23:59:59.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Kullanıcı bilgileri',
    example: {
      id: 'user_123',
      username: 'john_doe',
      playerLevel: 5,
      trophyCount: 10,
    },
  })
  user: {
    id: string;
    username: string;
    playerLevel: number;
    trophyCount: number;
  };
}
