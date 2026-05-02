import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import {
  ChuniAvatarAccessory,
  ChuniMapIcon,
  ChuniNamePlate,
  ChuniSystemVoice,
  ChuniTrophies,
  ChuniStaticMusic,
} from './entities/chuni-static.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChuniAvatarAccessory,
      ChuniMapIcon,
      ChuniNamePlate,
      ChuniSystemVoice,
      ChuniTrophies,
      ChuniStaticMusic,
    ]),
    MulterModule.register({
      limits: {
        fileSize: 300 * 1024 * 1024,
        files: 50,
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}