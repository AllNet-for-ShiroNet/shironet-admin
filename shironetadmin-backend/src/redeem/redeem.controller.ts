// src/redeem/redeem.controller.ts
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
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { RedeemService } from './redeem.service';
  import { CreateRedeemCodeDto } from './dto/create-redeem-code.dto';
  import { UpdateRedeemCodeDto } from './dto/update-redeem-code.dto';
  import { BatchCreateRedeemCodeDto } from './dto/batch-create-redeem-code.dto';
  
  @Controller('redeem')
  export class RedeemController {
    constructor(private readonly redeemService: RedeemService) {}
  
    // 获取所有兑换码（分页）
    @Get()
    async findAll(
      @Query('page') page: string = '1',
      @Query('limit') limit: string = '10',
      @Query('search') search?: string,
      @Query('status') status?: string,
    ) {
      return this.redeemService.findAll(
        parseInt(page),
        parseInt(limit),
        search,
        status,
      );
    }
  
    // 获取兑换码详情
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
      return this.redeemService.findOne(id);
    }
  
    // 获取兑换码使用详情
    @Get(':id/usages')
    async getUsageDetails(@Param('id', ParseIntPipe) id: number) {
      return this.redeemService.getUsageDetails(id);
    }
  
    // 创建兑换码
    @Post()
    async create(@Body() createRedeemCodeDto: CreateRedeemCodeDto) {
      return this.redeemService.create(createRedeemCodeDto);
    }
  
    // 批量创建兑换码
    @Post('batch')
    async batchCreate(@Body() batchCreateDto: BatchCreateRedeemCodeDto) {
      return this.redeemService.batchCreate(batchCreateDto);
    }
  
    // 更新兑换码
    @Patch(':id')
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateRedeemCodeDto: UpdateRedeemCodeDto,
    ) {
      return this.redeemService.update(id, updateRedeemCodeDto);
    }
  
    // 切换兑换码状态
    @Patch(':id/toggle-status')
    async toggleStatus(@Param('id', ParseIntPipe) id: number) {
      return this.redeemService.toggleStatus(id);
    }
  
    // 删除兑换码
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: number) {
      return this.redeemService.remove(id);
    }
  
    // 使用兑换码接口（供游戏客户端调用）
    @Post('use')
    async useRedeemCode(
      @Body() body: { code: string; userId: number },
    ) {
      return this.redeemService.useRedeemCode(body.code, body.userId);
    }
  }