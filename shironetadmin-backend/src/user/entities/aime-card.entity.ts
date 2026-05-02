import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AimeUser } from './aime-user.entity';

@Entity('aime_card')
export class AimeCard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    unique: true 
  })
  access_code: string;

  @CreateDateColumn({ 
    name: 'created_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  created_date: Date;

  @Column({ 
    type: 'timestamp', 
    name: 'last_login_date', 
    nullable: true 
  })
  last_login_date: Date;

  @Column({ 
    type: 'tinyint', 
    name: 'is_locked', 
    default: 0 
  })
  is_locked: number;

  @Column({ 
    type: 'tinyint', 
    name: 'is_banned', 
    default: 0 
  })
  is_banned: number;

  @Column({ 
    type: 'varchar', 
    length: 16, 
    nullable: true,
    unique: true 
  })
  idm: string;

  @Column({ 
    type: 'bigint', 
    nullable: true,
    unique: true 
  })
  chip_id: number;

  @Column({ 
    type: 'int', 
    nullable: true 
  })
  memo: number;

  // 关联到用户 - 使用 'user' 作为列名（对应数据库）
  @ManyToOne(() => AimeUser, user => user.cards, { 
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'user' })  // 'user' 列名对应数据库
  user: AimeUser;

  @Column({ name: 'user' })  // 外键字段
  userId: number;

  // 检查卡片是否可用
  get isActive(): boolean {
    return this.is_locked === 0 && this.is_banned === 0;
  }

  // 检查卡片是否被锁定
  get isLocked(): boolean {
    return this.is_locked === 1;
  }

  // 检查卡片是否被封禁
  get isBanned(): boolean {
    return this.is_banned === 1;
  }
}