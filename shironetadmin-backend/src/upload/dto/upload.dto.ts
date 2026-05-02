import {
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 基础 XML 数据项
export class BaseXmlItemDto {
  @ApiProperty({ description: 'ID' })
  @IsInt()
  @Min(0)
  id: number;

  @ApiProperty({ description: '名称', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: '排序名称', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  sortName: string;

  @ApiProperty({ description: '图片路径', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  imagePath: string;
}

// 头像配饰导入 DTO
export class ImportAvatarAccessoryDto {
  @ApiProperty({ description: 'ID' })
  @IsInt()
  @Min(0)
  id: number;

  @ApiProperty({ description: '名称', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: '排序名称', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  sortName: string;

  @ApiProperty({ description: '分类' })
  @IsInt()
  @Min(0)
  category: number;

  @ApiProperty({ description: '图片路径', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  imagePath: string;
}

// 地图图标导入 DTO
export class ImportMapIconDto extends BaseXmlItemDto {}

// 姓名板导入 DTO
export class ImportNamePlateDto extends BaseXmlItemDto {}

// 系统语音导入 DTO
export class ImportSystemVoiceDto extends BaseXmlItemDto {
  @ApiProperty({ description: '音频路径', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  cuePath: string;
}

// 奖杯导入 DTO
export class ImportTrophiesDto {
  @ApiProperty({ description: 'ID' })
  @IsInt()
  @Min(0)
  id: number;

  @ApiProperty({ description: '名称', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: '稀有度类型' })
  @IsInt()
  @Min(0)
  rareType: number;

  @ApiProperty({ description: '说明文本' })
  @IsString()
  explainText: string;
}

// 音乐数据导入 DTO
export class ImportMusicDto {
  @ApiProperty({ description: '歌曲 ID' })
  @IsInt()
  @Min(0)
  songId: number;

  @ApiProperty({ description: '谱面 ID' })
  @IsInt()
  @Min(0)
  chartId: number;

  @ApiProperty({ description: '歌曲标题', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: '艺术家', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  artist: string;

  @ApiProperty({ description: '难度等级' })
  @IsNumber()
  @Min(0)
  level: number;

  @ApiProperty({ description: '音乐类型', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  genre: string;

  @ApiProperty({ description: '封面路径', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  jacketPath: string;

  @ApiPropertyOptional({ description: 'World\'s End 标签', maxLength: 7 })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  worldsEndTag?: string;

  @ApiProperty({ description: '网络版本', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  netversion: string;
}

// 批量导入 DTO
export class BatchImportAvatarAccessoryDto {
  @ApiProperty({ description: '头像配饰数据数组', type: [ImportAvatarAccessoryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportAvatarAccessoryDto)
  data: ImportAvatarAccessoryDto[];
}

export class BatchImportMapIconDto {
  @ApiProperty({ description: '地图图标数据数组', type: [ImportMapIconDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportMapIconDto)
  data: ImportMapIconDto[];
}

export class BatchImportNamePlateDto {
  @ApiProperty({ description: '姓名板数据数组', type: [ImportNamePlateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportNamePlateDto)
  data: ImportNamePlateDto[];
}

export class BatchImportSystemVoiceDto {
  @ApiProperty({ description: '系统语音数据数组', type: [ImportSystemVoiceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportSystemVoiceDto)
  data: ImportSystemVoiceDto[];
}

export class BatchImportTrophiesDto {
  @ApiProperty({ description: '奖杯数据数组', type: [ImportTrophiesDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportTrophiesDto)
  data: ImportTrophiesDto[];
}

export class BatchImportMusicDto {
  @ApiProperty({ description: '版本号' })
  @IsInt()
  @Min(0)
  version: number;

  @ApiProperty({ description: '音乐数据数组', type: [ImportMusicDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportMusicDto)
  data: ImportMusicDto[];
}

export class UploadedAssetDto {
  @ApiProperty({ description: 'R2 对象键' })
  key: string;

  @ApiProperty({ description: 'ZIP 内源路径' })
  sourceZipPath: string;
}

// XML 文件上传结果 DTO
export class XmlParseResultDto {
  @ApiProperty({ description: '解析成功的数据' })
  data: any[];

  @ApiProperty({ description: '解析的文件数量' })
  fileCount: number;

  @ApiProperty({ description: '解析的数据条数' })
  dataCount: number;

  @ApiProperty({ description: '错误信息', required: false })
  @IsOptional()
  errors?: string[];

  @ApiPropertyOptional({
    description: '已成功上传到 R2 的资源',
    type: [UploadedAssetDto],
  })
  @IsOptional()
  uploadedAssets?: UploadedAssetDto[];

  @ApiPropertyOptional({ description: '资源上传到 R2 时的错误' })
  @IsOptional()
  uploadErrors?: string[];
}

// 导入结果统计 DTO
export class ImportResultDto {
  @ApiProperty({ description: '导入成功的数量' })
  success: number;

  @ApiProperty({ description: '导入失败的数量' })
  failed: number;

  @ApiProperty({ description: '跳过的数量（已存在）' })
  skipped: number;

  @ApiProperty({ description: '总处理数量' })
  total: number;

  @ApiProperty({ description: '错误详情', required: false })
  @IsOptional()
  errors?: string[];
}