// src/download/download.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { DownloadService } from './download.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  // 列出文件（需要登录）
  @Get('list')
  @UseGuards(JwtAuthGuard)
  async listFiles(@Query('prefix') prefix: string) {
    const files = await this.downloadService.listFiles(prefix ? prefix + '/' : '');
    return { success: true, data: files };
  }

  // 请求下载 token（需要登录）
  // token 通过 HttpOnly cookie 返回，JS 无法读取
  @Post('token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async requestToken(
    @Query('key') key: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.downloadService.issueToken(key);

    // 写入 HttpOnly cookie，JS 无法访问
    res.cookie('dl_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/api/download',
    });

    return { success: true };
  }

  // 实际下载：验证 cookie token，302 重定向到预签名 URL
  // 浏览器直接从 R2 下载，流量不经过服务器
  @Get('file')
  async downloadFile(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.['dl_token'];
    if (!token) {
      throw new UnauthorizedException('缺少下载 token');
    }

    res.clearCookie('dl_token', { path: '/api/download' });

    const url = await this.downloadService.getPresignedUrl(token);
    return res.redirect(302, url);
  }
}
