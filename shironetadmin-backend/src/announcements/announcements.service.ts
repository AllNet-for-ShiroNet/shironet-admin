import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, Like, In, Not, Between, MoreThan, LessThan } from 'typeorm';
  import { Announcement, AnnouncementStatus, AnnouncementType } from './entities/announcement.entity';
  import {
    CreateAnnouncementDto,
    UpdateAnnouncementDto,
    QueryAnnouncementDto,
    BatchPublishDto,
    BatchDeleteDto,
    PaginatedAnnouncementResponseDto,
    AnnouncementResponseDto,
    AnnouncementStatsDto,
  } from './dto/announcement.dto';
  
  @Injectable()
  export class AnnouncementsService {
    private readonly logger = new Logger(AnnouncementsService.name);
  
    constructor(
      @InjectRepository(Announcement)
      private announcementRepository: Repository<Announcement>,
    ) {}
  
    /**
     * 创建公告
     */
    async create(
      createAnnouncementDto: CreateAnnouncementDto,
      userId: number,
    ): Promise<AnnouncementResponseDto> {
      this.logger.log(`创建公告: ${createAnnouncementDto.title}`);
  
      // 验证 Markdown 格式
      this.validateMarkdown(createAnnouncementDto.content);
  
      // 验证时间逻辑
      if (createAnnouncementDto.publishTime && createAnnouncementDto.expireTime) {
        const publishTime = new Date(createAnnouncementDto.publishTime);
        const expireTime = new Date(createAnnouncementDto.expireTime);
        
        if (publishTime >= expireTime) {
          throw new BadRequestException('发布时间不能晚于或等于过期时间');
        }
      }
  
      // 如果设置了发布时间且是未来时间，状态为草稿
      let status = AnnouncementStatus.DRAFT;
      const publishTime = createAnnouncementDto.publishTime ? new Date(createAnnouncementDto.publishTime) : null;
      
      if (publishTime && publishTime <= new Date()) {
        status = AnnouncementStatus.PUBLISHED;
      }
  
      const announcement = this.announcementRepository.create({
        ...createAnnouncementDto,
        createTime: new Date(),
        publishTime,
        expireTime: createAnnouncementDto.expireTime ? new Date(createAnnouncementDto.expireTime) : null,
        createdBy: userId,
        isPinned: createAnnouncementDto.isPinned || false,
        status,
      });
  
      const savedAnnouncement = await this.announcementRepository.save(announcement);
      this.logger.log(`公告创建成功，ID: ${savedAnnouncement.id}`);
      
      return this.formatAnnouncementResponse(savedAnnouncement);
    }
  
    /**
     * 查询公告列表（分页）
     */
    async findAll(query: QueryAnnouncementDto): Promise<PaginatedAnnouncementResponseDto> {
      const { page = 1, limit = 10, search, status, type, isPinned, createdBy } = query;
      const skip = (page - 1) * limit;
  
      this.logger.log(`查询公告列表，页码: ${page}, 每页: ${limit}`);
  
      const queryBuilder = this.announcementRepository.createQueryBuilder('announcement');
  
      // 搜索条件
      if (search) {
        queryBuilder.andWhere(
          '(announcement.title LIKE :search OR announcement.content LIKE :search)',
          { search: `%${search}%` }
        );
      }
  
      // 状态筛选
      if (status) {
        queryBuilder.andWhere('announcement.status = :status', { status });
      }
  
      // 类型筛选
      if (type) {
        queryBuilder.andWhere('announcement.type = :type', { type });
      }
  
      // 置顶筛选
      if (isPinned !== undefined) {
        queryBuilder.andWhere('announcement.isPinned = :isPinned', { isPinned });
      }
  
      // 创建者筛选
      if (createdBy) {
        queryBuilder.andWhere('announcement.createdBy = :createdBy', { createdBy });
      }
  
      // 排序：置顶优先，然后按创建时间倒序
      queryBuilder.orderBy('announcement.isPinned', 'DESC');
      queryBuilder.addOrderBy('announcement.createTime', 'DESC');
  
      // 分页
      queryBuilder.skip(skip).take(limit);
  
      const [announcements, total] = await queryBuilder.getManyAndCount();
  
      this.logger.log(`查询到 ${announcements.length} 条公告，总计 ${total} 条`);
  
      return {
        announcements: announcements.map(announcement => this.formatAnnouncementResponse(announcement)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }
  
    /**
     * 根据ID查询公告
     */
    async findOne(id: number): Promise<AnnouncementResponseDto> {
      this.logger.log(`查询公告详情，ID: ${id}`);
  
      const announcement = await this.announcementRepository.findOne({
        where: { id },
      });
  
      if (!announcement) {
        this.logger.warn(`公告不存在，ID: ${id}`);
        throw new NotFoundException(`公告 ID ${id} 不存在`);
      }
  
      return this.formatAnnouncementResponse(announcement);
    }
  
    /**
     * 更新公告
     */
    async update(
      id: number,
      updateAnnouncementDto: UpdateAnnouncementDto,
      userId: number,
    ): Promise<AnnouncementResponseDto> {
      this.logger.log(`更新公告，ID: ${id}`);
  
      const announcement = await this.announcementRepository.findOne({
        where: { id },
      });
  
      if (!announcement) {
        throw new NotFoundException(`公告 ID ${id} 不存在`);
      }
  
      // 验证权限（可选：只有创建者或管理员才能编辑）
      // if (announcement.createdBy !== userId && !isAdmin) {
      //   throw new ForbiddenException('没有权限编辑此公告');
      // }
  
      // 验证 Markdown 格式
      if (updateAnnouncementDto.content) {
        this.validateMarkdown(updateAnnouncementDto.content);
      }
  
      // 验证时间逻辑
      const publishTime = updateAnnouncementDto.publishTime 
        ? new Date(updateAnnouncementDto.publishTime) 
        : announcement.publishTime;
      const expireTime = updateAnnouncementDto.expireTime 
        ? new Date(updateAnnouncementDto.expireTime) 
        : announcement.expireTime;
      
      if (publishTime && expireTime && publishTime >= expireTime) {
        throw new BadRequestException('发布时间不能晚于或等于过期时间');
      }
  
      // 更新字段
      Object.assign(announcement, {
        ...updateAnnouncementDto,
        publishTime: updateAnnouncementDto.publishTime 
          ? new Date(updateAnnouncementDto.publishTime) 
          : announcement.publishTime,
        expireTime: updateAnnouncementDto.expireTime 
          ? new Date(updateAnnouncementDto.expireTime) 
          : announcement.expireTime,
      });
  
      const updatedAnnouncement = await this.announcementRepository.save(announcement);
      this.logger.log(`公告更新成功，ID: ${id}`);
      
      return this.formatAnnouncementResponse(updatedAnnouncement);
    }
  
    /**
     * 删除公告
     */
    async remove(id: number, userId: number): Promise<void> {
      this.logger.log(`删除公告，ID: ${id}`);
  
      const announcement = await this.announcementRepository.findOne({
        where: { id },
      });
  
      if (!announcement) {
        throw new NotFoundException(`公告 ID ${id} 不存在`);
      }
  
      // 验证权限（可选）
      // if (announcement.createdBy !== userId && !isAdmin) {
      //   throw new ForbiddenException('没有权限删除此公告');
      // }
  
      await this.announcementRepository.remove(announcement);
      this.logger.log(`公告删除成功，ID: ${id}`);
    }
  
    /**
     * 发布公告
     */
    async publish(id: number, userId: number): Promise<AnnouncementResponseDto> {
      this.logger.log(`发布公告，ID: ${id}`);
  
      const announcement = await this.announcementRepository.findOne({
        where: { id },
      });
  
      if (!announcement) {
        throw new NotFoundException(`公告 ID ${id} 不存在`);
      }
  
      if (announcement.status === AnnouncementStatus.PUBLISHED) {
        throw new BadRequestException('公告已经发布');
      }
  
      // 检查是否已过期
      if (announcement.expireTime && announcement.expireTime < new Date()) {
        throw new BadRequestException('公告已过期，无法发布');
      }
  
      announcement.status = AnnouncementStatus.PUBLISHED;
      announcement.publishTime = new Date();
  
      const updatedAnnouncement = await this.announcementRepository.save(announcement);
      this.logger.log(`公告发布成功，ID: ${id}`);
      
      return this.formatAnnouncementResponse(updatedAnnouncement);
    }
  
    /**
     * 批量发布公告
     */
    async batchPublish(batchPublishDto: BatchPublishDto, userId: number): Promise<{ published: number; failed: number }> {
      const { ids } = batchPublishDto;
      this.logger.log(`批量发布公告，数量: ${ids.length}`);
      
      const announcements = await this.announcementRepository.findBy({
        id: In(ids),
        status: AnnouncementStatus.DRAFT,
      });
  
      if (announcements.length === 0) {
        throw new BadRequestException('没有可发布的草稿公告');
      }
  
      let published = 0;
      let failed = 0;
      const now = new Date();
  
      for (const announcement of announcements) {
        try {
          // 检查是否已过期
          if (announcement.expireTime && announcement.expireTime < now) {
            this.logger.warn(`公告已过期，跳过发布，ID: ${announcement.id}`);
            failed++;
            continue;
          }
  
          announcement.status = AnnouncementStatus.PUBLISHED;
          announcement.publishTime = now;
          await this.announcementRepository.save(announcement);
          published++;
        } catch (error) {
          this.logger.error(`发布公告失败，ID: ${announcement.id}`, error);
          failed++;
        }
      }
  
      this.logger.log(`批量发布完成，成功: ${published}, 失败: ${failed}`);
      return { published, failed };
    }
  
    /**
     * 批量删除公告
     */
    async batchDelete(batchDeleteDto: BatchDeleteDto, userId: number): Promise<{ deleted: number; failed: number }> {
      const { ids } = batchDeleteDto;
      this.logger.log(`批量删除公告，数量: ${ids.length}`);
      
      const announcements = await this.announcementRepository.findBy({
        id: In(ids),
      });
  
      if (announcements.length === 0) {
        throw new BadRequestException('没有找到要删除的公告');
      }
  
      let deleted = 0;
      let failed = 0;
  
      for (const announcement of announcements) {
        try {
          await this.announcementRepository.remove(announcement);
          deleted++;
        } catch (error) {
          this.logger.error(`删除公告失败，ID: ${announcement.id}`, error);
          failed++;
        }
      }
  
      this.logger.log(`批量删除完成，成功: ${deleted}, 失败: ${failed}`);
      return { deleted, failed };
    }
  
    /**
     * 切换置顶状态
     */
    async togglePin(id: number, userId: number): Promise<AnnouncementResponseDto> {
      this.logger.log(`切换公告置顶状态，ID: ${id}`);
  
      const announcement = await this.announcementRepository.findOne({
        where: { id },
      });
  
      if (!announcement) {
        throw new NotFoundException(`公告 ID ${id} 不存在`);
      }
  
      announcement.isPinned = !announcement.isPinned;
  
      const updatedAnnouncement = await this.announcementRepository.save(announcement);
      this.logger.log(`公告置顶状态切换成功，ID: ${id}, 置顶: ${updatedAnnouncement.isPinned}`);
      
      return this.formatAnnouncementResponse(updatedAnnouncement);
    }
  
    /**
     * 获取公告统计信息
     */
    async getStats(): Promise<AnnouncementStatsDto> {
      this.logger.log('获取公告统计信息');
  
      const [total, published, draft, expired, pinned] = await Promise.all([
        this.announcementRepository.count(),
        this.announcementRepository.count({
          where: { status: AnnouncementStatus.PUBLISHED },
        }),
        this.announcementRepository.count({
          where: { status: AnnouncementStatus.DRAFT },
        }),
        this.announcementRepository.count({
          where: { status: AnnouncementStatus.EXPIRED },
        }),
        this.announcementRepository.count({
          where: { isPinned: true },
        }),
      ]);
  
      return {
        total,
        published,
        draft,
        expired,
        pinned,
      };
    }
  
    /**
     * 更新过期状态（定时任务调用）
     */
    async updateExpiredStatus(): Promise<{ updated: number }> {
      this.logger.log('开始更新过期公告状态');
      
      const now = new Date();
      
      const result = await this.announcementRepository
        .createQueryBuilder()
        .update(Announcement)
        .set({ status: AnnouncementStatus.EXPIRED })
        .where('status = :status', { status: AnnouncementStatus.PUBLISHED })
        .andWhere('expireTime IS NOT NULL')
        .andWhere('expireTime < :now', { now })
        .execute();
  
      this.logger.log(`更新过期公告状态完成，影响行数: ${result.affected}`);
      return { updated: result.affected || 0 };
    }
  
    /**
     * 获取活跃公告（公开API，不需要认证）
     */
    async getActiveAnnouncements(limit: number = 10): Promise<AnnouncementResponseDto[]> {
      this.logger.log(`获取活跃公告，限制: ${limit}`);
  
      const now = new Date();
      const announcements = await this.announcementRepository.find({
        where: {
          status: AnnouncementStatus.PUBLISHED,
          publishTime: LessThan(now),
        },
        order: {
          isPinned: 'DESC',
          publishTime: 'DESC',
        },
        take: limit,
      });
  
      return announcements
        .filter(announcement => !announcement.expireTime || announcement.expireTime > now)
        .map(announcement => this.formatAnnouncementResponse(announcement));
    }
  
    /**
     * 根据类型获取公告
     */
    async findByType(type: AnnouncementType, limit: number = 10): Promise<AnnouncementResponseDto[]> {
      this.logger.log(`根据类型获取公告，类型: ${type}, 限制: ${limit}`);
  
      const now = new Date();
      const announcements = await this.announcementRepository.find({
        where: {
          type,
          status: AnnouncementStatus.PUBLISHED,
          publishTime: LessThan(now),
        },
        order: {
          isPinned: 'DESC',
          publishTime: 'DESC',
        },
        take: limit,
      });
  
      return announcements
        .filter(announcement => !announcement.expireTime || announcement.expireTime > now)
        .map(announcement => this.formatAnnouncementResponse(announcement));
    }
  
    /**
     * 搜索公告
     */
    async searchAnnouncements(keyword: string, limit: number = 20): Promise<AnnouncementResponseDto[]> {
      this.logger.log(`搜索公告，关键词: ${keyword}, 限制: ${limit}`);
  
      if (!keyword || keyword.trim().length === 0) {
        return [];
      }
  
      const now = new Date();
      const announcements = await this.announcementRepository
        .createQueryBuilder('announcement')
        .where('announcement.status = :status', { status: AnnouncementStatus.PUBLISHED })
        .andWhere('announcement.publishTime <= :now', { now })
        .andWhere('(announcement.title LIKE :keyword OR announcement.content LIKE :keyword)', {
          keyword: `%${keyword}%`,
        })
        .andWhere('(announcement.expireTime IS NULL OR announcement.expireTime > :now)', { now })
        .orderBy('announcement.isPinned', 'DESC')
        .addOrderBy('announcement.publishTime', 'DESC')
        .take(limit)
        .getMany();
  
      return announcements.map(announcement => this.formatAnnouncementResponse(announcement));
    }
  
    /**
     * 获取最近公告（按日期范围）
     */
    async getRecentAnnouncements(days: number = 7): Promise<AnnouncementResponseDto[]> {
      this.logger.log(`获取最近 ${days} 天的公告`);
  
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
      const announcements = await this.announcementRepository.find({
        where: {
          status: AnnouncementStatus.PUBLISHED,
          publishTime: Between(startDate, now),
        },
        order: {
          isPinned: 'DESC',
          publishTime: 'DESC',
        },
      });
  
      return announcements
        .filter(announcement => !announcement.expireTime || announcement.expireTime > now)
        .map(announcement => this.formatAnnouncementResponse(announcement));
    }
  
    /**
     * 复制公告
     */
    async duplicate(id: number, userId: number): Promise<AnnouncementResponseDto> {
      this.logger.log(`复制公告，ID: ${id}`);
  
      const originalAnnouncement = await this.announcementRepository.findOne({
        where: { id },
      });
  
      if (!originalAnnouncement) {
        throw new NotFoundException(`公告 ID ${id} 不存在`);
      }
  
      const duplicatedAnnouncement = this.announcementRepository.create({
        title: `${originalAnnouncement.title} (副本)`,
        content: originalAnnouncement.content,
        type: originalAnnouncement.type,
        isPinned: false, // 副本默认不置顶
        createTime: new Date(),
        publishTime: null,
        expireTime: originalAnnouncement.expireTime,
        status: AnnouncementStatus.DRAFT, // 副本默认为草稿
        createdBy: userId,
      });
  
      const savedAnnouncement = await this.announcementRepository.save(duplicatedAnnouncement);
      this.logger.log(`公告复制成功，新ID: ${savedAnnouncement.id}`);
      
      return this.formatAnnouncementResponse(savedAnnouncement);
    }
  
    /**
     * 验证 Markdown 格式
     */
    private validateMarkdown(content: string): void {
      // 基本的 Markdown 验证
      if (!content || content.trim().length === 0) {
        throw new BadRequestException('公告内容不能为空');
      }
  
      // 检查是否包含恶意脚本
      const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>/gi;
      if (scriptRegex.test(content)) {
        throw new BadRequestException('公告内容不能包含脚本标签');
      }
  
      // 检查是否包含危险的HTML标签
      const dangerousTagsRegex = /<(iframe|object|embed|form|input|button)[^>]*>/gi;
      if (dangerousTagsRegex.test(content)) {
        throw new BadRequestException('公告内容不能包含危险的HTML标签');
      }
  
      // 检查内容长度
      if (content.length > 10000) {
        throw new BadRequestException('公告内容长度不能超过10000个字符');
      }
  
      // 简单的 Markdown 语法检查
      const markdownPatterns = [
        /^#{1,6}\s+.+$/m, // 标题
        /\*\*.*\*\*/,     // 粗体
        /\*.*\*/,         // 斜体
        /`.*`/,           // 内联代码
        /```[\s\S]*```/,  // 代码块
        /\[.*\]\(.*\)/,   // 链接
        /!\[.*\]\(.*\)/,  // 图片
      ];
  
      // 这里可以根据需要添加更严格的 Markdown 验证
      // 目前只是基本的安全检查
    }
  
    /**
     * 格式化公告响应数据
     */
    private formatAnnouncementResponse(announcement: Announcement): AnnouncementResponseDto {
      return {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        isPinned: announcement.isPinned,
        createTime: announcement.createTime.toISOString(),
        publishTime: announcement.publishTime ? announcement.publishTime.toISOString() : null,
        expireTime: announcement.expireTime ? announcement.expireTime.toISOString() : null,
        status: announcement.status,
        createdBy: announcement.createdBy,
        createdAt: announcement.createdAt.toISOString(),
        updatedAt: announcement.updatedAt.toISOString(),
      };
    }
  }