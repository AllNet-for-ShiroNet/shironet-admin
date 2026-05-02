// src/common/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { DatabaseHealthService } from './database.health';
import { Public } from '../../auth/decorators/public.decorator';

/** 容器 / 负载均衡探活，不要求登录 */
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly databaseHealthService: DatabaseHealthService) {}

  @Get()
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'shironet-admin-backend',
    };
  }

  @Get('database')
  async getDatabaseHealth() {
    return this.databaseHealthService.getAllConnectionsStatus();
  }
}
