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
} from './entities/chuni-static.entity';
import { ChuniStaticCharacter } from '../chuni/entities/chuni-static-character.entity';
import { ShironetCharacter } from '../auth/entities/shironet-character.entity';

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
      ChuniStaticCharacter,
    ]),
    TypeOrmModule.forFeature([ShironetCharacter]),
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