import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import type { R2StorEnvKeys } from './r2-storage.env-keys';

export type R2StorageInstanceLabel = 'opt-stor' | 'static-stor';

/**
 * 一套 Endpoint + 桶 + AK/SK 对应一个 S3 兼容客户端。{@link StorageModule} 注册 opt / static 两个实例。
 */
export class R2StorageService {
  private readonly logger: Logger;
  private readonly client: S3Client;
  readonly bucket: string;
  private readonly enabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly envKeys: R2StorEnvKeys,
    label: R2StorageInstanceLabel,
  ) {
    this.logger = new Logger(`R2Storage:${label}`);
    this.bucket = this.configService.get<string>(envKeys.bucket, '') ?? '';
    const endpoint = this.configService.get<string>(envKeys.endpoint, '') ?? '';
    const accessKeyId =
      this.configService.get<string>(envKeys.accessKeyId, '') ?? '';
    const secretAccessKey =
      this.configService.get<string>(envKeys.secretAccessKey, '') ?? '';
    this.enabled = Boolean(
      this.bucket && endpoint && accessKeyId && secretAccessKey,
    );
    this.client = new S3Client({
      region: 'auto',
      endpoint: endpoint || 'https://invalid.example',
      credentials: {
        accessKeyId: accessKeyId || 'invalid',
        secretAccessKey: secretAccessKey || 'invalid',
      },
    });
    if (!this.enabled) {
      const k = Object.values(envKeys).join(' / ');
      this.logger.warn(`R2 未完整配置（需同时具备: ${k}），该实例将跳过`);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getClient(): S3Client {
    return this.client;
  }

  async headObject(key: string): Promise<{ contentLength: number } | null> {
    if (!this.enabled) return null;
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.client.send(command);
      return { contentLength: response.ContentLength ?? 0 };
    } catch {
      return null;
    }
  }

  /**
   * @returns uploaded | skipped（远端已有同尺寸） | failed
   */
  async putObject(params: {
    key: string;
    body: Buffer;
    contentType?: string;
    skipIfSameSize?: boolean;
  }): Promise<'uploaded' | 'skipped' | 'failed'> {
    if (!this.enabled) {
      return 'failed';
    }
    const { key, body, contentType, skipIfSameSize = true } = params;
    try {
      if (skipIfSameSize && body.length > 0) {
        const existing = await this.headObject(key);
        if (
          existing !== null &&
          existing.contentLength === body.length
        ) {
          return 'skipped';
        }
      }
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType ?? 'application/octet-stream',
        }),
      );
      return 'uploaded';
    } catch (error) {
      this.logger.warn(`PutObject 失败 key=${key}`, error);
      return 'failed';
    }
  }
}
