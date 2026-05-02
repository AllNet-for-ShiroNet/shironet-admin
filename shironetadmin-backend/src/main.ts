// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    app.use(cookieParser());

    // 添加全局API前缀
    app.setGlobalPrefix('api');

    // 启用CORS (前后端分离必须)
    app.enableCors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: 'Content-Type,Authorization',
    });

    // 启用全局验证管道
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }));

    const port = configService.get<number>('PORT', 3000);
    
    await app.listen(port);
    
    logger.log(`应用已启动: http://localhost:${port}/api`);
    logger.log(`认证端点:`);
    logger.log(`   POST http://localhost:${port}/api/auth/register`);
    logger.log(`   POST http://localhost:${port}/api/auth/login`);
    logger.log(`   GET  http://localhost:${port}/api/auth/profile`);
    logger.log(`健康检查: http://localhost:${port}/api/health`);
    logger.log(`数据库: aime (业务), shironet (认证)`);
    
  } catch (error) {
    logger.error('❌ 应用启动失败:', error);
    process.exit(1);
  }
}

bootstrap();