import {
    IsString,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsDateString,
    IsArray,
    IsNumber,
    IsInt,
    Min,
    Max,
    Length,
    Matches,
    ValidateIf,
  } from 'class-validator';
  import { Transform, Type } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
  import { AnnouncementStatus, AnnouncementType } from '../entities/announcement.entity';
  
  // Markdown 验证装饰器
  function IsMarkdown() {
    return Matches(/^[\s\S]*$/, {
      message: '内容必须是有效的 Markdown 格式',
    });
  }
  
  export class CreateAnnouncementDto {
    @ApiProperty({ description: '公告标题', maxLength: 100 })
    @IsString()
    @Length(1, 100, { message: '标题长度必须在1-100个字符之间' })
    title: string;
  
    @ApiProperty({ description: '公告内容（Markdown格式）' })
    @IsString()
    @Length(1, 10000, { message: '内容长度必须在1-10000个字符之间' })
    @IsMarkdown()
    content: string;
  
    @ApiProperty({
      description: '公告类型',
      enum: AnnouncementType,
      example: AnnouncementType.SYSTEM,
    })
    @IsEnum(AnnouncementType, { message: '公告类型无效' })
    type: AnnouncementType;
  
    @ApiPropertyOptional({ description: '是否置顶', default: false })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === true || value === 'true')
    isPinned?: boolean;
  
    @ApiPropertyOptional({ description: '发布时间' })
    @IsOptional()
    @IsDateString({}, { message: '发布时间格式无效' })
    publishTime?: string;
  
    @ApiPropertyOptional({ description: '过期时间' })
    @IsOptional()
    @IsDateString({}, { message: '过期时间格式无效' })
    @ValidateIf((o) => o.publishTime)
    expireTime?: string;
  
    @ApiPropertyOptional({ description: '创建者ID' })
    @IsOptional()
    @IsNumber()
    createdBy?: number;
  }
  
  export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {
    @ApiPropertyOptional({
      description: '公告状态',
      enum: AnnouncementStatus,
    })
    @IsOptional()
    @IsEnum(AnnouncementStatus, { message: '公告状态无效' })
    status?: AnnouncementStatus;
  }
  
  export class QueryAnnouncementDto {
    @ApiPropertyOptional({ description: '页码', default: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;
  
    @ApiPropertyOptional({ description: '每页数量', default: 10, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;
  
    @ApiPropertyOptional({ description: '搜索关键词' })
    @IsOptional()
    @IsString()
    @Length(0, 100)
    search?: string;
  
    @ApiPropertyOptional({
      description: '状态筛选',
      enum: AnnouncementStatus,
    })
    @IsOptional()
    @IsEnum(AnnouncementStatus)
    status?: AnnouncementStatus;
  
    @ApiPropertyOptional({
      description: '类型筛选',
      enum: AnnouncementType,
    })
    @IsOptional()
    @IsEnum(AnnouncementType)
    type?: AnnouncementType;
  
    @ApiPropertyOptional({ description: '是否置顶筛选' })
    @IsOptional()
    @Transform(({ value }) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    })
    @IsBoolean()
    isPinned?: boolean;
  
    @ApiPropertyOptional({ description: '创建者ID筛选' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    createdBy?: number;
  }
  
  export class BatchPublishDto {
    @ApiProperty({ description: '公告ID数组', type: [Number] })
    @IsArray()
    @IsNumber({}, { each: true })
    ids: number[];
  }
  
  export class BatchDeleteDto {
    @ApiProperty({ description: '公告ID数组', type: [Number] })
    @IsArray()
    @IsNumber({}, { each: true })
    ids: number[];
  }
  
  export class AnnouncementResponseDto {
    @ApiProperty({ description: '公告ID' })
    id: number;
  
    @ApiProperty({ description: '公告标题' })
    title: string;
  
    @ApiProperty({ description: '公告内容' })
    content: string;
  
    @ApiProperty({ description: '公告类型', enum: AnnouncementType })
    type: AnnouncementType;
  
    @ApiProperty({ description: '是否置顶' })
    isPinned: boolean;
  
    @ApiProperty({ description: '创建时间' })
    createTime: string;
  
    @ApiProperty({ description: '发布时间' })
    publishTime: string | null;
  
    @ApiProperty({ description: '过期时间' })
    expireTime: string | null;
  
    @ApiProperty({ description: '状态', enum: AnnouncementStatus })
    status: AnnouncementStatus;
  
    @ApiProperty({ description: '创建者ID' })
    createdBy: number;
  
    @ApiProperty({ description: '记录创建时间' })
    createdAt: string;
  
    @ApiProperty({ description: '记录更新时间' })
    updatedAt: string;
  }
  
  export class PaginatedAnnouncementResponseDto {
    @ApiProperty({ description: '公告列表', type: [AnnouncementResponseDto] })
    announcements: AnnouncementResponseDto[];
  
    @ApiProperty({ description: '总数' })
    total: number;
  
    @ApiProperty({ description: '当前页' })
    page: number;
  
    @ApiProperty({ description: '每页数量' })
    limit: number;
  
    @ApiProperty({ description: '总页数' })
    totalPages: number;
  }
  
  export class AnnouncementStatsDto {
    @ApiProperty({ description: '总公告数' })
    total: number;
  
    @ApiProperty({ description: '已发布数' })
    published: number;
  
    @ApiProperty({ description: '草稿数' })
    draft: number;
  
    @ApiProperty({ description: '已过期数' })
    expired: number;
  
    @ApiProperty({ description: '置顶数' })
    pinned: number;
  }