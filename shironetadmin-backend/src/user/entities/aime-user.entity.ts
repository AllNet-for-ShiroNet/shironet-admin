import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { AimeCard } from './aime-card.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  TRUST_USER = 'trust_user',
  USER = 'user',
}

@Entity('aime_user')
export class AimeUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ 
    type: 'varchar', 
    length: 25, 
    unique: true, 
    nullable: true 
  })
  username: string;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    unique: true, 
    nullable: true 
  })
  email: string;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true 
  })
  password: string;

  @Column({ type: 'int', nullable: true })
  permissions: number;

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
    type: 'timestamp', 
    name: 'suspend_expire_time', 
    nullable: true 
  })
  suspend_expire_time: Date;

  // 关联到卡片
  @OneToMany(() => AimeCard, card => card.user, { cascade: true })
  cards: AimeCard[];

  // 获取角色的计算属性
  get role(): UserRole {
    if (this.permissions === 255) {
      return UserRole.SUPER_ADMIN;
    } else if (this.permissions === 145) {
      return UserRole.ADMIN;
    } else if (this.permissions === 125) {
      return UserRole.TRUST_USER;
    } else {
      return UserRole.USER;
    }
  }

  // 获取主卡片（第一张卡片）
  get primaryCard(): AimeCard | null {
    return this.cards && this.cards.length > 0 ? this.cards[0] : null;
  }

  // 检查用户是否被暂停
  get isSuspended(): boolean {
    if (!this.suspend_expire_time) return false;
    return new Date() < this.suspend_expire_time;
  }

  // 获取可用的卡片
  get activeCards(): AimeCard[] {
    return this.cards ? this.cards.filter(card => !card.is_locked && !card.is_banned) : [];
  }
}