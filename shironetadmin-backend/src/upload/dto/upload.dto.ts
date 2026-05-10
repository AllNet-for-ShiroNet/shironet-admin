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

// chuni_static_character（Chara.xml / CharaData）导入 DTO
export class ImportChuniStaticCharacterDto {
  @ApiProperty({ description: '静态角色主键（通常为游戏 name.id 的字符串形式）' })
  @IsString()
  @MaxLength(255)
  characterId: string;

  @ApiProperty({ description: '版本（多为 releaseTagName.id）' })
  @IsInt()
  @Min(0)
  version: number;

  @ApiProperty({ description: '显示名', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: '排序名', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sortName?: string | null;

  @ApiPropertyOptional({ description: '作品名', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  worksName?: string | null;

  @ApiPropertyOptional({ description: '稀有度（字符串存储）', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  rareType?: string | null;

  @ApiPropertyOptional({
    description:
      'UI 立绘 0 槽（CHU_UI_Character_{seg4}_{costume}_{00}.dds：优先 defaultImages.str 如 chara5095_XX 解析 seg；否则 id≥10000 用 ⌊id/10⌋取 seg）',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  imagePath1?: string | null;

  @ApiPropertyOptional({
    description:
      'UI 立绘 1 槽（…_{01}.dds；addImages1.image.id 有效时参与首段，否则同默认段）',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  imagePath2?: string | null;

  @ApiPropertyOptional({
    description:
      'UI 立绘 2 槽（…_{02}.dds；addImages2.image.id 有效时参与首段）',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  imagePath3?: string | null;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  isEnabled?: boolean | null;

  @ApiPropertyOptional({ description: '是否默认持有' })
  @IsOptional()
  defaultHave?: boolean | null;
}

// 人物贴图（DDSImage）导入 DTO
export class ImportCharacterDto {
  @ApiProperty({ description: 'ID' })
  @IsInt()
  @Min(0)
  id: number;

  @ApiProperty({ description: '名称', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: '数据名', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  dataName: string;

  @ApiProperty({ description: '主贴图路径', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  ddsFile0Path: string;

  @ApiPropertyOptional({ description: '副贴图路径1', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ddsFile1Path?: string;

  @ApiPropertyOptional({ description: '副贴图路径2', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ddsFile2Path?: string;

  @ApiPropertyOptional({ description: '开放版本 ID' })
  @IsOptional()
  @IsInt()
  @Min(0)
  netOpenId?: number;

  @ApiPropertyOptional({ description: '开放版本名', maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  netOpenName?: string;
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

export class BatchImportCharacterDto {
  @ApiProperty({ description: 'Chara.xml 静态角色（chuni_static_character）', type: [ImportChuniStaticCharacterDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportChuniStaticCharacterDto)
  data: ImportChuniStaticCharacterDto[];
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