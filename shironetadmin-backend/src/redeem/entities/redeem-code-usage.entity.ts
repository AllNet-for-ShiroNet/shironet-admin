// src/redeem/entities/redeem-code-usage.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RedeemCode } from './redeem-code.entity';

@Entity('shironet_redeem_code_usages')
export class RedeemCodeUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  used_at: Date;

  @ManyToOne(() => RedeemCode, redeemCode => redeemCode.usages)
  @JoinColumn({ name: 'code_id' })
  redeemCode: RedeemCode;
}
