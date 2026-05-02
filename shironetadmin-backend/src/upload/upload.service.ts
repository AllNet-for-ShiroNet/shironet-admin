import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parseStringPromise } from 'xml2js';
import * as JSZip from 'jszip';
import { Express } from 'express';
import {
  ChuniAvatarAccessory,
  ChuniMapIcon,
  ChuniNamePlate,
  ChuniSystemVoice,
  ChuniTrophies,
  ChuniStaticMusic,
} from './entities/chuni-static.entity';
import {
  ImportAvatarAccessoryDto,
  ImportMapIconDto,
  ImportNamePlateDto,
  ImportSystemVoiceDto,
  ImportTrophiesDto,
  ImportMusicDto,
  BatchImportAvatarAccessoryDto,
  BatchImportMapIconDto,
  BatchImportNamePlateDto,
  BatchImportSystemVoiceDto,
  BatchImportTrophiesDto,
  BatchImportMusicDto,
  XmlParseResultDto,
  ImportResultDto,
} from './dto/upload.dto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @InjectRepository(ChuniAvatarAccessory)
    private avatarAccessoryRepository: Repository<ChuniAvatarAccessory>,

    @InjectRepository(ChuniMapIcon)
    private mapIconRepository: Repository<ChuniMapIcon>,
    
    @InjectRepository(ChuniNamePlate)
    private namePlateRepository: Repository<ChuniNamePlate>,
    
    @InjectRepository(ChuniSystemVoice)
    private systemVoiceRepository: Repository<ChuniSystemVoice>,
    
    @InjectRepository(ChuniTrophies)
    private trophiesRepository: Repository<ChuniTrophies>,
    
    @InjectRepository(ChuniStaticMusic)
    private musicRepository: Repository<ChuniStaticMusic>,
  ) {}

  /**
   * 解析上传的 XML 文件或 ZIP 压缩包
   */
  async parseUploadedFiles(
    files: Express.Multer.File[],
    type: 'avatarAccessory' | 'mapIcon' | 'namePlate' | 'systemVoice' | 'trophy' | 'music'
  ): Promise<XmlParseResultDto> {
    this.logger.log(`解析上传文件，类型: ${type}, 文件数量: ${files.length}`);

    let allData: any[] = [];
    let fileCount = 0;
    let errors: string[] = [];

    for (const file of files) {
      try {
        if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
          // 处理 ZIP 文件
          const zipData = await this.parseZipFile(file.buffer, type);
          allData.push(...zipData.data);
          fileCount += zipData.fileCount;
          if (zipData.errors) {
            errors.push(...zipData.errors);
          }
        } else if (file.mimetype === 'application/xml' || file.originalname.endsWith('.xml')) {
          // 处理单个 XML 文件
          const xmlData = await this.parseXmlFile(file.buffer, file.originalname, type);
          if (xmlData) {
            if (Array.isArray(xmlData)) {
              allData.push(...xmlData);
            } else {
              allData.push(xmlData);
            }
            fileCount += 1;
          }
        } else {
          errors.push(`不支持的文件格式: ${file.originalname}`);
        }
      } catch (error) {
        this.logger.error(`解析文件失败: ${file.originalname}`, error);
        errors.push(`解析文件失败: ${file.originalname} - ${error.message}`);
      }
    }

    return {
      data: allData,
      fileCount,
      dataCount: allData.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 解析 ZIP 文件
   */
  private async parseZipFile(
    buffer: Buffer,
    type: string
  ): Promise<{ data: any[]; fileCount: number; errors?: string[] }> {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(buffer);
    
    let data: any[] = [];
    let fileCount = 0;
    let errors: string[] = [];

    if (type === 'music') {
      // 特殊处理音乐文件：查找 music/music{id}/Music.xml 格式 - 保持原有逻辑
      for (const [filename, file] of Object.entries(zipContent.files)) {
        if (!file.dir && filename.match(/music\/music\d+\/Music\.xml$/)) {
          try {
            const xmlBuffer = await file.async('nodebuffer');
            const xmlDataArray = await this.parseXmlFile(xmlBuffer, filename, type);
            if (xmlDataArray && Array.isArray(xmlDataArray)) {
              data.push(...xmlDataArray);
              fileCount += 1;
            }
          } catch (error) {
            this.logger.error(`解析 ZIP 中的 Music.xml 文件失败: ${filename}`, error);
            errors.push(`解析 ZIP 中的 Music.xml 文件失败: ${filename} - ${error.message}`);
          }
        }
      }
    } else {
      // 处理其他类型：根据Python脚本的路径模式
      const folderMapping = {
        'avatarAccessory': 'avatarAccessory',
        'mapIcon': 'mapIcon',
        'namePlate': 'namePlate', 
        'systemVoice': 'systemVoice',
        'trophy': 'trophy'
      };
      
      const targetFolder = folderMapping[type];
      const targetFileName = this.getTargetFileName(type);
      
      for (const [filename, file] of Object.entries(zipContent.files)) {
        if (!file.dir && filename.endsWith('.xml')) {
          // 匹配路径模式：A000/{folder}/{subfolder}/{FileName}.xml 或 A001/{folder}/{subfolder}/{FileName}.xml
          const pathPattern = new RegExp(`A\\d{3}/${targetFolder}/[^/]+/${targetFileName}\\.xml$`, 'i');
          
          if (pathPattern.test(filename) || 
              (filename.toLowerCase().includes(`${targetFolder.toLowerCase()}/`) && 
               filename.toLowerCase().includes(`${targetFileName.toLowerCase()}.xml`))) {
            
            try {
              const xmlBuffer = await file.async('nodebuffer');
              const xmlData = await this.parseXmlFile(xmlBuffer, filename, type);
              if (xmlData) {
                data.push(xmlData);
                fileCount += 1;
              }
            } catch (error) {
              this.logger.error(`解析 ZIP 中的 XML 文件失败: ${filename}`, error);
              errors.push(`解析 ZIP 中的 XML 文件失败: ${filename} - ${error.message}`);
            }
          }
        }
      }
    }

    return { data, fileCount, errors: errors.length > 0 ? errors : undefined };
  }

  /**
   * 获取目标文件名
   */
  private getTargetFileName(type: string): string {
    const fileNameMapping = {
      'avatarAccessory': 'AvatarAccessory',
      'mapIcon': 'MapIcon',
      'namePlate': 'NamePlate',
      'systemVoice': 'SystemVoice', 
      'trophy': 'Trophy'
    };
    return fileNameMapping[type] || type;
  }

  /**
   * 解析单个 XML 文件
   */
  private async parseXmlFile(
    buffer: Buffer,
    filename: string,
    type: string
  ): Promise<any | null> {
    try {
      const xmlContent = buffer.toString('utf8');
      const parsed = await parseStringPromise(xmlContent);
      
      return this.extractDataFromXml(parsed, type, filename);
    } catch (error) {
      this.logger.error(`解析 XML 文件失败: ${filename}`, error);
      throw new BadRequestException(`解析 XML 文件失败: ${filename} - ${error.message}`);
    }
  }

  /**
   * 从解析的 XML 中提取数据
   */
  private extractDataFromXml(parsed: any, type: string, filename: string): any | null {
    try {
      // 添加调试信息
      this.logger.debug(`正在解析文件: ${filename}, 类型: ${type}`);
      this.debugXmlStructure(parsed, filename);
      
      let result = null;
      
      switch (type) {
        case 'avatarAccessory':
          result = this.extractAvatarAccessoryData(parsed);
          break;
        case 'mapIcon':
          result = this.extractMapIconData(parsed);
          break;
        case 'namePlate':
          result = this.extractNamePlateData(parsed);
          break;
        case 'systemVoice':
          result = this.extractSystemVoiceData(parsed);
          break;
        case 'trophy':
          result = this.extractTrophyData(parsed);
          break;
        case 'music':
          result = this.extractMusicData(parsed);
          break;
        default:
          this.logger.warn(`不支持的数据类型: ${type}`);
          return null;
      }
      
      if (result) {
        this.logger.debug(`成功提取数据: ${filename}`, result);
      } else {
        this.logger.warn(`未能提取数据: ${filename}, 类型: ${type}`);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`提取 XML 数据失败: ${filename}`, error);
      return null;
    }
  }

  /**
   * 调试用：打印XML结构
   */
  private debugXmlStructure(parsed: any, filename: string): void {
    this.logger.debug(`XML文件结构 - ${filename}:`, {
      rootKeys: Object.keys(parsed),
      structure: JSON.stringify(parsed, null, 2).slice(0, 500) // 只打印前500字符
    });
  }

  /**
   * 通用的值提取方法
   */
  private extractValue(obj: any, path: string[], type: 'string' | 'number' = 'string'): any {
    try {
      let current = obj;
      
      // 沿着路径向下遍历
      for (const key of path) {
        if (current && typeof current === 'object') {
          // 处理数组形式的值 (xml2js的默认行为)
          if (Array.isArray(current[key]) && current[key].length > 0) {
            current = current[key][0];
          } else if (current[key] !== undefined) {
            current = current[key];
          } else {
            return null;
          }
        } else {
          return null;
        }
      }
      
      // 类型转换
      if (type === 'number') {
        const num = parseInt(String(current));
        return isNaN(num) ? 0 : num;
      }
      
      return String(current || '');
    } catch (error) {
      this.logger.warn(`提取值失败: ${path.join('/')}`, error);
      return null;
    }
  }

  /**
   * 提取头像配饰数据
   */
  private extractAvatarAccessoryData(parsed: any): ImportAvatarAccessoryDto | null {
    try {
      let root = parsed;
      const possibleRoots = ['AvatarAccessoryData', 'avatarAccessoryData', 'AvatarAccessory', 'avatarAccessory'];
      
      for (const rootName of possibleRoots) {
        if (parsed[rootName]) {
          root = parsed[rootName];
          break;
        }
      }

      const id = this.extractValue(root, ['name', 'id'], 'number') || 0;
      const name = this.extractValue(root, ['name', 'str'], 'string') || '';
      const sortName = this.extractValue(root, ['sortName'], 'string') || '';
      const category = this.extractValue(root, ['category'], 'number') || 0;
      const imagePath = this.extractValue(root, ['image', 'path'], 'string') || '';

      this.logger.debug('头像配饰数据提取结果:', { id, name, sortName, category, imagePath });

      return {
        id,
        name,
        sortName,
        category,
        imagePath,
      };
    } catch (error) {
      this.logger.error('提取头像配饰数据失败', error);
      return null;
    }
  }

  /**
   * 提取地图图标数据 - 根据Python XPath修正
   */
  private extractMapIconData(parsed: any): ImportMapIconDto | null {
    try {
      let root = parsed;
      const possibleRoots = ['MapIcon', 'MapIconData', 'mapIcon', 'mapIconData'];
      
      for (const rootName of possibleRoots) {
        if (parsed[rootName]) {
          root = parsed[rootName];
          break;
        }
      }

      const id = this.extractValue(root, ['name', 'id'], 'number') || 0;
      const name = this.extractValue(root, ['name', 'str'], 'string') || '';
      const sortName = this.extractValue(root, ['sortName'], 'string') || '';
      const imagePath = this.extractValue(root, ['image', 'path'], 'string') || '';

      this.logger.debug('地图图标数据提取结果:', { id, name, sortName, imagePath });

      return {
        id,
        name,
        sortName,
        imagePath,
      };
    } catch (error) {
      this.logger.error('提取地图图标数据失败', error);
      return null;
    }
  }

  /**
   * 提取姓名板数据 - 根据Python XPath修正
   */
  private extractNamePlateData(parsed: any): ImportNamePlateDto | null {
    try {
      let root = parsed;
      const possibleRoots = ['NamePlate', 'NamePlateData', 'namePlate', 'namePlateData'];
      
      for (const rootName of possibleRoots) {
        if (parsed[rootName]) {
          root = parsed[rootName];
          break;
        }
      }

      const id = this.extractValue(root, ['name', 'id'], 'number') || 0;
      const name = this.extractValue(root, ['name', 'str'], 'string') || '';
      const sortName = this.extractValue(root, ['sortName'], 'string') || '';
      const imagePath = this.extractValue(root, ['image', 'path'], 'string') || '';

      this.logger.debug('姓名板数据提取结果:', { id, name, sortName, imagePath });

      return {
        id,
        name,
        sortName,
        imagePath,
      };
    } catch (error) {
      this.logger.error('提取姓名板数据失败', error);
      return null;
    }
  }

  /**
   * 提取系统语音数据 - 根据Python XPath修正
   */
  private extractSystemVoiceData(parsed: any): ImportSystemVoiceDto | null {
    try {
      let root = parsed;
      const possibleRoots = ['SystemVoice', 'SystemVoiceData', 'systemVoice', 'systemVoiceData'];
      
      for (const rootName of possibleRoots) {
        if (parsed[rootName]) {
          root = parsed[rootName];
          break;
        }
      }

      const id = this.extractValue(root, ['name', 'id'], 'number') || 0;
      const name = this.extractValue(root, ['name', 'str'], 'string') || '';
      const sortName = this.extractValue(root, ['sortName'], 'string') || '';
      const imagePath = this.extractValue(root, ['image', 'path'], 'string') || '';
      const cuePath = this.extractValue(root, ['cue', 'str'], 'string') || '';

      this.logger.debug('系统语音数据提取结果:', { id, name, sortName, imagePath, cuePath });

      return {
        id,
        name,
        sortName,
        imagePath,
        cuePath,
      };
    } catch (error) {
      this.logger.error('提取系统语音数据失败', error);
      return null;
    }
  }

  /**
   * 提取奖杯数据 - 根据Python XPath修正
   */
  private extractTrophyData(parsed: any): ImportTrophiesDto | null {
    try {
      let root = parsed;
      const possibleRoots = ['Trophy', 'TrophyData', 'trophy', 'trophyData'];
      
      for (const rootName of possibleRoots) {
        if (parsed[rootName]) {
          root = parsed[rootName];
          break;
        }
      }

      const id = this.extractValue(root, ['name', 'id'], 'number') || 0;
      const name = this.extractValue(root, ['name', 'str'], 'string') || '';
      const rareType = this.extractValue(root, ['rareType'], 'number') || 0;
      const explainText = this.extractValue(root, ['explainText'], 'string') || '';

      this.logger.debug('奖杯数据提取结果:', { id, name, rareType, explainText });

      return {
        id,
        name,
        rareType,
        explainText,
      };
    } catch (error) {
      this.logger.error('提取奖杯数据失败', error);
      return null;
    }
  }

  /**
   * 提取音乐数据 - 保持原有逻辑不变
   */
  private extractMusicData(parsed: any): ImportMusicDto[] | null {
    try {
      const root = parsed.MusicData || parsed.musicData;
      if (!root) return null;

      const musicData: ImportMusicDto[] = [];
      
      // 提取基本信息
      const songId = parseInt(root.name?.[0]?.id?.[0] || '0');
      const title = root.name?.[0]?.str?.[0] || '';
      const artist = root.artistName?.[0]?.str?.[0] || '';
      const genre = root.genreNames?.[0]?.list?.[0]?.StringID?.[0]?.str?.[0] || '';
      const jacketPath = root.jaketFile?.[0]?.path?.[0] || '';
      
      // 提取网络版本，忽略 v2/v3/v1 前缀
      let netversion = root.releaseTagName?.[0]?.str?.[0] || '';
      if (netversion.startsWith('v')) {
        const versionMatch = netversion.match(/^v\d+\s+(.+)$/);
        if (versionMatch) {
          netversion = versionMatch[1];
        }
      }

      // 提取难度信息
      const fumens = root.fumens?.[0]?.MusicFumenData || [];
      
      // 检查是否是 World's End 专用歌曲（music8000开头）
      const isWorldsEndOnly = songId >= 8000 && fumens.some((fumen: any) => {
        const typeId = parseInt(fumen.type?.[0]?.id?.[0] || '0');
        return typeId === 5 && fumen.enable?.[0] === 'true';
      });

      if (isWorldsEndOnly) {
        // 只处理 World's End 难度
        const worldsEndFumen = fumens.find((fumen: any) => {
          const typeId = parseInt(fumen.type?.[0]?.id?.[0] || '0');
          return typeId === 5 && fumen.enable?.[0] === 'true';
        });

        if (worldsEndFumen) {
          const level = parseFloat(worldsEndFumen.level?.[0] || '0');
          const levelDecimal = parseInt(worldsEndFumen.levelDecimal?.[0] || '0');
          const finalLevel = level + (levelDecimal / 100);
          
          // 提取 World's End 标签
          const worldsEndTag = root.worldsEndTagName?.[0]?.str?.[0] || null;

          musicData.push({
            songId,
            chartId: 5,
            title,
            artist,
            level: finalLevel,
            genre,
            jacketPath,
            worldsEndTag,
            netversion,
          });
        }
      } else {
        // 处理普通难度（type 0-4）
        fumens.forEach((fumen: any) => {
          const typeId = parseInt(fumen.type?.[0]?.id?.[0] || '0');
          const isEnabled = fumen.enable?.[0] === 'true';
          
          // 只处理启用的难度，且不是 World's End (type 5)
          if (isEnabled && typeId !== 5) {
            const level = parseFloat(fumen.level?.[0] || '0');
            const levelDecimal = parseInt(fumen.levelDecimal?.[0] || '0');
            const finalLevel = level + (levelDecimal / 100);

            musicData.push({
              songId,
              chartId: typeId,
              title,
              artist,
              level: finalLevel,
              genre,
              jacketPath,
              worldsEndTag: null, // 非 World's End 难度设为 null
              netversion,
            });
          }
        });
      }

      return musicData.length > 0 ? musicData : null;
    } catch (error) {
      this.logger.error('提取音乐数据失败', error);
      return null;
    }
  }

  /**
   * 获取对应类型的 XML 文件名
   */
  private getXmlFileName(type: string): string {
    const fileNameMap = {
      avatarAccessory: 'AvatarAccessory',
      mapIcon: 'MapIcon',
      namePlate: 'NamePlate',
      systemVoice: 'SystemVoice',
      trophy: 'Trophy',
      music: 'Music',
    };
    return fileNameMap[type] || type;
  }

  /**
   * 批量导入头像配饰
   */
  async batchImportAvatarAccessory(batchData: BatchImportAvatarAccessoryDto): Promise<ImportResultDto> {
    this.logger.log(`批量导入头像配饰，数量: ${batchData.data.length}`);
    
    let success = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of batchData.data) {
      try {
        await this.avatarAccessoryRepository
          .createQueryBuilder()
          .insert()
          .into(ChuniAvatarAccessory)
          .values({
            id: item.id,
            name: item.name,
            sortName: item.sortName,
            category: item.category,
            imagePath: item.imagePath,
          })
          .orUpdate(['name', 'sortName', 'category', 'imagePath'], ['id'])
          .execute();
        
        success++;
      } catch (error) {
        this.logger.error(`导入头像配饰失败 ID: ${item.id}`, error);
        errors.push(`导入头像配饰失败 ID: ${item.id} - ${error.message}`);
        failed++;
      }
    }

    return {
      success,
      failed,
      skipped,
      total: batchData.data.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 批量导入地图图标
   */
  async batchImportMapIcon(batchData: BatchImportMapIconDto): Promise<ImportResultDto> {
    this.logger.log(`批量导入地图图标，数量: ${batchData.data.length}`);
    
    let success = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of batchData.data) {
      try {
        await this.mapIconRepository
          .createQueryBuilder()
          .insert()
          .into(ChuniMapIcon)
          .values({
            id: item.id,
            name: item.name,
            sortName: item.sortName,
            imagePath: item.imagePath,
          })
          .orUpdate(['name', 'sortName', 'imagePath'], ['id'])
          .execute();
        
        success++;
      } catch (error) {
        this.logger.error(`导入地图图标失败 ID: ${item.id}`, error);
        errors.push(`导入地图图标失败 ID: ${item.id} - ${error.message}`);
        failed++;
      }
    }

    return {
      success,
      failed,
      skipped,
      total: batchData.data.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 批量导入姓名板
   */
  async batchImportNamePlate(batchData: BatchImportNamePlateDto): Promise<ImportResultDto> {
    this.logger.log(`批量导入姓名板，数量: ${batchData.data.length}`);
    
    let success = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of batchData.data) {
      try {
        await this.namePlateRepository
          .createQueryBuilder()
          .insert()
          .into(ChuniNamePlate)
          .values({
            id: item.id,
            name: item.name,
            sortName: item.sortName,
            imagePath: item.imagePath,
          })
          .orUpdate(['name', 'sortName', 'imagePath'], ['id'])
          .execute();
        
        success++;
      } catch (error) {
        this.logger.error(`导入姓名板失败 ID: ${item.id}`, error);
        errors.push(`导入姓名板失败 ID: ${item.id} - ${error.message}`);
        failed++;
      }
    }

    return {
      success,
      failed,
      skipped,
      total: batchData.data.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 批量导入系统语音
   */
  async batchImportSystemVoice(batchData: BatchImportSystemVoiceDto): Promise<ImportResultDto> {
    this.logger.log(`批量导入系统语音，数量: ${batchData.data.length}`);
    
    let success = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of batchData.data) {
      try {
        await this.systemVoiceRepository
          .createQueryBuilder()
          .insert()
          .into(ChuniSystemVoice)
          .values({
            id: item.id,
            name: item.name,
            sortName: item.sortName,
            imagePath: item.imagePath,
            cuePath: item.cuePath,
          })
          .orUpdate(['name', 'sortName', 'imagePath', 'cuePath'], ['id'])
          .execute();
        
        success++;
      } catch (error) {
        this.logger.error(`导入系统语音失败 ID: ${item.id}`, error);
        errors.push(`导入系统语音失败 ID: ${item.id} - ${error.message}`);
        failed++;
      }
    }

    return {
      success,
      failed,
      skipped,
      total: batchData.data.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 批量导入奖杯
   */
  async batchImportTrophies(batchData: BatchImportTrophiesDto): Promise<ImportResultDto> {
    this.logger.log(`批量导入称号，数量: ${batchData.data.length}`);
    
    let success = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of batchData.data) {
      try {
        await this.trophiesRepository
          .createQueryBuilder()
          .insert()
          .into(ChuniTrophies)
          .values({
            id: item.id,
            name: item.name,
            rareType: item.rareType,
            explainText: item.explainText,
          })
          .orUpdate(['name', 'rareType', 'explainText'], ['id'])
          .execute();
        
        success++;
      } catch (error) {
        this.logger.error(`导入称号失败 ID: ${item.id}`, error);
        errors.push(`导入称号失败 ID: ${item.id} - ${error.message}`);
        failed++;
      }
    }

    return {
      success,
      failed,
      skipped,
      total: batchData.data.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 批量导入音乐数据
   */
  async batchImportMusic(batchData: BatchImportMusicDto, version: number): Promise<ImportResultDto> {
    this.logger.log(`批量导入音乐数据，数量: ${batchData.data.length}`);
    
    let success = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of batchData.data) {
      try {
        await this.musicRepository
          .createQueryBuilder()
          .insert()
          .into(ChuniStaticMusic)
          .values({
            version: version,
            songId: item.songId,
            chartId: item.chartId,
            title: item.title,
            artist: item.artist,
            level: item.level,
            genre: item.genre,
            jacketPath: item.jacketPath,
            worldsEndTag: item.worldsEndTag,
            netversion: item.netversion,
          })
          .orUpdate([
            'title',
            'artist',
            'level',
            'genre',
            'jacketPath',
            'worldsEndTag',
            'netversion'
          ], ['version', 'songId', 'chartId'])
          .execute();
        
        success++;
      } catch (error) {
        this.logger.error(`导入音乐数据失败 songId: ${item.songId}, chartId: ${item.chartId}`, error);
        errors.push(`导入音乐数据失败 songId: ${item.songId}, chartId: ${item.chartId} - ${error.message}`);
        failed++;
      }
    }

    return {
      success,
      failed,
      skipped,
      total: batchData.data.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 获取导入统计信息
   */
  async getImportStats(): Promise<any> {
    const [avatarAccessoryCount, mapIconCount, namePlateCount, systemVoiceCount, trophiesCount, musicCount] = await Promise.all([
      this.avatarAccessoryRepository.count(),
      this.mapIconRepository.count(),
      this.namePlateRepository.count(),
      this.systemVoiceRepository.count(),
      this.trophiesRepository.count(),
      this.musicRepository.count(),
    ]);

    return {
      avatarAccessory: avatarAccessoryCount,
      mapIcon: mapIconCount,
      namePlate: namePlateCount,
      systemVoice: systemVoiceCount,
      trophies: trophiesCount,
      music: musicCount,
      total: avatarAccessoryCount + mapIconCount + namePlateCount + systemVoiceCount + trophiesCount + musicCount,
    };
  }

  /**
   * 获取指定类型的数据
   */
  async getDataList(
    type: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ data: any[]; total: number }> {
    const skip = (page - 1) * pageSize;
    
    let repository: Repository<any>;
    
    // 映射类型到对应的仓库
    const typeMap = {
      'avatar-accessory': this.avatarAccessoryRepository,
      'map-icon': this.mapIconRepository,
      'name-plate': this.namePlateRepository,
      'system-voice': this.systemVoiceRepository,
      'trophies': this.trophiesRepository,
      'music': this.musicRepository,
    };
    
    repository = typeMap[type];
    
    if (!repository) {
      throw new BadRequestException(`不支持的数据类型: ${type}`);
    }
    
    const [data, total] = await repository.findAndCount({
      skip,
      take: pageSize,
      order: { id: 'ASC' },
    });
    
    return { data, total };
  }

  /**
   * 清空指定类型的数据
   */
  async clearData(type: 'avatarAccessory' | 'mapIcon' | 'namePlate' | 'systemVoice' | 'trophies' | 'music'): Promise<void> {
    this.logger.log(`清空数据类型: ${type}`);
    
    try {
      switch (type) {
        case 'avatarAccessory':
          await this.avatarAccessoryRepository.clear();
          break;
        case 'mapIcon':
          await this.mapIconRepository.clear();
          break;
        case 'namePlate':
          await this.namePlateRepository.clear();
          break;
        case 'systemVoice':
          await this.systemVoiceRepository.clear();
          break;
        case 'trophies':
          await this.trophiesRepository.clear();
          break;
        case 'music':
          await this.musicRepository.clear();
          break;
        default:
          throw new BadRequestException(`不支持的数据类型: ${type}`);
      }
    } catch (error) {
      this.logger.error(`清空数据失败: ${type}`, error);
      throw new InternalServerErrorException(`清空数据失败: ${type}`);
    }
  }
}