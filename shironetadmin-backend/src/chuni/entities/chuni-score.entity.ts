// src/chuni/entities/chuni-score.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AimeUser } from '../../user/entities/aime-user.entity';

@Entity('chuni_score_best')
export class ChuniScore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user' })
  userId: number;

  @Column({ nullable: true })
  musicId: number;

  @Column({ nullable: true })
  level: number;

  @Column({ nullable: true })
  playCount: number;

  @Column({ nullable: true })
  scoreMax: number;

  @Column({ nullable: true })
  resRequestCount: number;

  @Column({ nullable: true })
  resAcceptCount: number;

  @Column({ nullable: true })
  resSuccessCount: number;

  @Column({ nullable: true })
  missCount: number;

  @Column({ nullable: true })
  maxComboCount: number;

  @Column({ nullable: true, type: 'tinyint' })
  isFullCombo: boolean;

  @Column({ nullable: true, type: 'tinyint' })
  isAllJustice: boolean;

  @Column({ nullable: true })
  isSuccess: number;

  @Column({ nullable: true })
  fullChain: number;

  @Column({ nullable: true })
  maxChain: number;

  @Column({ nullable: true })
  scoreRank: number;

  @Column({ nullable: true, type: 'tinyint' })
  isLock: boolean;

  @Column({ nullable: true })
  theoryCount: number;

  @ManyToOne(() => AimeUser)
  @JoinColumn({ name: 'user' })
  user: AimeUser;
}
