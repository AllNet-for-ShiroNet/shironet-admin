// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { MachineModule } from './machine/machine.module';
import { RedeemModule } from './redeem/redeem.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { UploadModule } from './upload/upload.module';
import { AuthModule } from './auth/auth.module';
import { ChuniModule } from './chuni/chuni.module';
import { DownloadModule } from './download/download.module';
import { HealthModule } from './common/health/health.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

// aime 数据库实体
import { AimeUser } from './user/entities/aime-user.entity';
import { AimeCard } from './user/entities/aime-card.entity';
import { Machine } from './machine/entities/machine.entity';
import { Arcade } from './machine/entities/arcade.entity';
import { RedeemCode } from './redeem/entities/redeem-code.entity';
import { RedeemCodeUsage } from './redeem/entities/redeem-code-usage.entity';
import { Announcement } from './announcements/entities/announcement.entity';
import {
  ChuniAvatarAccessory,
  ChuniMapIcon,
  ChuniNamePlate,
  ChuniSystemVoice,
  ChuniTrophies,
  ChuniStaticMusic,
  ChuniCharacterImage,
} from './upload/entities/chuni-static.entity';
import { ChuniProfile } from './chuni/entities/chuni-profile.entity';
import { ChuniScore } from './chuni/entities/chuni-score.entity';
import { ChuniItem } from './chuni/entities/chuni-item.entity';

// shironet 数据库实体
import { User } from './auth/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: false,
      expandVariables: true,
    }),
   
    // 主数据库连接 (aime)
    TypeOrmModule.forRootAsync({
      name: 'default', // 默认连接名
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mariadb',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'aime'),
        entities: [
          AimeUser,
          AimeCard,
          Machine,
          Arcade,
          RedeemCode,
          RedeemCodeUsage,
          Announcement,
          ChuniAvatarAccessory,
          ChuniMapIcon,
          ChuniNamePlate,
          ChuniSystemVoice,
          ChuniTrophies,
          ChuniStaticMusic,
          ChuniCharacterImage,
          ChuniProfile,
          ChuniScore,
          ChuniItem,
        ],
        synchronize: false,
        migrationsRun: false,
        logging: configService.get('NODE_ENV') === 'development',
        autoLoadEntities: true,
        timezone: '+08:00',
      }),
      inject: [ConfigService],
    }),
    
    // shironet 数据库连接 (用于用户认证)
    TypeOrmModule.forRootAsync({
      name: 'shironet', // 指定连接名
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mariadb',
        host: configService.get<string>('SHIRO_DB_HOST', 'localhost'),
        port: configService.get<number>('SHIRO_DB_PORT', 3306),
        username: configService.get<string>('SHIRO_DB_USERNAME', 'root'),
        password: configService.get<string>('SHIRO_DB_PASSWORD', ''),
        database: configService.get<string>('SHIRO_DB_DATABASE', 'shironet'),
        entities: [User], // 只包含认证相关的实体
        synchronize: false,
        migrationsRun: false,
        logging: configService.get('NODE_ENV') === 'development',
        timezone: '+08:00',
      }),
      inject: [ConfigService],
    }),
   
    // 功能模块
    AuthModule, // 认证模块
    UserModule,
    MachineModule,
    RedeemModule,
    AnnouncementsModule,
    UploadModule,
    ChuniModule, // CHUNITHM数据模块
    DownloadModule, // 文件下载模块
    HealthModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}