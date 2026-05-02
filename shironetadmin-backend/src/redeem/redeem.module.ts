// src/redeem/redeem.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedeemService } from './redeem.service';
import { RedeemController } from './redeem.controller';
import { RedeemCode } from './entities/redeem-code.entity';
import { RedeemCodeUsage } from './entities/redeem-code-usage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RedeemCode, RedeemCodeUsage])],
  controllers: [RedeemController],
  providers: [RedeemService],
  exports: [RedeemService], // 导出服务供其他模块使用
})
export class RedeemModule {}