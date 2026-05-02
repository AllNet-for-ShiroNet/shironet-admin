// src/common/health/health.module.ts
import { Module } from '@nestjs/common';
import { DatabaseHealthService } from './database.health';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  providers: [DatabaseHealthService],
  exports: [DatabaseHealthService],
})
export class HealthModule {}