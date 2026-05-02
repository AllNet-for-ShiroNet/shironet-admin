// user.dto.ts (完整版本，包含 Swagger 文档)
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  TRUST_USER = 'trust_user',
  USER = 'user',
}

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'zhangsan' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(2, { message: '用户名长度不能少于2个字符' })
  @MaxLength(20, { message: '用户名长度不能超过20个字符' })
  username: string;

  @ApiProperty({ description: '邮箱地址', example: 'zhangsan@example.com' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '请输入正确的邮箱格式' })
  email: string;

  @ApiPropertyOptional({ description: 'AIME卡号', example: '0001234567890123' })
  @IsOptional()
  @IsString()
  aimeCard?: string;

  @ApiProperty({ description: '权限组', enum: UserRole, example: UserRole.USER })
  @IsEnum(UserRole, { message: '权限组必须是有效值' })
  role: UserRole;

  @ApiPropertyOptional({ description: '是否锁定卡片', default: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  cardLocked?: boolean;

  @ApiPropertyOptional({ description: '是否封禁卡片', default: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  cardBanned?: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '用户名' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  username?: string;

  @ApiPropertyOptional({ description: '邮箱地址' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'AIME卡号' })
  @IsOptional()
  @IsString()
  aimeCard?: string;

  @ApiPropertyOptional({ description: '权限组', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: '是否锁定卡片' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  cardLocked?: boolean;

  @ApiPropertyOptional({ description: '是否封禁卡片' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  cardBanned?: boolean;
}

export class QueryUserDto {
  @ApiPropertyOptional({ description: '搜索关键词（用户名或邮箱）' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '权限组筛选', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: '卡片状态筛选', enum: ['normal', 'locked', 'banned'] })
  @IsOptional()
  @IsString()
  cardStatus?: 'normal' | 'locked' | 'banned';

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;
}