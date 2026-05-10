import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AimeUser } from '../../user/entities/aime-user.entity';

@Entity('chuni_item_character')
@Index('uk_user_character', ['userId', 'characterId'], { unique: true })
export class ChuniItemCharacter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user' })
  userId: number;

  @Column({ nullable: true })
  characterId: number | null;

  @Column({ nullable: true, default: 1 })
  level: number | null;

  @Column({ nullable: true, default: 0 })
  param1: number | null;

  @Column({ nullable: true, default: 0 })
  param2: number | null;

  @Column({ nullable: true, type: 'tinyint', default: 1 })
  isValid: boolean | null;

  @Column({ nullable: true, default: 0 })
  skillId: number | null;

  @Column({ nullable: true, type: 'tinyint', default: 0 })
  isNewMark: boolean | null;

  @Column({ nullable: true, default: 0 })
  playCount: number | null;

  @Column({ nullable: true, default: 0 })
  friendshipExp: number | null;

  @Column({ nullable: true, default: 0 })
  assignIllust: number | null;

  @Column({ nullable: true, default: 0 })
  exMaxLv: number | null;

  @ManyToOne(() => AimeUser)
  @JoinColumn({ name: 'user' })
  user: AimeUser;
}
