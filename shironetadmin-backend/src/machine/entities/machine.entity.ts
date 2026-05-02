// src/machine/entities/machine.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Arcade } from './arcade.entity';

@Entity('machine')
export class Machine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  arcade: number;

  @Column({ length: 15 })
  serial: string;

  @Column({ length: 15, nullable: true })
  board?: string;

  @Column({ length: 4, nullable: true })
  game?: string;

  @Column({ length: 3, nullable: true })
  country?: string;

  @Column({ nullable: true })
  timezone?: string;

  @Column({ type: 'tinyint', nullable: true, default: false })
  ota_enable?: boolean;

  @Column({ length: 255, nullable: true })
  memo?: string;

  @Column({ type: 'tinyint', nullable: true, default: false })
  is_cab?: boolean;

  @Column({ type: 'longtext', nullable: true })
  data?: string;

  @ManyToOne(() => Arcade, { eager: true })
  @JoinColumn({ name: 'arcade' })
  arcade_info: Arcade;
}