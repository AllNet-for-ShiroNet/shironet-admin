// src/api/upload.ts

// 上传统计接口
export interface UploadStats {
  avatarAccessory: number
  mapIcon: number
  namePlate: number
  systemVoice: number
  trophies: number
  music: number
  total: number
}

// 上传响应接口
export interface UploadResponse {
  success: boolean
  message: string
  data: XmlParseResultDto
}

// XML 解析结果接口
export interface XmlParseResultDto {
  data: any[]
  fileCount: number
  dataCount: number
  errors?: string[]
}

// 导入结果接口
export interface ImportResultDto {
  success: number
  failed: number
  skipped: number
  total: number
  errors?: string[]
}

// 批量导入响应接口
export interface BatchImportResponse {
  success: boolean
  message: string
  data: ImportResultDto
}

// 批量导入音乐数据接口
export interface BatchImportMusicDto {
  version: number
  data: any[]
}

// 文件预览接口
export interface FilePreview {
  name: string
  size: number
  type: string
  path?: string
}

// 压缩包预览接口
export interface ZipPreview {
  files: FilePreview[]
  totalCount: number
  totalSize: number
  detectedType?: UploadType
  hasValidFiles: boolean
  detectedTypes?: UploadType[]
}

// 数据列表响应接口
export interface DataListResponse {
  success: boolean
  message: string
  data: any[]
  total: number
}

// 上传类型定义 - 与后端路由完全匹配
export type UploadType = 
  | 'avatar-accessory'
  | 'map-icon'
  | 'name-plate'
  | 'system-voice'
  | 'trophies'
  | 'music'

// 内部类型映射（对应后端service中的type参数）
const INTERNAL_TYPE_MAP: Record<UploadType, string> = {
  'avatar-accessory': 'avatarAccessory',
  'map-icon': 'mapIcon',
  'name-plate': 'namePlate',
  'system-voice': 'systemVoice',
  'trophies': 'trophy',  // 后端service使用 'trophy'
  'music': 'music'
}

// 清理数据类型映射（对应后端controller参数）
const CLEAR_TYPE_MAP: Record<UploadType, string> = {
  'avatar-accessory': 'avatarAccessory',
  'map-icon': 'mapIcon',
  'name-plate': 'namePlate',
  'system-voice': 'systemVoice',
  'trophies': 'trophies',  // 后端controller中的参数
  'music': 'music'
}

// 上传类型中文映射
export const UPLOAD_TYPE_LABELS: Record<UploadType, string> = {
  'avatar-accessory': '企鹅装扮',
  'map-icon': '地图图标',
  'name-plate': '姓名板',
  'system-voice': '系统语音',
  'trophies': '称号',
  'music': '谱面信息'
}

// 支持的文件类型
export const SUPPORTED_FILE_TYPES: Record<UploadType, string[]> = {
  'avatar-accessory': ['.xml', '.zip'],
  'map-icon': ['.xml', '.zip'],
  'name-plate': ['.xml', '.zip'],
  'system-voice': ['.xml', '.zip'],
  'trophies': ['.xml', '.zip'],
  'music': ['.xml', '.zip', '.c2s']
}

// 检测文件类型的文件名模式
const TYPE_DETECTION_PATTERNS: Record<string, UploadType> = {
  'AvatarAccessory': 'avatar-accessory',
  'MapIcon': 'map-icon', 
  'NamePlate': 'name-plate',
  'SystemVoice': 'system-voice',
  'Trophy': 'trophies',
  'Music': 'music'
}

// XML 文件内容检测模式
const XML_CONTENT_PATTERNS: Record<string, UploadType> = {
  'AvatarAccessoryData': 'avatar-accessory',
  'avatarAccessoryData': 'avatar-accessory',
  'MapIcon': 'map-icon',
  'mapIcon': 'map-icon',
  'NamePlate': 'name-plate', 
  'namePlate': 'name-plate',
  'SystemVoice': 'system-voice',
  'systemVoice': 'system-voice',
  'Trophy': 'trophies',
  'trophy': 'trophies',
  'MusicData': 'music',
  'musicData': 'music'
}

class UploadApi {
  private baseUrl = '/api/upload'

  // 单文件/多文件上传 XML 数据
  async uploadFiles(type: UploadType, files: File[]): Promise<UploadResponse> {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    const response = await fetch(`${this.baseUrl}/${type}`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `上传失败: ${response.statusText}`)
    }
    
    return await response.json()
  }

  // 批量导入解析后的数据
  async batchImport(type: UploadType, data: any[], version?: number): Promise<BatchImportResponse> {
    let requestBody: any
    
    if (type === 'music' && version !== undefined) {
      // 音乐数据需要包含版本号
      requestBody = { version, data }
    } else {
      requestBody = { data }
    }
    
    const response = await fetch(`${this.baseUrl}/batch/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `批量导入失败: ${response.statusText}`)
    }
    
    return await response.json()
  }

  // 获取上传统计
  async getUploadStats(): Promise<UploadStats> {
    const response = await fetch(`${this.baseUrl}/stats`)
    
    if (!response.ok) {
      throw new Error(`获取统计失败: ${response.statusText}`)
    }
    
    const result = await response.json()
    return result.data
  }

  // 获取数据列表
  async getDataList(type: UploadType, page: number = 1, pageSize: number = 20): Promise<{
    data: any[]
    total: number
  }> {
    const response = await fetch(`${this.baseUrl}/${type}/list?page=${page}&pageSize=${pageSize}`)
    
    if (!response.ok) {
      throw new Error(`获取数据列表失败: ${response.statusText}`)
    }
    
    const result = await response.json()
    return {
      data: result.data,
      total: result.total
    }
  }

  // 清理指定类型的数据
  async clearData(type: UploadType): Promise<{ success: boolean; message: string }> {
    const clearType = CLEAR_TYPE_MAP[type]
    const response = await fetch(`${this.baseUrl}/clear/${clearType}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error(`清理数据失败: ${response.statusText}`)
    }
    
    return await response.json()
  }

  // 预览压缩包内容
  async previewZipFile(file: File): Promise<ZipPreview> {
    // 使用 JSZip 库来解析压缩包
    const JSZip = await import('jszip')
    const zip = new JSZip.default()
    
    try {
      const zipData = await zip.loadAsync(file)
      const files: FilePreview[] = []
      const detectedTypes = new Set<UploadType>()
      
      // 遍历压缩包中的文件
      const promises: Promise<void>[] = []
      
      zipData.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && relativePath.endsWith('.xml')) {
          const fileExtension = '.' + relativePath.split('.').pop()?.toLowerCase()
          
          // 特殊处理音乐文件路径 - 检测 music/music{id}/Music.xml 格式
          if (relativePath.match(/music\/music\d+\/Music\.xml$/i)) {
            detectedTypes.add('music')
          } else {
            // 通过文件路径检测（适用于带路径的文件）
            const pathParts = relativePath.split('/')
            for (const part of pathParts) {
              const lowerPart = part.toLowerCase()
              // 检查文件夹名
              if (lowerPart === 'avataraccessory') {
                detectedTypes.add('avatar-accessory')
                break
              } else if (lowerPart === 'mapicon') {
                detectedTypes.add('map-icon')
                break
              } else if (lowerPart === 'nameplate') {
                detectedTypes.add('name-plate')
                break
              } else if (lowerPart === 'systemvoice') {
                detectedTypes.add('system-voice')
                break
              } else if (lowerPart === 'trophy') {
                detectedTypes.add('trophies')
                break
              } else if (lowerPart === 'music' && !relativePath.match(/music\/music\d+\/Music\.xml$/i)) {
                detectedTypes.add('music')
                break
              }
            }
            
            // 通过文件名检测类型
            for (const [pattern, type] of Object.entries(TYPE_DETECTION_PATTERNS)) {
              if (relativePath.includes(pattern)) {
                detectedTypes.add(type)
                break
              }
            }
          }
          
          // 使用 async 方法获取文件信息
          const promise = zipEntry.async('uint8array').then((content) => {
            files.push({
              name: relativePath,
              size: content.length,
              type: fileExtension,
              path: relativePath
            })
          }).catch((error) => {
            console.warn(`无法读取文件 ${relativePath}:`, error)
          })
          
          promises.push(promise)
        }
      })
      
      // 等待所有文件处理完成
      await Promise.all(promises)
      
      // 计算统计信息
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      const hasValidFiles = files.length > 0
      const detectedTypesArray = Array.from(detectedTypes)
      
      return {
        files,
        totalCount: files.length,
        totalSize,
        detectedType: detectedTypesArray.length === 1 ? detectedTypesArray[0] : undefined,
        hasValidFiles,
        detectedTypes: detectedTypesArray
      }
    } catch (error) {
      throw new Error('无法解析压缩包文件')
    }
  }

  // 检测是否为有效的游戏数据压缩包（A000格式）
  isValidGameDataZip(filename: string): boolean {
    // 检查是否符合 A000-A999 的命名模式
    const gameDataPattern = /^A\d{3}\.zip$/i
    return gameDataPattern.test(filename)
  }

  // 自动检测文件类型
  async detectFileType(file: File): Promise<UploadType | null> {
    const fileName = file.name.toLowerCase()
    
    // 特殊检测音乐文件 - Music.xml 格式
    if (fileName === 'music.xml' || fileName.endsWith('/music.xml')) {
      return 'music'
    }
    
    // 先通过文件名检测
    for (const [pattern, type] of Object.entries(TYPE_DETECTION_PATTERNS)) {
      if (fileName.includes(pattern.toLowerCase())) {
        return type
      }
    }
    
    // 通过文件路径检测（适用于带路径的文件）
    const pathParts = fileName.split('/')
    for (const part of pathParts) {
      const lowerPart = part.toLowerCase()
      if (lowerPart === 'avataraccessory') return 'avatar-accessory'
      if (lowerPart === 'mapicon') return 'map-icon'
      if (lowerPart === 'nameplate') return 'name-plate'
      if (lowerPart === 'systemvoice') return 'system-voice'
      if (lowerPart === 'trophy') return 'trophies'
      if (lowerPart === 'music') return 'music'
    }
    
    // 如果是 XML 文件，通过内容检测
    if (fileName.endsWith('.xml')) {
      try {
        const content = await file.text()
        for (const [pattern, type] of Object.entries(XML_CONTENT_PATTERNS)) {
          if (content.includes(pattern)) {
            return type
          }
        }
      } catch (error) {
        console.warn('无法读取文件内容进行类型检测:', error)
      }
    }
    
    return null
  }

  // 批量检测文件类型
  async detectFilesType(files: File[]): Promise<{ 
    detectedType: UploadType | null
    fileTypeMap: Map<File, UploadType | null>
    conflictingTypes: UploadType[]
  }> {
    const fileTypeMap = new Map<File, UploadType | null>()
    const detectedTypes = new Set<UploadType>()
    
    for (const file of files) {
      const type = await this.detectFileType(file)
      fileTypeMap.set(file, type)
      if (type) {
        detectedTypes.add(type)
      }
    }
    
    const typesArray = Array.from(detectedTypes)
    
    return {
      detectedType: typesArray.length === 1 ? typesArray[0] : null,
      fileTypeMap,
      conflictingTypes: typesArray.length > 1 ? typesArray : []
    }
  }
}

// 数据转换工具
export const uploadDataTransform = {
  // 格式化文件大小
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // 格式化日期
  formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  },

  // 获取文件类型图标
  getFileTypeIcon(fileType: string): string {
    const iconMap: Record<string, string> = {
      '.xml': 'code',
      '.zip': 'archive',
      '.c2s': 'music_note',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image'
    }
    return iconMap[fileType.toLowerCase()] || 'description'
  },

  // 验证文件类型
  validateFileType(file: File, uploadType: UploadType | string): boolean {
    const fileName = file.name.toLowerCase()
    const supportedTypes = SUPPORTED_FILE_TYPES[uploadType as UploadType]
    if (!supportedTypes) return false
    return supportedTypes.some(type => fileName.endsWith(type))
  },

  // 获取上传类型的图标
  getUploadTypeIcon(type: UploadType): string {
    const iconMap: Record<UploadType, string> = {
      'avatar-accessory': 'face',
      'map-icon': 'map',
      'name-plate': 'badge',
      'system-voice': 'record_voice_over',
      'trophies': 'emoji_events',
      'music': 'library_music'
    }
    return iconMap[type]
  },

  // 统计数据转换为显示格式
  transformStatsForDisplay(stats: UploadStats): Array<{
    type: UploadType
    count: number
    totalSize: number
    lastUpload: string
  }> {
    return [
      {
        type: 'avatar-accessory',
        count: stats.avatarAccessory,
        totalSize: 0,
        lastUpload: ''
      },
      {
        type: 'map-icon',
        count: stats.mapIcon,
        totalSize: 0,
        lastUpload: ''
      },
      {
        type: 'name-plate',
        count: stats.namePlate,
        totalSize: 0,
        lastUpload: ''
      },
      {
        type: 'system-voice',
        count: stats.systemVoice,
        totalSize: 0,
        lastUpload: ''
      },
      {
        type: 'trophies',
        count: stats.trophies,
        totalSize: 0,
        lastUpload: ''
      },
      {
        type: 'music',
        count: stats.music,
        totalSize: 0,
        lastUpload: ''
      }
    ]
  }
}

// 文件验证器
export const fileValidator = {
  // 验证文件大小
  validateFileSize(file: File, maxSizeMB: number = 300): { valid: boolean; error?: string } {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `文件大小不能超过 ${maxSizeMB}MB`
      }
    }
    return { valid: true }
  },

  // 验证文件类型
  validateFileType(file: File, uploadType: UploadType | string): { valid: boolean; error?: string } {
    if (!uploadDataTransform.validateFileType(file, uploadType)) {
      const supportedTypes = SUPPORTED_FILE_TYPES[uploadType as UploadType]
      if (!supportedTypes) {
        return {
          valid: false,
          error: '无效的上传类型'
        }
      }
      const supportedTypesStr = supportedTypes.join(', ')
      return {
        valid: false,
        error: `不支持的文件类型，支持的类型: ${supportedTypesStr}`
      }
    }
    return { valid: true }
  },

  // 验证文件名
  validateFileName(fileName: string): { valid: boolean; error?: string } {
    // 检查文件名是否包含非法字符
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(fileName)) {
      return {
        valid: false,
        error: '文件名包含非法字符'
      }
    }
    
    // 检查文件名长度
    if (fileName.length > 255) {
      return {
        valid: false,
        error: '文件名过长'
      }
    }
    
    return { valid: true }
  },

  // 验证是否为游戏数据压缩包
  validateGameDataZip(fileName: string): { valid: boolean; error?: string } {
    if (!uploadApi.isValidGameDataZip(fileName)) {
      return {
        valid: false,
        error: '压缩包文件名应符合 A000-A999 格式（如: A000.zip, A001.zip）'
      }
    }
    return { valid: true }
  }
}

export const uploadApi = new UploadApi()