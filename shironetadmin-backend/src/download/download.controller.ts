// src/download/download.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { DownloadService } from './download.service';
import { AdminOnly } from '../auth/decorators/auth.decorator';

@AdminOnly()
@ApiBearerAuth()
@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  // 列出文件（需要登录）
  @Get('list')
  async listFiles(@Query('prefix') prefix: string) {
    const files = await this.downloadService.listFiles(prefix ? prefix + '/' : '');
    return { success: true, data: files };
  }

  // 请求预签名下载 URL（需要登录）。前端直接打开 url，避免 Cookie+302 跨域链导致下载卡住。
  @Post('token')
  @HttpCode(HttpStatus.OK)
  async requestToken(@Query('key') key: string) {
    if (!key || !String(key).trim()) {
      throw new BadRequestException('缺少或无效的 key 参数');
    }
    const url = await this.downloadService.getPresignedUrlForObjectKey(
      String(key).trim(),
    );
    return { success: true, url };
  }
}
