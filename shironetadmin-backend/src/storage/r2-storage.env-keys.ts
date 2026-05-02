export interface R2StorEnvKeys {
  readonly bucket: string;
  readonly endpoint: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}

/** 旧业务下载用 R2 / S3 连接参数对应的 .env 键名 */
export const R2_OPTSTOR_ENV_KEYS = {
  bucket: 'R2_OPTSTOR_BUCKET',
  endpoint: 'R2_OPTSTOR_ENDPOINT',
  accessKeyId: 'R2_OPTSTOR_ACCESS_KEY_ID',
  secretAccessKey: 'R2_OPTSTOR_SECRET_ACCESS_KEY',
} as const satisfies R2StorEnvKeys;

/** ZIP 上传写入用 R2 / S3 连接参数对应的 .env 键名 */
export const R2_STATICSTOR_ENV_KEYS = {
  bucket: 'R2_STATICSTOR_BUCKET',
  endpoint: 'R2_STATICSTOR_ENDPOINT',
  accessKeyId: 'R2_STATICSTOR_ACCESS_KEY_ID',
  secretAccessKey: 'R2_STATICSTOR_SECRET_ACCESS_KEY',
} as const satisfies R2StorEnvKeys;
