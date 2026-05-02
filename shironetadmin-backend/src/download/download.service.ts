// src/download/download.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface FileInfo {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  exists: boolean;
}

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.bucket = this.configService.get<string>('R2_BUCKET', '');
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: this.configService.get<string>('R2_ENDPOINT', ''),
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  async listFiles(prefix: string): Promise<FileInfo[]> {
    const command = new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix });
    const response = await this.s3.send(command);
    return (response.Contents ?? [])
      .filter((obj) => obj.Key && !obj.Key.endsWith('/'))
      .map((obj) => ({
        key: obj.Key!,
        name: obj.Key!.replace(prefix, '').replace(/^\//, ''),
        size: obj.Size ?? 0,
        lastModified: obj.LastModified?.toISOString() ?? '',
        exists: true,
      }));
  }

  async getFileInfo(key: string): Promise<FileInfo> {
    try {
      const command = new HeadObjectCommand({ Bucket: this.bucket, Key: key });
      const response = await this.s3.send(command);
      return {
        key,
        name: key.split('/').pop() ?? key,
        size: response.ContentLength ?? 0,
        lastModified: response.LastModified?.toISOString() ?? '',
        exists: true,
      };
    } catch {
      return { key, name: key.split('/').pop() ?? key, size: 0, lastModified: '', exists: false };
    }
  }

  // 生成 JWT 下载 token（30 秒有效，自包含 key，无需内存 store）
  issueToken(key: string): string {
    const token = this.jwtService.sign(
      { key, purpose: 'download' },
      { expiresIn: '30s' },
    );
    this.logger.log(`Download token issued for key: ${key}`);
    return token;
  }

  // 验证 token 并返回 30 秒有效的预签名 URL（浏览器直接从 R2 下载，不经过服务器）
  async getPresignedUrl(token: string): Promise<string> {
    let payload: { key: string; purpose: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('下载 token 无效或已过期');
    }

    if (payload.purpose !== 'download') {
      throw new UnauthorizedException('无效的 token 类型');
    }

    this.logger.log(`Generating presigned URL for: ${payload.key}`);
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: payload.key });
    // 预签名 URL 30 秒有效，窗口极短
    return getSignedUrl(this.s3, command, { expiresIn: 30 });
  }
}
