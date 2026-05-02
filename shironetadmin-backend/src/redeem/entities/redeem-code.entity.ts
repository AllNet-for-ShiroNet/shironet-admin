// src/redeem/entities/redeem-code.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RedeemCodeUsage } from './redeem-code-usage.entity';

@Entity('shironet_redeem_codes')
export class RedeemCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  itemId: number;

  @Column()
  itemKind: number;

  @Column({ default: 1 })
  amount: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 1, nullable: true })
  max_global_uses: number;

  @Column({ default: 1, nullable: true })
  max_user_uses: number;

  @Column({ type: 'datetime', nullable: true })
  start_time: Date;

  @Column({ type: 'datetime', nullable: true })
  end_time: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => RedeemCodeUsage, usage => usage.redeemCode)
  usages: RedeemCodeUsage[];

  // 虚拟字段：使用次数
  usedCount?: number;
}