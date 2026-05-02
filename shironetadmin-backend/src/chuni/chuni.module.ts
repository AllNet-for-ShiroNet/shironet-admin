// src/chuni/chuni.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChuniController } from './chuni.controller';
import { ChuniService } from './chuni.service';
import { ChuniProfile } from './entities/chuni-profile.entity';
import { ChuniScore } from './entities/chuni-score.entity';
import { ChuniItem } from './entities/chuni-item.entity';
import { AimeUser } from '../user/entities/aime-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChuniProfile, ChuniScore, ChuniItem, AimeUser])
  ],
  controllers: [ChuniController],
  providers: [ChuniService],
  exports: [ChuniService, TypeOrmModule],
})
export class ChuniModule {}
