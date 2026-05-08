import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import {
  ChuniAvatarAccessory,
  ChuniMapIcon,
  ChuniNamePlate,
  ChuniSystemVoice,
  ChuniTrophies,
  ChuniStaticMusic,
  ChuniCharacterImage,
} from './entities/chuni-static.entity';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    TypeOrmModule.forFeature([
      ChuniAvatarAccessory,
      ChuniMapIcon,
      ChuniNamePlate,
      ChuniSystemVoice,
      ChuniTrophies,
      ChuniStaticMusic,
      ChuniCharacterImage,
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