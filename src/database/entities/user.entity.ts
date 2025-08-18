import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Leaderboard } from './leaderboard.entity';

@Entity('Users')
@Index(['Username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  Id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  Username: string;

  @Column({ type: 'text' })
  PasswordHash: string;

  @Column({ type: 'varchar', length: 128 })
  DeviceId: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  RegistrationDate: Date;

  @Column({ type: 'integer', default: 1 })
  PlayerLevel: number;

  @Column({ type: 'integer', default: 0 })
  TrophyCount: number;

  @OneToMany(() => Leaderboard, (leaderboard) => leaderboard.User)
  Leaderboards: Leaderboard[];
}
