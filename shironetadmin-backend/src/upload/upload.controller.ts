import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipeBuilder,
  HttpStatus,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Express } from 'express';
import { AdminOnly } from '../auth/decorators/auth.decorator';
import { UploadService } from './upload.service';
import {
  BatchImportAvatarAccessoryDto,
  BatchImportMapIconDto,
  BatchImportNamePlateDto,
  BatchImportSystemVoiceDto,
  BatchImportTrophiesDto,
  BatchImportMusicDto,
  XmlParseResultDto,
  ImportResultDto,
} from './dto/upload.dto';

@ApiTags('upload')
@ApiBearerAuth()
@AdminOnly()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  private formatParseMessage(result: XmlParseResultDto): string {
    let msg = `解析完成，共处理 ${result.fileCount} 个文件，获得 ${result.dataCount} 条数据`;
    if (result.uploadedAssets?.length) {
      msg += `，R2 已写入 ${result.uploadedAssets.length} 个资源`;
    }
    if (result.uploadErrors?.length) {
      msg += `（${result.uploadErrors.length} 条上传告警）`;
    }
    return msg;
  }

  // 文件上传验证管道
  private readonly fileValidationPipe = new ParseFilePipeBuilder()
    .addFileTypeValidator({
      fileType: /(xml|zip)$/,
    })
    .addMaxSizeValidator({
      maxSize: 300 * 1024 * 1024, // 300MB
    })
    .build({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });

  @Post('avatar-accessory')
  @ApiOperation({ summary: '上传头像配饰 XML 文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '文件解析成功',
    type: XmlParseResultDto,
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadAvatarAccessoryFiles(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ success: boolean; data: XmlParseResultDto; message: string }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const result = await this.uploadService.parseUploadedFiles(files, 'avatarAccessory');
    return {
      success: true,
      data: result,
      message: this.formatParseMessage(result),
    };
  }

  @Post('map-icon')
  @ApiOperation({ summary: '上传地图图标 XML 文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMapIconFiles(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ success: boolean; data: XmlParseResultDto; message: string }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const result = await this.uploadService.parseUploadedFiles(files, 'mapIcon');
    return {
      success: true,
      data: result,
      message: this.formatParseMessage(result),
    };
  }

  @Post('name-plate')
  @ApiOperation({ summary: '上传姓名板 XML 文件' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadNamePlateFiles(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ success: boolean; data: XmlParseResultDto; message: string }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const result = await this.uploadService.parseUploadedFiles(files, 'namePlate');
    return {
      success: true,
      data: result,
      message: this.formatParseMessage(result),
    };
  }

  @Post('system-voice')
  @ApiOperation({ summary: '上传系统语音 XML 文件' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadSystemVoiceFiles(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ success: boolean; data: XmlParseResultDto; message: string }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const result = await this.uploadService.parseUploadedFiles(files, 'systemVoice');
    return {
      success: true,
      data: result,
      message: this.formatParseMessage(result),
    };
  }

  @Post('trophies')
  @ApiOperation({ summary: '上传奖杯 XML 文件' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadTrophiesFiles(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ success: boolean; data: XmlParseResultDto; message: string }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const result = await this.uploadService.parseUploadedFiles(files, 'trophy');
    return {
      success: true,
      data: result,
      message: this.formatParseMessage(result),
    };
  }

  @Post('music')
  @ApiOperation({ summary: '上传音乐 XML 文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '文件解析成功',
    type: XmlParseResultDto,
  })
  @UseInterceptors(FilesInterceptor('files', 50)) // 增加文件数量限制，因为可能有很多音乐文件
  async uploadMusicFiles(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ success: boolean; data: XmlParseResultDto; message: string }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const result = await this.uploadService.parseUploadedFiles(files, 'music');
    return {
      success: true,
      data: result,
      message: this.formatParseMessage(result),
    };
  }

  @Post('batch/avatar-accessory')
  @ApiOperation({ summary: '批量导入头像配饰数据' })
  @ApiResponse({
    status: 200,
    description: '导入成功',
    type: ImportResultDto,
  })
  @ApiBody({ type: BatchImportAvatarAccessoryDto })
  async batchImportAvatarAccessory(
    @Body() batchData: BatchImportAvatarAccessoryDto,
  ): Promise<{ success: boolean; data: ImportResultDto; message: string }> {
    const result = await this.uploadService.batchImportAvatarAccessory(batchData);
    return {
      success: true,
      data: result,
      message: `导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`,
    };
  }

  @Post('batch/map-icon')
  @ApiOperation({ summary: '批量导入地图图标数据' })
  @ApiBody({ type: BatchImportMapIconDto })
  async batchImportMapIcon(
    @Body() batchData: BatchImportMapIconDto,
  ): Promise<{ success: boolean; data: ImportResultDto; message: string }> {
    const result = await this.uploadService.batchImportMapIcon(batchData);
    return {
      success: true,
      data: result,
      message: `导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`,
    };
  }

  @Post('batch/name-plate')
  @ApiOperation({ summary: '批量导入姓名板数据' })
  @ApiBody({ type: BatchImportNamePlateDto })
  async batchImportNamePlate(
    @Body() batchData: BatchImportNamePlateDto,
  ): Promise<{ success: boolean; data: ImportResultDto; message: string }> {
    const result = await this.uploadService.batchImportNamePlate(batchData);
    return {
      success: true,
      data: result,
      message: `导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`,
    };
  }

  @Post('batch/system-voice')
  @ApiOperation({ summary: '批量导入系统语音数据' })
  @ApiBody({ type: BatchImportSystemVoiceDto })
  async batchImportSystemVoice(
    @Body() batchData: BatchImportSystemVoiceDto,
  ): Promise<{ success: boolean; data: ImportResultDto; message: string }> {
    const result = await this.uploadService.batchImportSystemVoice(batchData);
    return {
      success: true,
      data: result,
      message: `导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`,
    };
  }

  @Post('batch/trophies')
  @ApiOperation({ summary: '批量导入奖杯数据' })
  @ApiBody({ type: BatchImportTrophiesDto })
  async batchImportTrophies(
    @Body() batchData: BatchImportTrophiesDto,
  ): Promise<{ success: boolean; data: ImportResultDto; message: string }> {
    const result = await this.uploadService.batchImportTrophies(batchData);
    return {
      success: true,
      data: result,
      message: `导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`,
    };
  }

  @Post('batch/music')
  @ApiOperation({ summary: '批量导入音乐数据' })
  @ApiResponse({
    status: 200,
    description: '导入成功',
    type: ImportResultDto,
  })
  @ApiBody({ type: BatchImportMusicDto })
  async batchImportMusic(
    @Body() batchData: BatchImportMusicDto,
  ): Promise<{ success: boolean; data: ImportResultDto; message: string }> {
    const result = await this.uploadService.batchImportMusic(batchData, batchData.version);
    return {
      success: true,
      data: result,
      message: `导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: '获取导入统计信息' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  async getImportStats(): Promise<{ success: boolean; data: any; message: string }> {
    const stats = await this.uploadService.getImportStats();
    return {
      success: true,
      data: stats,
      message: '获取统计信息成功',
    };
  }

  @Get(':type/list')
  @ApiOperation({ summary: '获取指定类型的数据列表' })
  @ApiParam({
    name: 'type',
    description: '数据类型',
    enum: ['avatar-accessory', 'map-icon', 'name-plate', 'system-voice', 'trophies', 'music'],
  })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async getDataList(
    @Param('type') type: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ): Promise<{ success: boolean; data: any; total: number; message: string }> {
    const result = await this.uploadService.getDataList(type, page, pageSize);
    return {
      success: true,
      data: result.data,
      total: result.total,
      message: '获取数据列表成功',
    };
  }
  
  @Delete('clear/:type')
  @ApiOperation({ summary: '清空指定类型的数据' })
  @ApiParam({
    name: 'type',
    description: '数据类型',
    enum: ['avatarAccessory', 'mapIcon', 'namePlate', 'systemVoice', 'trophies', 'music'],
  })
  @ApiResponse({
    status: 200,
    description: '清空成功',
  })
  async clearData(
    @Param('type') type: 'avatarAccessory' | 'mapIcon' | 'namePlate' | 'systemVoice' | 'trophies' | 'music',
  ): Promise<{ success: boolean; message: string }> {
    await this.uploadService.clearData(type);
    return {
      success: true,
      message: `${type} 数据清空成功`,
    };
  }
}