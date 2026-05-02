import { Logger } from '@nestjs/common';
import { execa } from 'execa';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath = require('ffmpeg-static') as string | null;

const logger = new Logger('DdsWebp');

/** WebP 质量 0–100，与原先 sharp quality 约 92 对齐 */
const WEBP_QUALITY = 92;

/**
 * 使用 ffmpeg（ffmpeg-static 自带二进制）将 DDS 转为 WebP。
 * 依赖 FFmpeg 内置的 DDS 解码，通常比纯 JS DXT 管线支持更多格式（含部分 DX10/BC）。
 */
export async function convertDdsBufferToWebp(buffer: Buffer): Promise<Buffer | null> {
  if (!ffmpegPath) {
    logger.warn('DDS 转 WebP: ffmpeg-static 未解析到可执行文件路径');
    return null;
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dds-webp-'));
  const inPath = path.join(tmpDir, 'in.dds');
  const outPath = path.join(tmpDir, 'out.webp');

  try {
    await fs.writeFile(inPath, buffer);

    await execa(ffmpegPath, [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      inPath,
      '-frames:v',
      '1',
      '-c:v',
      'libwebp',
      '-quality',
      String(WEBP_QUALITY),
      outPath,
    ], { maxBuffer: 32 * 1024 * 1024 });

    const webp = await fs.readFile(outPath);
    if (!webp.length) {
      logger.warn('DDS 转 WebP（ffmpeg）: 输出文件为空');
      return null;
    }
    return webp;
  } catch (err: unknown) {
    let msg = err instanceof Error ? err.message : String(err);
    const anyErr = err as { stderr?: string | Buffer };
    if (anyErr.stderr !== undefined && String(anyErr.stderr).trim()) {
      msg += ` | ${String(anyErr.stderr).trim()}`;
    }
    logger.warn(`DDS 转 WebP（ffmpeg）失败: ${msg}`);
    return null;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
