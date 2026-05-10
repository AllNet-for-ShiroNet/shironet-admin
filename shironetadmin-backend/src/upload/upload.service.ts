import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { ChuniStaticCharacter } from '../chuni/entities/chuni-static-character.entity';
import { ShironetCharacter } from '../auth/entities/shironet-character.entity';
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
  ImportCharacterDto,
  ImportChuniStaticCharacterDto,
  BatchImportCharacterDto,
  XmlParseResultDto,
  ImportResultDto,
} from './dto/upload.dto';
import { R2StorageService } from '../storage/r2-storage.service';
import { R2_STATICSTOR } from '../storage/r2-storage.tokens';
import { convertDdsBufferToWebp } from './dds-webp.util';

const ZIP_ASSET_EXT = /\.(dds|webp|png|jpg|jpeg|acb|awb)$/i;

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

    @InjectRepository(ChuniStaticCharacter)
    private staticCharacterRepository: Repository<ChuniStaticCharacter>,

    @InjectRepository(ShironetCharacter)
    private shironetCharacterRepository: Repository<ShironetCharacter>,

    private readonly configService: ConfigService,
    @Inject(R2_STATICSTOR) private readonly r2Storage: R2StorageService,
  ) {}

  /**
   * 解析上传的 XML 文件或 ZIP 压缩包
   */
  async parseUploadedFiles(
    files: Express.Multer.File[],
    type: 'avatarAccessory' | 'mapIcon' | 'namePlate' | 'systemVoice' | 'trophy' | 'music' | 'character' | 'characterTexture'
  ): Promise<XmlParseResultDto> {
    this.logger.log(`解析上传文件，类型: ${type}, 文件数量: ${files.length}`);

    let allData: any[] = [];
    let fileCount = 0;
    let errors: string[] = [];
    const uploadedAssets: { key: string; sourceZipPath: string }[] = [];
    const uploadErrors: string[] = [];

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
          if (zipData.uploadedAssets?.length) {
            uploadedAssets.push(...zipData.uploadedAssets);
          }
          if (zipData.uploadErrors?.length) {
            uploadErrors.push(...zipData.uploadErrors);
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
      uploadedAssets: uploadedAssets.length > 0 ? uploadedAssets : undefined,
      uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined,
    };
  }

  private zipLeafDir(zipEntryPath: string): string {
    const norm = zipEntryPath.replace(/\\/g, '/');
    const idx = norm.lastIndexOf('/');
    return idx >= 0 ? norm.slice(0, idx + 1) : '';
  }

  /** 统一 ZIP 内路径：反斜杠转正斜杠、去掉开头 ./ 与多余 /，避免 Windows 打的包匹配失败 */
  private normalizeZipEntryPath(zipEntryPath: string): string {
    return zipEntryPath
      .replace(/\\/g, '/')
      .replace(/^\.\/+/, '')
      .replace(/^\/+/, '');
  }

  private basenameZip(zipEntryPath: string): string {
    const norm = zipEntryPath.replace(/\\/g, '/');
    const idx = norm.lastIndexOf('/');
    return idx >= 0 ? norm.slice(idx + 1) : norm;
  }

  private guessAssetContentType(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.dds')) return 'image/vnd.ms.dds';
    return 'application/octet-stream';
  }

  /** 与桶内实测及 CDN 路径约定一致：name-plate 在桶根；其余在 R2_KEY_PREFIX_GAME_TREE/{category}/ */
  private buildR2ObjectKey(
    uploadType: 'avatarAccessory' | 'mapIcon' | 'namePlate' | 'systemVoice' | 'trophy' | 'music' | 'characterTexture' | 'character',
    fileBasename: string,
  ): string {
    const platePrefix = (
      this.configService.get<string>('R2_KEY_PREFIX_NAMEPLATE') ?? 'name-plate'
    ).replace(/^\/+|\/+$/g, '');
    const gameTree = (
      this.configService.get<string>('R2_KEY_PREFIX_GAME_TREE') ?? 'chuni/chuni'
    ).replace(/^\/+|\/+$/g, '');
    const characterPrefix = (
      this.configService.get<string>('R2_KEY_PREFIX_CHARACTER') ?? 'chuni/character'
    ).replace(/^\/+|\/+$/g, '');

    const categoryByType: Record<string, string> = {
      avatarAccessory: 'avatar',
      mapIcon: 'map-icon',
      namePlate: 'name-plate',
      systemVoice: 'system-voice-icon',
      trophy: 'trophy',
      music: 'jacket',
    };

    if (uploadType === 'namePlate') {
      return `${platePrefix}/${fileBasename}`;
    }
    if (uploadType === 'characterTexture' || uploadType === 'character') {
      return `${characterPrefix}/${fileBasename}`;
    }
    const cat = categoryByType[uploadType] ?? 'misc';
    return `${gameTree}/${cat}/${fileBasename}`;
  }

  /** 将已成功转为 WebP 上传的条目同步回解析数据中的路径字段，便于批量导入与 CDN 扩展名一致 */
  private rewriteParsedAssetPathsFromWebpUploads(
    parsedData: any[],
    uploaded: { key: string; sourceZipPath: string }[],
  ): void {
    for (const item of uploaded) {
      if (!item.sourceZipPath.toLowerCase().endsWith('.dds')) continue;
      if (!item.key.toLowerCase().endsWith('.webp')) continue;
      const srcBase = this.basenameZip(item.sourceZipPath);
      const destBase = this.basenameZip(item.key);
      for (const row of parsedData) {
        for (const field of ['imagePath', 'cuePath', 'jacketPath', 'ddsFile0Path', 'ddsFile1Path', 'ddsFile2Path', 'imagePath1', 'imagePath2', 'imagePath3'] as const) {
          const v = row[field];
          if (v == null || v === '') continue;
          if (this.basenameZip(String(v)) === srcBase) {
            row[field] = destBase;
          }
        }
      }
    }
  }

  private async syncZipAssetsToR2(
    zipContent: JSZip,
    uploadType: 'avatarAccessory' | 'mapIcon' | 'namePlate' | 'systemVoice' | 'trophy' | 'music' | 'characterTexture' | 'character',
    leafPrefixes: Set<string>,
    parsedData: any[],
  ): Promise<{ uploaded: { key: string; sourceZipPath: string }[]; uploadErrors: string[] }> {
    const uploaded: { key: string; sourceZipPath: string }[] = [];
    const uploadErrors: string[] = [];

    if (!this.r2Storage.isEnabled()) {
      uploadErrors.push(
        'R2 静态资源未配置（需 R2_STATICSTOR_*：BUCKET / ENDPOINT / ACCESS_KEY_ID / SECRET_ACCESS_KEY），跳过资源上传',
      );
      return { uploaded, uploadErrors };
    }

    const referencedBasenames = new Set<string>();
    if (uploadType === 'music') {
      for (const row of parsedData) {
        if (row?.jacketPath) {
          referencedBasenames.add(this.basenameZip(String(row.jacketPath)));
        }
      }
    } else if (uploadType === 'characterTexture') {
      for (const row of parsedData) {
        for (const key of ['ddsFile0Path', 'ddsFile1Path', 'ddsFile2Path'] as const) {
          if (row?.[key]) {
            referencedBasenames.add(this.basenameZip(String(row[key])));
          }
        }
      }
    } else if (uploadType === 'character') {
      for (const row of parsedData) {
        for (const key of ['imagePath1', 'imagePath2', 'imagePath3'] as const) {
          if (row?.[key]) {
            referencedBasenames.add(this.basenameZip(String(row[key])));
          }
        }
      }
    } else {
      for (const row of parsedData) {
        if (row?.imagePath) {
          referencedBasenames.add(this.basenameZip(String(row.imagePath)));
        }
        if (row?.cuePath) {
          referencedBasenames.add(this.basenameZip(String(row.cuePath)));
        }
      }
    }

    const processedZipPaths = new Set<string>();

    for (const [zipPath, entry] of Object.entries(zipContent.files)) {
      if (entry.dir) continue;
      const norm = zipPath.replace(/\\/g, '/');
      if (norm.endsWith('.xml')) continue;
      if (!ZIP_ASSET_EXT.test(norm)) continue;

      const base = this.basenameZip(norm);

      let match = false;
      for (const prefix of leafPrefixes) {
        if (prefix && norm.startsWith(prefix)) {
          match = true;
          break;
        }
      }
      if (!match && referencedBasenames.size > 0) {
        if (referencedBasenames.has(base)) {
          match = true;
        }
      }
      if (!match) continue;
      if (processedZipPaths.has(norm)) continue;
      processedZipPaths.add(norm);

      try {
        let uploadBody = await entry.async('nodebuffer');
        let objectBasename = base;

        const convertDds =
          this.configService.get<string>('R2_DDS_CONVERT_WEBP') !== 'false';
        if (convertDds && base.toLowerCase().endsWith('.dds')) {
          const webpBuf = await convertDdsBufferToWebp(uploadBody);
          if (webpBuf) {
            uploadBody = webpBuf;
            objectBasename = base.replace(/\.dds$/i, '.webp');
          } else {
            this.logger.warn(`DDS 转 WebP 失败，改为上传原始 DDS: ${norm}`);
          }
        }

        const key = this.buildR2ObjectKey(uploadType, objectBasename);
        const result = await this.r2Storage.putObject({
          key,
          body: uploadBody,
          contentType: this.guessAssetContentType(objectBasename),
          skipIfSameSize: true,
        });
        if (result === 'failed') {
          uploadErrors.push(`上传失败: ${norm} -> ${key}`);
        } else {
          uploaded.push({ key, sourceZipPath: norm });
        }
      } catch (e) {
        uploadErrors.push(`读取 ZIP 资源失败 ${norm}: ${(e as Error).message}`);
      }
    }

    return { uploaded, uploadErrors };
  }

  /**
   * 解析 ZIP 文件（解析 XML 后将同叶子目录下的贴图等资源同步至 R2）
   */
  private async parseZipFile(
    buffer: Buffer,
    type: 'avatarAccessory' | 'mapIcon' | 'namePlate' | 'systemVoice' | 'trophy' | 'music' | 'character' | 'characterTexture',
  ): Promise<{
    data: any[];
    fileCount: number;
    errors?: string[];
    uploadedAssets?: { key: string; sourceZipPath: string }[];
    uploadErrors?: string[];
  }> {
    const zipLoader = new JSZip();
    const zipContent = await zipLoader.loadAsync(buffer);

    const leafPrefixes = new Set<string>();
    let data: any[] = [];
    let fileCount = 0;
    const errors: string[] = [];

    if (type === 'music') {
      for (const [filenameRaw, file] of Object.entries(zipContent.files)) {
        if (file.dir) continue;
        const filename = this.normalizeZipEntryPath(filenameRaw);
        if (!/music\/music\d+\/Music\.xml$/i.test(filename)) continue;
        try {
          const xmlBuffer = await file.async('nodebuffer');
          const xmlDataArray = await this.parseXmlFile(xmlBuffer, filename, type);
          if (xmlDataArray && Array.isArray(xmlDataArray)) {
            data.push(...xmlDataArray);
            fileCount += 1;
            leafPrefixes.add(this.zipLeafDir(filename));
          }
        } catch (error) {
          this.logger.error(`解析 ZIP 中的 Music.xml 文件失败: ${filename}`, error);
          errors.push(`解析 ZIP 中的 Music.xml 文件失败: ${filename} - ${error.message}`);
        }
      }
    } else if (type === 'characterTexture') {
      const parseZipXmlRow = async (
        filename: string,
        file: JSZip.JSZipObject,
      ) => {
        try {
          const xmlBuffer = await file.async('nodebuffer');
          const xmlData = await this.parseXmlFile(xmlBuffer, filename, type);
          if (xmlData) {
            data.push(xmlData);
            fileCount += 1;
            leafPrefixes.add(this.zipLeafDir(filename));
          }
        } catch (error) {
          this.logger.error(`解析 ZIP 所需的 XML 文件失败: ${filename}`, error);
          errors.push(
            `解析 ZIP 所需的 XML 文件失败: ${filename} - ${error.message}`,
          );
        }
      };

      for (const [filenameRaw, file] of Object.entries(zipContent.files)) {
        if (file.dir) continue;
        const filename = this.normalizeZipEntryPath(filenameRaw);
        if (!/\.xml$/i.test(filename)) continue;
        const lower = filename.toLowerCase();
        const ddsDeep =
          /^A\d{3}\/ddsImage\/[^/]+\/DDSImage\.xml$/i.test(filename);
        const ddsFlat = /^A\d{3}\/DDSImage\.xml$/i.test(filename);
        const ddsLoose =
          lower.includes('ddsimage/') && lower.endsWith('/ddsimage.xml');
        if (ddsDeep || ddsFlat || ddsLoose) {
          await parseZipXmlRow(filename, file);
        }
      }
    } else if (type === 'character') {
      const parseZipXmlRow = async (
        filename: string,
        file: JSZip.JSZipObject,
      ) => {
        try {
          const xmlBuffer = await file.async('nodebuffer');
          const xmlData = await this.parseXmlFile(xmlBuffer, filename, type);
          if (xmlData) {
            data.push(xmlData);
            fileCount += 1;
            leafPrefixes.add(this.zipLeafDir(filename));
          }
        } catch (error) {
          this.logger.error(`解析 ZIP 所需的 XML 文件失败: ${filename}`, error);
          errors.push(
            `解析 ZIP 所需的 XML 文件失败: ${filename} - ${error.message}`,
          );
        }
      };

      for (const [filenameRaw, file] of Object.entries(zipContent.files)) {
        if (file.dir) continue;
        const filename = this.normalizeZipEntryPath(filenameRaw);
        if (!/\.xml$/i.test(filename)) continue;
        const lower = filename.toLowerCase();
        const charaDeep =
          /^A\d{3}\/chara\/[^/]+\/Chara\.xml$/i.test(filename);
        const charaLoose =
          lower.includes('chara/') && lower.endsWith('/chara.xml');
        if (charaDeep || charaLoose) {
          await parseZipXmlRow(filename, file);
        }
      }
    } else {
      const folderMapping: Record<string, string> = {
        avatarAccessory: 'avatarAccessory',
        mapIcon: 'mapIcon',
        namePlate: 'namePlate',
        systemVoice: 'systemVoice',
        trophy: 'trophy',
      };

      const targetFolder = folderMapping[type];
      const targetFileName = this.getTargetFileName(type);
      const deepPattern = new RegExp(
        `^A\\d{3}/${targetFolder}/[^/]+/${targetFileName}\\.xml$`,
        'i',
      );
      const versionFlatPattern = new RegExp(
        `^A\\d{3}/${targetFileName}\\.xml$`,
        `i`,
      );

      for (const [filenameRaw, file] of Object.entries(zipContent.files)) {
        if (file.dir) continue;
        const filename = this.normalizeZipEntryPath(filenameRaw);
        if (!/\.xml$/i.test(filename)) continue;

        const lower = filename.toLowerCase();
        const tfLower = targetFolder.toLowerCase();
        const leafLower = targetFileName.toLowerCase();
        const looseSubdirMatch =
          lower.includes(`${tfLower}/`) && lower.endsWith(`/${leafLower}.xml`);

        if (
          deepPattern.test(filename) ||
          versionFlatPattern.test(filename) ||
          looseSubdirMatch
        ) {
          try {
            const xmlBuffer = await file.async('nodebuffer');
            const xmlData = await this.parseXmlFile(xmlBuffer, filename, type);
            if (xmlData) {
              data.push(xmlData);
              fileCount += 1;
              leafPrefixes.add(this.zipLeafDir(filename));
            }
          } catch (error) {
            this.logger.error(`解析 ZIP 所需的 XML 文件失败: ${filename}`, error);
            errors.push(`解析 ZIP 所需的 XML 文件失败: ${filename} - ${error.message}`);
          }
        }
      }
    }

    if (data.length === 0) {
      const xmlPaths = Object.keys(zipContent.files).filter(
        (p) =>
          !zipContent.files[p].dir &&
          p.replace(/\\/g, '/').toLowerCase().endsWith('.xml'),
      );
      const samples = xmlPaths.slice(0, 8).map((p) => p.replace(/\\/g, '/')).join(' | ') || '（包内无 .xml）';
      if (type === 'music') {
        this.logger.warn(
          `ZIP 解析 [music] 得到 0 条：需匹配路径 music/music数字/Music.xml。包内 XML 共 ${xmlPaths.length} 个；示例: ${samples}`,
        );
      } else if (type === 'characterTexture') {
        this.logger.warn(
          `ZIP 解析 [characterTexture] 得到 0 条：需 A123/ddsImage/.../DDSImage.xml（或宽松路径含 ddsImage 且文件名 DDSImage.xml）。包内 XML 共 ${xmlPaths.length} 个；示例: ${samples}`,
        );
      } else if (type === 'character') {
        this.logger.warn(
          `ZIP 解析 [character] 得到 0 条：需 A123/chara/.../Chara.xml（路径含 chara 且文件名 Chara.xml）。包内 XML 共 ${xmlPaths.length} 个；示例: ${samples}`,
        );
      } else {
        const folderMapping: Record<string, string> = {
          avatarAccessory: 'avatarAccessory',
          mapIcon: 'mapIcon',
          namePlate: 'namePlate',
          systemVoice: 'systemVoice',
          trophy: 'trophy',
        };
        const folder = folderMapping[type];
        const leafFile = this.getTargetFileName(type);
        this.logger.warn(
          `ZIP 解析 [${type}] 得到 0 条：可为 (1) A123/${folder}/子目录/${leafFile}.xml (2) A123/${leafFile}.xml (3) 仅一层目录 ${folder}/${leafFile}.xml；路径需使用 /。包内 XML 共 ${xmlPaths.length} 个；示例: ${samples}`,
        );
      }
    }

    let uploadedAssets: { key: string; sourceZipPath: string }[] | undefined;
    let uploadErrorsOut: string[] | undefined;

    if (leafPrefixes.size > 0 || data.length > 0) {
      const sync = await this.syncZipAssetsToR2(
        zipContent,
        type,
        leafPrefixes,
        data,
      );
      if (sync.uploaded.length > 0) {
        uploadedAssets = sync.uploaded;
        this.rewriteParsedAssetPathsFromWebpUploads(data, sync.uploaded);
      }
      if (sync.uploadErrors.length > 0) {
        uploadErrorsOut = sync.uploadErrors;
      }
    }

    return {
      data,
      fileCount,
      errors: errors.length > 0 ? errors : undefined,
      uploadedAssets,
      uploadErrors: uploadErrorsOut,
    };
  }

  /**
   * 获取目标文件名
   */
  private getTargetFileName(type: string): string {
    const fileNameMapping = {
      'avatarAccessory': 'AvatarAccessory',
      'characterTexture': 'DDSImage',
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
        case 'character':
          result = this.extractCharaStaticCharacterData(parsed);
          break;
        case 'characterTexture':
          result = this.extractCharacterData(parsed);
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
      const possibleRoots = [
        'AvatarAccessoryData',
        'avatarAccessoryData',
        'AvatarAccessory',
        'avatarAccessory',
      ];
      
      for (const rootName of possibleRoots) {
        if (parsed[rootName]) {
          root = parsed[rootName];
          break;
        }
      }

      const id = this.extractValue(root, ['name', 'id'], 'number') || 0;
      const name = this.extractValue(root, ['name', 'str'], 'string') || '';
      const sortName =
        this.extractValue(root, ['sortName'], 'string') ||
        this.extractValue(root, ['dataName'], 'string') ||
        name;
      const category = this.extractValue(root, ['category'], 'number') || 0;
      const imagePath =
        this.extractValue(root, ['image', 'path'], 'string') ||
        this.extractValue(root, ['ddsFile0', 'path'], 'string') ||
        '';

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
   * 提取人物贴图数据（DDSImage）
   */
  private extractCharacterData(parsed: any): ImportCharacterDto | null {
    try {
      const root = parsed.DDSImageData || parsed.ddsImageData;
      if (!root) return null;

      const id = this.extractValue(root, ['name', 'id'], 'number') || 0;
      const name = this.extractValue(root, ['name', 'str'], 'string') || '';
      const dataName = this.extractValue(root, ['dataName'], 'string') || '';
      const ddsFile0Path = this.extractValue(root, ['ddsFile0', 'path'], 'string') || '';
      const ddsFile1Path = this.extractValue(root, ['ddsFile1', 'path'], 'string') || '';
      const ddsFile2Path = this.extractValue(root, ['ddsFile2', 'path'], 'string') || '';
      const netOpenId = this.extractValue(root, ['netOpenName', 'id'], 'number') || 0;
      const netOpenName = this.extractValue(root, ['netOpenName', 'str'], 'string') || '';

      if (!ddsFile0Path) {
        return null;
      }

      this.logger.debug('人物贴图数据提取结果:', {
        id,
        name,
        dataName,
        ddsFile0Path,
        ddsFile1Path,
        ddsFile2Path,
        netOpenId,
        netOpenName,
      });

      return {
        id,
        name,
        dataName,
        ddsFile0Path,
        ddsFile1Path,
        ddsFile2Path,
        netOpenId,
        netOpenName,
      };
    } catch (error) {
      this.logger.error('提取人物贴图数据失败', error);
      return null;
    }
  }

  /** Chara.xml 根节点（兼容 xml2js 把根包成单元素数组等情况） */
  private resolveCharaXmlRoot(parsed: any): any | null {
    let root = parsed?.CharaData ?? parsed?.charaData;
    if (!root) {
      return null;
    }
    if (Array.isArray(root) && root.length > 0) {
      root = root[0];
    }
    return root && typeof root === 'object' ? root : null;
  }

  /** 与客户端一致的 UI 立绘 DDS 文件名：CHU_UI_Character_{seg4}_{mid2}_{slot2}.dds（seg4 为已归一化的 0～9999） */
  private buildChuniUiCharacterDdsFilename(
    resolvedSegment: number,
    middle: number,
    slotIndex: number,
  ): string {
    const seg = String(this.modUnsigned(resolvedSegment, 10000)).padStart(4, '0');
    const mid = String(this.modUnsigned(middle, 100)).padStart(2, '0');
    const slot = String(this.modUnsigned(slotIndex, 100)).padStart(2, '0');
    return `CHU_UI_Character_${seg}_${mid}_${slot}.dds`;
  }

  private modUnsigned(n: number, modulus: number): number {
    const t = Math.trunc(Math.abs(n));
    return ((t % modulus) + modulus) % modulus;
  }

  /**
   * defaultImages.str / path 形如 chara5095_00 → 资源首段 5095（与游戏命名一致，而非 50950%10000）
   */
  private parseCharaUiSegmentFromDefaultStr(s: string | null | undefined): number | null {
    if (!s || typeof s !== 'string') {
      return null;
    }
    const m = s.trim().match(/^chara(\d+)_(\d{1,4})(?:\.dds)?$/i);
    if (!m) {
      return null;
    }
    return this.modUnsigned(parseInt(m[1], 10), 10000);
  }

  /**
   * 无 charaXXXX_XX 字符串时的数值推导：50950 → 5095；2398 → 2398
   */
  private segmentFromCharaNumericId(rawId: number): number {
    const id = Math.trunc(Math.abs(rawId));
    if (id <= 0) {
      return 0;
    }
    if (id >= 10000) {
      return this.modUnsigned(Math.floor(id / 10), 10000);
    }
    return this.modUnsigned(id, 10000);
  }

  /** 从 defaultImages.str（如 chara5095_00）解析中间两位所用的序号 */
  private parseCharaCostumeMiddleFromDefaultStr(s: string | null | undefined): number {
    if (!s || typeof s !== 'string') {
      return 0;
    }
    const m = s.trim().match(/_(\d{1,4})(?:\.dds)?$/i);
    return m ? this.modUnsigned(parseInt(m[1], 10), 100) : 0;
  }

  private looksLikeChuniUiCharacterDds(name: string): boolean {
    return /^CHU_UI_Character_\d{4}_\d{2}_\d{2}\.dds$/i.test(name.trim());
  }

  private normalizeChuniUiFilenameFromXml(raw: string): string | null {
    const t = raw.trim();
    return this.looksLikeChuniUiCharacterDds(t) ? t : null;
  }

  private getCharaAddImageBlock(root: any, index: number): any | null {
    const key = `addImages${index}`;
    const blockRaw = root[key];
    const block = Array.isArray(blockRaw) ? blockRaw[0] : blockRaw;
    return block && typeof block === 'object' ? block : null;
  }

  /** addImagesN.image.id，无效（≤0）时返回 null */
  private getCharaAddImageNumericId(root: any, addIndex: number): number | null {
    const block = this.getCharaAddImageBlock(root, addIndex);
    if (!block) {
      return null;
    }
    const id = this.extractValue(block, ['image', 'id'], 'number');
    if (id == null || id <= 0) {
      return null;
    }
    return id;
  }

  /** addImages 里已是 CHU_UI_Character_*.dds 时直接采用 */
  private extractChuniUiFilenameFromAddImageBlock(block: any): string | null {
    if (!block) {
      return null;
    }
    const raw =
      (this.extractValue(block, ['image', 'str'], 'string') || '').trim() ||
      (this.extractValue(block, ['image', 'path'], 'string') || '').trim();
    if (!raw || raw.toLowerCase() === 'invalid') {
      return null;
    }
    return this.normalizeChuniUiFilenameFromXml(raw);
  }

  private extractCharaStaticCharacterData(
    parsed: any,
  ): ImportChuniStaticCharacterDto | null {
    try {
      const root = this.resolveCharaXmlRoot(parsed);
      if (!root) {
        return null;
      }

      const nameIdNum = this.extractValue(root, ['name', 'id'], 'number') || 0;
      const dataName =
        (this.extractValue(root, ['dataName'], 'string') || '').trim();
      const characterId =
        nameIdNum > 0 ? String(nameIdNum) : dataName;
      if (!characterId) {
        return null;
      }

      const version =
        this.extractValue(root, ['releaseTagName', 'id'], 'number') ||
        this.extractValue(root, ['netOpenName', 'id'], 'number') ||
        0;

      const name = this.extractValue(root, ['name', 'str'], 'string') || '';
      const sortName =
        (this.extractValue(root, ['sortName'], 'string') || '').trim() || null;
      const worksName =
        (this.extractValue(root, ['works', 'str'], 'string') || '').trim() ||
        null;

      const rareNum = this.extractValue(root, ['rareType'], 'number');
      const rareStr = this.extractValue(root, ['rareType'], 'string');
      const rareType =
        rareStr !== '' && rareStr != null
          ? String(rareStr).trim()
          : rareNum != null && !Number.isNaN(Number(rareNum))
            ? String(rareNum)
            : null;

      const defaultStr =
        (this.extractValue(root, ['defaultImages', 'str'], 'string') || '').trim() ||
        (this.extractValue(root, ['defaultImages', 'path'], 'string') || '').trim() ||
        '';

      const segmentFromStr = this.parseCharaUiSegmentFromDefaultStr(defaultStr);
      const baseSegRaw =
        this.extractValue(root, ['defaultImages', 'id'], 'number') ||
        nameIdNum ||
        0;

      const middle = this.parseCharaCostumeMiddleFromDefaultStr(defaultStr);

      const explicit1 = defaultStr
        ? this.normalizeChuniUiFilenameFromXml(defaultStr)
        : null;

      const seg0 = segmentFromStr ?? this.segmentFromCharaNumericId(baseSegRaw);

      const id1 = this.getCharaAddImageNumericId(root, 1);
      const id2 = this.getCharaAddImageNumericId(root, 2);
      const segForSlot1 =
        id1 != null ? this.segmentFromCharaNumericId(id1) : seg0;
      const segForSlot2 =
        id2 != null ? this.segmentFromCharaNumericId(id2) : seg0;

      const imagePath1 =
        explicit1 ??
        this.buildChuniUiCharacterDdsFilename(seg0, middle, 0);

      const imagePath2 =
        this.extractChuniUiFilenameFromAddImageBlock(
          this.getCharaAddImageBlock(root, 1),
        ) ??
        this.buildChuniUiCharacterDdsFilename(segForSlot1, middle, 1);

      const imagePath3 =
        this.extractChuniUiFilenameFromAddImageBlock(
          this.getCharaAddImageBlock(root, 2),
        ) ??
        this.buildChuniUiCharacterDdsFilename(segForSlot2, middle, 2);

      const disableRaw = (
        this.extractValue(root, ['disableFlag'], 'string') || ''
      ).trim().toLowerCase();
      const isEnabled =
        disableRaw === 'true' || disableRaw === '1'
          ? false
          : disableRaw === 'false' || disableRaw === '0' || disableRaw === ''
            ? true
            : null;

      const dhRaw = (
        this.extractValue(root, ['defaultHave'], 'string') || ''
      ).trim().toLowerCase();
      let defaultHave: boolean | null = null;
      if (dhRaw === 'true' || dhRaw === '1') {
        defaultHave = true;
      } else if (dhRaw === 'false' || dhRaw === '0') {
        defaultHave = false;
      }

      return {
        characterId,
        version,
        name: name || characterId,
        sortName,
        worksName,
        rareType,
        imagePath1,
        imagePath2,
        imagePath3,
        isEnabled,
        defaultHave,
      };
    } catch (error) {
      this.logger.error('提取 CharaData 静态角色失败', error);
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
   * 批量导入静态角色（Chara.xml → chuni_static_character）
   */
  async batchImportCharacter(batchData: BatchImportCharacterDto): Promise<ImportResultDto> {
    if (!batchData.data?.length) {
      throw new BadRequestException('角色静态导入：data 不能为空');
    }

    let success = 0;
    let failed = 0;
    const skipped = 0;
    const errors: string[] = [];

    for (const item of batchData.data) {
      try {
        await this.staticCharacterRepository
          .createQueryBuilder()
          .insert()
          .into(ChuniStaticCharacter)
          .values({
            characterId: item.characterId,
            version: item.version,
            name: item.name,
            sortName: item.sortName ?? null,
            worksName: item.worksName ?? null,
            rareType: item.rareType ?? null,
            imagePath1: item.imagePath1 ?? null,
            imagePath2: item.imagePath2 ?? null,
            imagePath3: item.imagePath3 ?? null,
            isEnabled: item.isEnabled ?? null,
            defaultHave: item.defaultHave ?? null,
          })
          .orUpdate(
            [
              'version',
              'name',
              'sortName',
              'worksName',
              'rareType',
              'imagePath1',
              'imagePath2',
              'imagePath3',
              'isEnabled',
              'defaultHave',
            ],
            ['characterId'],
          )
          .execute();

        await this.upsertShironetCharacterFromStatic(item);

        success++;
      } catch (error) {
        this.logger.error(
          `导入静态角色失败 characterId: ${item.characterId}`,
          error,
        );
        errors.push(
          `导入静态角色失败 characterId: ${item.characterId} - ${error.message}`,
        );
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
   * aime 库 shironet_characters：按 characterId 幂等同步（与 chuni_static_character 同库）
   */
  private async upsertShironetCharacterFromStatic(
    item: ImportChuniStaticCharacterDto,
  ): Promise<void> {
    const characterId = item.characterId.slice(0, 50);
    const characterName = item.name.slice(0, 100);
    const version = String(item.version ?? '').slice(0, 50);

    const existing = await this.shironetCharacterRepository.findOne({
      where: { characterId },
    });

    if (existing) {
      existing.characterName = characterName;
      existing.version = version;
      await this.shironetCharacterRepository.save(existing);
      return;
    }

    await this.shironetCharacterRepository.save(
      this.shironetCharacterRepository.create({
        characterId,
        characterName,
        version,
      }),
    );
  }

  /**
   * 获取导入统计信息
   */
  async getImportStats(): Promise<any> {
    const [
      avatarAccessoryCount,
      staticCharacterCount,
      mapIconCount,
      namePlateCount,
      systemVoiceCount,
      trophiesCount,
      musicCount,
    ] = await Promise.all([
      this.avatarAccessoryRepository.count(),
      this.staticCharacterRepository.count(),
      this.mapIconRepository.count(),
      this.namePlateRepository.count(),
      this.systemVoiceRepository.count(),
      this.trophiesRepository.count(),
      this.musicRepository.count(),
    ]);

    return {
      avatarAccessory: avatarAccessoryCount,
      character: staticCharacterCount,
      mapIcon: mapIconCount,
      namePlate: namePlateCount,
      systemVoice: systemVoiceCount,
      trophies: trophiesCount,
      music: musicCount,
      total:
        avatarAccessoryCount +
        staticCharacterCount +
        mapIconCount +
        namePlateCount +
        systemVoiceCount +
        trophiesCount +
        musicCount,
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
    
    if (type === 'character-texture') {
      return { data: [], total: 0 };
    }

    let repository: Repository<any>;

    const typeMap = {
      'avatar-accessory': this.avatarAccessoryRepository,
      'character': this.staticCharacterRepository,
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

    const order =
      type === 'character' ? { characterId: 'ASC' as const } : { id: 'ASC' as const };

    const [data, total] = await repository.findAndCount({
      skip,
      take: pageSize,
      order,
    });

    return { data, total };
  }

  /**
   * 清空指定类型的数据
   */
  async clearData(type: 'avatarAccessory' | 'character' | 'characterTexture' | 'mapIcon' | 'namePlate' | 'systemVoice' | 'trophies' | 'music'): Promise<void> {
    this.logger.log(`清空数据类型: ${type}`);
    
    try {
      switch (type) {
        case 'avatarAccessory':
          await this.avatarAccessoryRepository.clear();
          break;
        case 'mapIcon':
          await this.mapIconRepository.clear();
          break;
        case 'characterTexture':
          this.logger.log('人物贴图（DDS）仅同步 R2，无数据库表可清空');
          break;
        case 'character':
          await this.staticCharacterRepository.clear();
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