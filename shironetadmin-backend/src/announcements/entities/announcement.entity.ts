import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
  } from 'typeorm';
  
  export enum AnnouncementStatus {
    PUBLISHED = 'published',
    DRAFT = 'draft',
    EXPIRED = 'expired',
  }
  
  export enum AnnouncementType {
    SYSTEM = 'system',
    MAINTENANCE = 'maintenance',
    EVENT = 'event',
    UPDATE = 'update',
  }
  
  @Entity('shironet_announcements')
  @Index('idx_announcement_create_time', ['createTime'])
  @Index('idx_announcement_created_by', ['createdBy'])
  @Index('idx_announcement_is_pinned', ['isPinned'])
  @Index('idx_announcement_status', ['status'])
  @Index('idx_announcement_type', ['type'])
  export class Announcement {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ type: 'varchar', length: 100, comment: '公告标题' })
    title: string;
  
    @Column({ type: 'text', comment: '公告内容' })
    content: string;
  
    @Column({
      type: 'varchar',
      length: 20,
      comment: '公告类型',
      enum: AnnouncementType,
    })
    type: AnnouncementType;
  
    @Column({
      type: 'tinyint',
      width: 1,
      default: 0,
      comment: '是否置顶',
      name: 'is_pinned',
    })
    isPinned: boolean;
  
    @Column({ type: 'datetime', comment: '创建时间', name: 'create_time' })
    createTime: Date;
  
    @Column({
      type: 'datetime',
      nullable: true,
      comment: '发布时间',
      name: 'publish_time',
    })
    publishTime: Date | null;
  
    @Column({
      type: 'datetime',
      nullable: true,
      comment: '过期时间',
      name: 'expire_time',
    })
    expireTime: Date | null;
  
    @Column({
      type: 'enum',
      enum: AnnouncementStatus,
      default: AnnouncementStatus.DRAFT,
      comment: '状态',
    })
    status: AnnouncementStatus;
  
    @Column({ type: 'int', comment: '创建者ID', name: 'created_by' })
    createdBy: number;
  
    @CreateDateColumn({
      type: 'datetime',
      default: () => 'CURRENT_TIMESTAMP',
      comment: '记录创建时间',
      name: 'created_at',
    })
    createdAt: Date;
  
    @UpdateDateColumn({
      type: 'datetime',
      default: () => 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP',
      comment: '记录更新时间',
      name: 'updated_at',
    })
    updatedAt: Date;
  }