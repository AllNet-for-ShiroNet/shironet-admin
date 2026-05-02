// src/common/health/database.health.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthService {
  constructor(
    @InjectDataSource() private aimeDataSource: DataSource,
    @InjectDataSource('shironet') private shironetDataSource: DataSource,
  ) {}

  async checkAimeConnection(): Promise<{ status: string; database: string }> {
    try {
      await this.aimeDataSource.query('SELECT 1');
      return { 
        status: 'healthy', 
        database: this.aimeDataSource.options.database as string 
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        database: this.aimeDataSource.options.database as string 
      };
    }
  }

  async checkShironetConnection(): Promise<{ status: string; database: string }> {
    try {
      await this.shironetDataSource.query('SELECT 1');
      return { 
        status: 'healthy', 
        database: this.shironetDataSource.options.database as string 
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        database: this.shironetDataSource.options.database as string 
      };
    }
  }

  async getAllConnectionsStatus() {
    const [aime, shironet] = await Promise.all([
      this.checkAimeConnection(),
      this.checkShironetConnection(),
    ]);

    return {
      aime,
      shironet,
      overall: aime.status === 'healthy' && shironet.status === 'healthy' ? 'healthy' : 'unhealthy',
    };
  }
}