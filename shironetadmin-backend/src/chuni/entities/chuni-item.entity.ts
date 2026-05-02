// src/chuni/entities/chuni-item.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AimeUser } from '../../user/entities/aime-user.entity';

@Entity('chuni_item_item')
export class ChuniItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user' })
  userId: number;

  @Column({ nullable: true })
  itemId: number;

  @Column({ nullable: true })
  itemKind: number;

  @Column({ nullable: true })
  stock: number;

  @Column({ nullable: true, type: 'tinyint' })
  isValid: boolean;

  @ManyToOne(() => AimeUser)
  @JoinColumn({ name: 'user' })
  user: AimeUser;
}
