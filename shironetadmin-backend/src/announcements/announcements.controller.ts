import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Req,
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
  
  // import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  // import { RolesGuard } from '../auth/roles.guard';
  // import { Roles } from '../auth/roles.decorator';
  
  @ApiTags('announcements')
  @Controller('announcements')
  // @UseGuards(JwtAuthGuard, RolesGuard) // 如果需要认证
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
    // @ApiBearerAuth()
    // @Roles('admin', 'editor') // 如果需要角色权限
    async create(
      @Body() createAnnouncementDto: CreateAnnouncementDto,
      @Req() req: any, // 从请求中获取用户信息
    ): Promise<{ success: boolean; data: AnnouncementResponseDto; message: string }> {
      // 模拟从请求中获取用户ID，实际应该从JWT token中获取
      const userId = req.user?.id || 1;
      
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
    // @ApiBearerAuth()
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateAnnouncementDto: UpdateAnnouncementDto,
      @Req() req: any,
    ): Promise<{ success: boolean; data: AnnouncementResponseDto; message: string }> {
      const userId = req.user?.id || 1;
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
    // @ApiBearerAuth()
    async remove(
      @Param('id', ParseIntPipe) id: number,
      @Req() req: any,
    ): Promise<{ success: boolean; message: string }> {
      const userId = req.user?.id || 1;
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
    // @ApiBearerAuth()
    async publish(
      @Param('id', ParseIntPipe) id: number,
      @Req() req: any,
    ): Promise<{ success: boolean; data: AnnouncementResponseDto; message: string }> {
      const userId = req.user?.id || 1;
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
    // @ApiBearerAuth()
    async batchPublish(
      @Body() batchPublishDto: BatchPublishDto,
      @Req() req: any,
    ): Promise<{ success: boolean; data: { published: number; failed: number }; message: string }> {
      const userId = req.user?.id || 1;
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
    // @ApiBearerAuth()
    async batchDelete(
      @Body() batchDeleteDto: BatchDeleteDto,
      @Req() req: any,
    ): Promise<{ success: boolean; data: { deleted: number; failed: number }; message: string }> {
      const userId = req.user?.id || 1;
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
    // @ApiBearerAuth()
    async togglePin(
      @Param('id', ParseIntPipe) id: number,
      @Req() req: any,
    ): Promise<{ success: boolean; data: AnnouncementResponseDto; message: string }> {
      const userId = req.user?.id || 1;
      const data = await this.announcementsService.togglePin(id, userId);
      return {
        success: true,
        data,
        message: `公告${data.isPinned ? '置顶' : '取消置顶'}成功`,
      };
    }
  }