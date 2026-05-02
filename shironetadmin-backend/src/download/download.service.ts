import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { R2StorageService } from '../storage/r2-storage.service';
import { R2_OPTSTOR } from '../storage/r2-storage.tokens';

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

  constructor(@Inject(R2_OPTSTOR) private readonly r2Storage: R2StorageService) {}

  async listFiles(prefix: string): Promise<FileInfo[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.r2Storage.bucket,
      Prefix: prefix,
    });
    const response = await this.r2Storage.getClient().send(command);
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
      const command = new HeadObjectCommand({
        Bucket: this.r2Storage.bucket,
        Key: key,
      });
      const response = await this.r2Storage.getClient().send(command);
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

  async getPresignedUrlForObjectKey(key: string): Promise<string> {
    this.logger.log(`Generating presigned URL for: ${key}`);
    const basename = key.split('/').pop() ?? 'download';
    const safeName = basename.replace(/["\\]/g, '_');
    const command = new GetObjectCommand({
      Bucket: this.r2Storage.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${safeName}"`,
    });
    // 这里30就好别动
    return getSignedUrl(this.r2Storage.getClient(), command, { expiresIn: 30 });
  }
}
