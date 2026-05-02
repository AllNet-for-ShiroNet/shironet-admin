// src/api/download.ts
import http from '@/utils/http'

export type DownloadType = 'chunithm' | 'ongeki'

export const DOWNLOAD_TYPE_LABELS: Record<DownloadType, string> = {
  'chunithm': 'Chunithm 数据',
  'ongeki': 'Ongeki 数据'
}

export const DOWNLOAD_TYPE_COLORS: Record<DownloadType, { bg: string; hover: string; text: string }> = {
  'chunithm': { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', text: 'text-blue-600' },
  'ongeki': { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', text: 'text-purple-600' }
}

export interface FileInfo {
  key: string
  name: string
  size: number
  lastModified: string
  exists: boolean
}

class DownloadApi {
  async listFiles(prefix: string): Promise<FileInfo[]> {
    const response = await http.get(`/download/list?prefix=${encodeURIComponent(prefix)}`)
    return response.data.data
  }

  /**
   * @param helperTab 须在用户点击时同步执行 `window.open('about:blank')` 传入。
   * 异步请求后再 `window.open(真实url)` 会被浏览器当作非用户手势拦截，表现为「啥也不干」。
   */
  async downloadFile(key: string, helperTab: Window | null): Promise<void> {
    const response = await http.post(
      `/download/token?key=${encodeURIComponent(key)}`,
    )
    const raw = response.data as { url?: string; data?: { url?: string } }
    const url =
      (typeof raw?.url === 'string' && raw.url) ||
      (typeof raw?.data?.url === 'string' && raw.data.url) ||
      undefined
    if (!url) {
      throw new Error('服务器未返回下载地址')
    }
    if (helperTab) {
      helperTab.location.href = url
    } else {
      window.location.href = url
    }
  }
}

export const downloadDataTransform = {
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  formatDate(dateStr: string): string {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }
}

export const downloadApi = new DownloadApi()
