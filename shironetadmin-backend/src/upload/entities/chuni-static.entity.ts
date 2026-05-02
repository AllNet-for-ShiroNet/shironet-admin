// src/upload/entites/chuni-static.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  Index
} from 'typeorm';

// 头像配饰实体
@Entity('shironet_chuni_static_avatar')
export class ChuniAvatarAccessory {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  sortName: string;

  @Column({ type: 'int' })
  category: number;

  @Column({ type: 'varchar', length: 500 })
  imagePath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 地图图标实体
@Entity('shironet_chuni_static_map_icon')
export class ChuniMapIcon {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  sortName: string;

  @Column({ type: 'varchar', length: 500 })
  imagePath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 姓名板实体
@Entity('shironet_chuni_static_name_plate')
export class ChuniNamePlate {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  sortName: string;

  @Column({ type: 'varchar', length: 500 })
  imagePath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 系统语音实体
@Entity('shironet_chuni_static_system_voice')
export class ChuniSystemVoice {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  sortName: string;

  @Column({ type: 'varchar', length: 500 })
  imagePath: string;

  @Column({ type: 'varchar', length: 500 })
  cuePath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 奖杯实体
@Entity('shironet_chuni_static_trophies')
export class ChuniTrophies {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int' })
  rareType: number;

  @Column({ type: 'text' })
  explainText: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 音乐静态数据实体
@Entity('chuni_static_music')
@Index(['version', 'songId', 'chartId'], { unique: true })
export class ChuniStaticMusic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  version: number;

  @Column({ nullable: true })
  songId: number;

  @Column({ nullable: true })
  chartId: number;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  artist: string;

  @Column('float', { nullable: true })
  level: number;

  @Column({ nullable: true })
  genre: string;

  @Column({ nullable: true })
  jacketPath: string;

  @Column({ length: 7, nullable: true })
  worldsEndTag: string;

  @Column({ length: 20, nullable: true })
  netversion: string;
}