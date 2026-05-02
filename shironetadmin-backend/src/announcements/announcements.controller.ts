import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseIntPipe,
    HttpStatus,
    HttpCode,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBearerAuth,
    ApiBody,
  } from '@nestjs/swagger';
  import { AnnouncementsService } from './announcements.service';
  import {
    CreateAnnouncementDto,
    UpdateAnnouncementDto,
    QueryAnnouncementDto,
    BatchPublishDto,
    BatchDeleteDto,
    AnnouncementResponseDto,
    PaginatedAnnouncementResponseDto,
    AnnouncementStatsDto,
  } from './dto/announcement.dto';
  import { AdminOnly } from '../auth/decorators/auth.decorator';
  import { CurrentUser } from '../auth/decorators/current-user.decorator';
  import { User } from '../auth/entities/user.entity';
  
  @ApiTags('announcements')
  @ApiBearerAuth()
  @AdminOnly()
  @Controller('announcements')
  export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) {}
  
    @Post()
    @ApiOperation({ summary: '创建公告' })
    @ApiResponse({
      status: 201,
      description: '公告创建成功',
      type: AnnouncementResponseDto,
    })
    @ApiResponse({ status: 400, description: '请求参数错误' })
    @ApiResponse({ status: 401, description: '未授权' })
    @ApiBody({ type: CreateAnnouncementDto })
    async create(
      @Body() createAnnouncementDto: CreateAnnouncementDto,
      @CurrentUser() user: User,
    ): Promise<{ success: boolean; data: AnnouncementResponseDto; message: string }> {
      const userId = user.id;
      
      const data = await this.announcementsService.create(createAnnouncementDto, userId);
      return {
        success: true,
        data,
        message: '公告创建成功',
      };
    }
  
    @Get()
    @ApiOperation({ summary: '获取公告列表' })
    @ApiResponse({
      status: 200,
      description: '获取成功',
      type: PaginatedAnnouncementResponseDto,
    })
    @ApiQuery({ type: QueryAnnouncementDto })
    async findAll(
      @Query() query: QueryAnnouncementDto,
    ): Promise<{ success: boolean; data: PaginatedAnnouncementResponseDto; message: string }> {
      const data = await this.announcementsService.findAll(query);
      return {
        success: true,
        data,
        message: '获取公告列表成功',
      };
    }
  
    @Get('stats')
    @ApiOperation({ summary: '获取公告统计信息' })
    @ApiResponse({
      status: 200,
      description: '获取成功',
      type: AnnouncementStatsDto,
    })
    async getStats(): Promise<{ success: boolean; data: AnnouncementStatsDto; message: string }> {
      const data = await this.announcementsService.getStats();
      return {
        success: true,
        data,
        message: '获取统计信息成功',
      };
    }
  
    @Get(':id')
    @ApiOperation({ summary: '获取单个公告' })
    @ApiParam({ name: 'id', description: '公告ID' })
    @ApiResponse({
      status: 200,
      description: '获取成功',
      type: AnnouncementResponseDto,
    })
    @ApiResponse({ status: 404, description: '公告不存在' })
    async findOne(
      @Param('id', ParseIntPipe) id: number,
    ): Promise<{ success: boolean; data: AnnouncementResponseDto; message: string }> {
      const data = await this.announcementsService.findOne(id);
      return {
        success: true,
        data,
        message: '获取公告成功',
      };
    }
  
    @Patch(':id')
    @ApiOperation({ summary: '更新公告' })
    @ApiParam({ name: 'id', description: '公告ID' })
    @ApiResponse({
      status: 200,
      description: '更新成功',
      type: AnnouncementResponseDto,
    })
    @ApiResponse({ status: 404, description: '公告不存在' })
    @ApiResponse({ status: 400, description: '请求参数错误' })
    @ApiBody({ type: UpdateAnnouncementDto })
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateAnnouncementDto: UpdateAnnouncementDto,
      @CurrentUser() user: User,
    ): Promise<{ success: boolean; data: AnnouncementResponseDto; message: string }> {
      const userId = user.id;
      const data = await this.announcementsService.update(id, updateAnnouncementDto, userId);
      return {
        success: true,
        data,
        message: '公告更新成功',
      };
    }
  
    @Delete(':id')
    @ApiOperation({ summary: '删除公告' })
    @ApiParam({ name: 'id', description: '公告ID' })
    @ApiResponse({ status: 200, description: '删除成功' })
    @ApiResponse({ status: 404, description: '公告不存在' })
    @HttpCode(HttpStatus.OK)
    async remove(
      @Param('id', ParseIntPipe) id: number,
      @CurrentUser() user: User,
    ): Promise<{ success: boolean; message: string }> {
      const userId = user.id;
      await this.announcementsService.remove(id, userId);
      return {
        success: true,
        message: '公告删除成功',
      };
    }
  
    @Post(':id/publish')
    @ApiOperation({ summary: '发布公告' })
    @ApiParam({ name: 'id', description: '公告ID' })
    @ApiResponse({
      status: 200,
      description: '发布成功',
      type: AnnouncementResponseDto,
    })
    @ApiResponse({ status: 404, description: '公告不存在' })
    @ApiResponse({ status: 400, description: '公告已发布' })
    async publish(
      @Param('id', ParseIntPipe) id: number,
      @CurrentUser() user: User,
    ): Promise<{ success: boolean; data: AnnouncementResponseDto; message: string }> {
      const userId = user.id;
      const data = await this.announcementsService.publish(id, userId);
      return {
        success: true,
        data,
        message: '公告发布成功',
      };
    }
  
    @Post('batch/publish')
    @ApiOperation({ summary: '批量发布公告' })
    @ApiResponse({ status: 200, description: '批量发布完成' })
    @ApiResponse({ status: 400, description: '没有可发布的公告' })
    @ApiBody({ type: BatchPublishDto })
    async batchPublish(
      @Body() batchPublishDto: BatchPublishDto,
      @CurrentUser() user: User,
    ): Promise<{ success: boolean; data: { published: number; failed: number }; message: string }> {
      const userId = user.id;
      const data = await this.announcementsService.batchPublish(batchPublishDto, userId);
      return {
        success: true,
        data,
        message: `批量发布完成：成功 ${data.published} 条，失败 ${data.failed} 条`,
      };
    }
  
    @Delete('batch')
    @ApiOperation({ summary: '批量删除公告' })
    @ApiResponse({ status: 200, description: '批量删除完成' })
    @ApiResponse({ status: 400, description: '没有找到要删除的公告' })
    @ApiBody({ type: BatchDeleteDto })
    @HttpCode(HttpStatus.OK)
    async batchDelete(
      @Body() batchDeleteDto: BatchDeleteDto,
      @CurrentUser() user: User,
    ): Promise<{ success: boolean; data: { deleted: number; failed: number }; message: string }> {
      const userId = user.id;
      const data = await this.announcementsService.batchDelete(batchDeleteDto, userId);
      return {
        success: true,
        data,
        message: `批量删除完成：成功 ${data.deleted} 条，失败 ${data.failed} 条`,
      };
    }
  
    @Post(':id/toggle-pin')
    @ApiOperation({ summary: '切换公告置顶状态' })
    @ApiParam({ name: 'id', description: '公告ID' })
    @ApiResponse({
      status: 200,
      description: '切换成功',
      type: AnnouncementResponseDto,
    })
    @ApiResponse({ status: 404, description: '公告不存在' })
    async togglePin(
      @Param('id', ParseIntPipe) id: number,
      @CurrentUser() user: User,
    ): Promise<{ success: boolean; data: AnnouncementResponseDto; message: string }> {
      const userId = user.id;
      const data = await this.announcementsService.togglePin(id, userId);
      return {
        success: true,
        data,
        message: `公告${data.isPinned ? '置顶' : '取消置顶'}成功`,
      };
    }
  }