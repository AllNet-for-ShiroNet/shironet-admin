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

  async downloadFile(key: string): Promise<void> {
    await http.post(`/download/token?key=${encodeURIComponent(key)}`)

    const a = document.createElement('a')
    a.href = `/api/download/file`
    a.download = key.split('/').pop() ?? 'download'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
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
