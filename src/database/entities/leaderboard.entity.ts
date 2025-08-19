import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum GameMode {
  Classic = 1,
  Tournament = 2,
}

@Entity('Leaderboard')
@Index('IX_Leaderboard_GameMode_Ranking', [
  'GameMode',
  'Score',
  'RegistrationDateUtc',
  'PlayerLevel',
  'TrophyCount',
])
@Index('IX_Leaderboard_User_GameMode', ['UserId', 'GameMode'])
export class Leaderboard {
  @PrimaryColumn({ type: 'uuid' })
  UserId: string;

  @PrimaryColumn({ type: 'integer' })
  GameMode: GameMode;

  @Column({ type: 'bigint' })
  Score: number;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  RegistrationDateUtc: Date;

  @Column({ type: 'integer', nullable: true }) // nullable: true ekle
  PlayerLevel: number;

  @Column({ type: 'integer', nullable: true })
  TrophyCount: number;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
  })
  UpdateDateUtc: Date;

  @ManyToOne(() => User, (user) => user.Leaderboards)
  @JoinColumn({ name: 'UserId' })
  User: User;
}
