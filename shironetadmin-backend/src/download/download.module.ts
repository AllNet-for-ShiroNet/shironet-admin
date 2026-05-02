// src/download/download.module.ts
import { Module } from '@nestjs/common';
import { DownloadService } from './download.service';
import { DownloadController } from './download.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DownloadController],
  providers: [DownloadService],
})
export class DownloadModule {}
