// src/entities/arcade.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('arcade')
export class Arcade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  nickname?: string;

  @Column({ length: 3, nullable: true })
  country?: string;

  @Column({ nullable: true })
  country_id?: number;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  region_id?: number;

  @Column({ nullable: true })
  timezone?: string;

  @Column({ length: 39, nullable: true })
  ip?: string;
}
