// src/api/announcement.ts
import http from '@/utils/http'

// 类型定义（与前端保持一致）
export interface Announcement {
  id: number
  title: string
  content: string
  type: 'system' | 'maintenance' | 'event' | 'update'
  isPinned: boolean
  createTime: string
  publishTime: string | null
  expireTime: string | null
  status: 'published' | 'draft' | 'expired'
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface AnnouncementForm {
  title: string
  content: string
  type: string
  isPinned: boolean
  publishTime: Date | null
  expireTime: Date | null
}

export interface CreateAnnouncementRequest {
  title: string
  content: string
  type: string
  isPinned?: boolean
  publishTime?: string
  expireTime?: string
}

export interface UpdateAnnouncementRequest {
  title?: string
  content?: string
  type?: string
  isPinned?: boolean
  publishTime?: string
  expireTime?: string
  status?: string
}

export interface QueryAnnouncementParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  type?: string
  isPinned?: boolean
  createdBy?: number
}

export interface AnnouncementListResponse {
  announcements: Announcement[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface BatchOperationRequest {
  ids: number[]
}

export interface BatchOperationResponse {
  published?: number
  deleted?: number
  failed?: number
}

export interface AnnouncementStats {
  total: number
  published: number
  draft: number
  expired: number
  pinned: number
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// API 调用函数
export const announcementApi = {
  // 获取公告列表
  async getAnnouncements(params: QueryAnnouncementParams = {}): Promise<AnnouncementListResponse> {
    try {
      const cleanParams = {
        page: params.page || 1,
        limit: params.limit || 10,
        ...(params.search && { search: params.search }),
        ...(params.status && { status: params.status }),
        ...(params.type && { type: params.type }),
        ...(params.isPinned !== undefined && { isPinned: params.isPinned }),
        ...(params.createdBy && { createdBy: params.createdBy }),
      }
      
      const response = await http.get('/announcements', { params: cleanParams })
      
      // 处理不同的后端响应格式
      const data = response.data
      
      if (data && typeof data === 'object') {
        // 格式1: { success: true, data: { announcements: [], total: number } }
        if (data.success && data.data && 'announcements' in data.data) {
          return {
            announcements: data.data.announcements.map((item: any) => dataTransform.backendToFrontend(item)) || [],
            total: data.data.total || 0,
            page: data.data.page || params.page || 1,
            limit: data.data.limit || params.limit || 10,
            totalPages: data.data.totalPages || Math.ceil((data.data.total || 0) / (params.limit || 10)),
          }
        }
        // 格式2: { announcements: [], total: number }
        else if ('announcements' in data) {
          return {
            announcements: data.announcements.map((item: any) => dataTransform.backendToFrontend(item)) || [],
            total: data.total || 0,
            page: params.page || 1,
            limit: params.limit || 10,
            totalPages: Math.ceil((data.total || 0) / (params.limit || 10)),
          }
        }
        // 格式3: 直接返回数组
        else if (Array.isArray(data)) {
          return {
            announcements: data.map((item: any) => dataTransform.backendToFrontend(item)),
            total: data.length,
            page: 1,
            limit: data.length,
            totalPages: 1,
          }
        }
        // 其他格式的兜底处理
        else {
          const announcements = data.data?.announcements || data.result?.announcements || []
          const total = data.data?.total || data.result?.total || 0
          
          return {
            announcements: Array.isArray(announcements) 
              ? announcements.map((item: any) => dataTransform.backendToFrontend(item)) 
              : [],
            total: typeof total === 'number' ? total : 0,
            page: params.page || 1,
            limit: params.limit || 10,
            totalPages: Math.ceil(total / (params.limit || 10)),
          }
        }
      } else {
        return {
          announcements: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        }
      }
    } catch (error: any) {
      console.error('获取公告列表失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取公告列表失败')
    }
  },

  // 创建公告
  async createAnnouncement(announcementData: CreateAnnouncementRequest): Promise<Announcement> {
    try {
      const requestData = dataTransform.formToCreateRequest(announcementData)
      const response = await http.post<ApiResponse<any>>('/announcements', requestData)
      
      if (response.data.success && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      throw new Error(response.data.message || '创建公告失败')
    } catch (error: any) {
      console.error('创建公告失败:', error)
      throw new Error(error.response?.data?.message || error.message || '创建公告失败')
    }
  },

  // 更新公告
  async updateAnnouncement(id: number, announcementData: UpdateAnnouncementRequest): Promise<Announcement> {
    try {
      const requestData = dataTransform.formToUpdateRequest(announcementData)
      const response = await http.patch<ApiResponse<any>>(`/announcements/${id}`, requestData)
      
      if (response.data.success && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      throw new Error(response.data.message || '更新公告失败')
    } catch (error: any) {
      console.error('更新公告失败:', error)
      throw new Error(error.response?.data?.message || error.message || '更新公告失败')
    }
  },

  // 删除公告
  async deleteAnnouncement(id: number): Promise<void> {
    try {
      const response = await http.delete<ApiResponse<void>>(`/announcements/${id}`)
      if (response.data && !response.data.success) {
        throw new Error(response.data.message || '删除公告失败')
      }
    } catch (error: any) {
      console.error('删除公告失败:', error)
      throw new Error(error.response?.data?.message || error.message || '删除公告失败')
    }
  },

  // 发布公告
  async publishAnnouncement(id: number): Promise<Announcement> {
    try {
      const response = await http.post<ApiResponse<any>>(`/announcements/${id}/publish`)
      
      if (response.data.success && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      throw new Error(response.data.message || '发布公告失败')
    } catch (error: any) {
      console.error('发布公告失败:', error)
      throw new Error(error.response?.data?.message || error.message || '发布公告失败')
    }
  },

  // 批量发布公告
  async batchPublishAnnouncements(ids: number[]): Promise<BatchOperationResponse> {
    try {
      const response = await http.post<ApiResponse<BatchOperationResponse>>('/announcements/batch/publish', { ids })
      
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.message || '批量发布失败')
    } catch (error: any) {
      console.error('批量发布失败:', error)
      throw new Error(error.response?.data?.message || error.message || '批量发布失败')
    }
  },

  // 批量删除公告
  async batchDeleteAnnouncements(ids: number[]): Promise<BatchOperationResponse> {
    try {
      const response = await http.delete<ApiResponse<BatchOperationResponse>>('/announcements/batch', {
        data: { ids }
      })
      
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.message || '批量删除失败')
    } catch (error: any) {
      console.error('批量删除失败:', error)
      throw new Error(error.response?.data?.message || error.message || '批量删除失败')
    }
  },

  // 切换置顶状态
  async togglePinAnnouncement(id: number): Promise<Announcement> {
    try {
      const response = await http.post<ApiResponse<any>>(`/announcements/${id}/toggle-pin`)
      
      if (response.data.success && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      throw new Error(response.data.message || '切换置顶状态失败')
    } catch (error: any) {
      console.error('切换置顶状态失败:', error)
      throw new Error(error.response?.data?.message || error.message || '切换置顶状态失败')
    }
  },

  // 获取单个公告
  async getAnnouncementById(id: number): Promise<Announcement> {
    try {
      const response = await http.get<ApiResponse<any>>(`/announcements/${id}`)
      
      if (response.data.success && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      throw new Error(response.data.message || '获取公告失败')
    } catch (error: any) {
      console.error('获取公告失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取公告失败')
    }
  },

  // 获取统计信息
  async getAnnouncementStats(): Promise<AnnouncementStats> {
    try {
      const response = await http.get<ApiResponse<AnnouncementStats>>('/announcements/stats')
      
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.message || '获取统计信息失败')
    } catch (error: any) {
      console.error('获取统计信息失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取统计信息失败')
    }
  },

  // 复制公告
  async duplicateAnnouncement(id: number): Promise<Announcement> {
    try {
      const response = await http.post<ApiResponse<any>>(`/announcements/${id}/duplicate`)
      
      if (response.data.success && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      throw new Error(response.data.message || '复制公告失败')
    } catch (error: any) {
      console.error('复制公告失败:', error)
      throw new Error(error.response?.data?.message || error.message || '复制公告失败')
    }
  },

  // 获取活跃公告（公开API）
  async getActiveAnnouncements(limit: number = 10): Promise<Announcement[]> {
    try {
      const response = await http.get<ApiResponse<any[]>>('/announcements/active', {
        params: { limit }
      })
      
      if (response.data.success && response.data.data) {
        return response.data.data.map(item => dataTransform.backendToFrontend(item))
      }
      throw new Error(response.data.message || '获取活跃公告失败')
    } catch (error: any) {
      console.error('获取活跃公告失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取活跃公告失败')
    }
  }
}

// 数据转换工具函数
export const dataTransform = {
  // 后端数据转前端数据
  backendToFrontend(backendData: any): Announcement {
    return {
      id: backendData.id,
      title: backendData.title,
      content: backendData.content,
      type: backendData.type,
      isPinned: backendData.isPinned ?? backendData.is_pinned ?? false,
      createTime: backendData.createTime || backendData.create_time,
      publishTime: backendData.publishTime || backendData.publish_time,
      expireTime: backendData.expireTime || backendData.expire_time,
      status: backendData.status,
      createdBy: backendData.createdBy || backendData.created_by,
      createdAt: backendData.createdAt || backendData.created_at,
      updatedAt: backendData.updatedAt || backendData.updated_at,
    }
  },

  // 前端数据转后端数据
  frontendToBackend(frontendData: any): any {
    const result: any = {}
    
    if (frontendData.id !== undefined) result.id = frontendData.id
    if (frontendData.title !== undefined) result.title = frontendData.title
    if (frontendData.content !== undefined) result.content = frontendData.content
    if (frontendData.type !== undefined) result.type = frontendData.type
    if (frontendData.isPinned !== undefined) result.isPinned = frontendData.isPinned
    if (frontendData.publishTime !== undefined) result.publishTime = frontendData.publishTime
    if (frontendData.expireTime !== undefined) result.expireTime = frontendData.expireTime
    if (frontendData.status !== undefined) result.status = frontendData.status
    
    return result
  },

  // 表单数据转创建请求
  formToCreateRequest(formData: AnnouncementForm | CreateAnnouncementRequest): CreateAnnouncementRequest {
    return {
      title: formData.title,
      content: formData.content,
      type: formData.type,
      isPinned: formData.isPinned || false,
      publishTime: formData.publishTime ? new Date(formData.publishTime).toISOString() : undefined,
      expireTime: formData.expireTime ? new Date(formData.expireTime).toISOString() : undefined,
    }
  },

  // 表单数据转更新请求
  formToUpdateRequest(formData: Partial<AnnouncementForm> | UpdateAnnouncementRequest): UpdateAnnouncementRequest {
    const result: UpdateAnnouncementRequest = {}
    
    if (formData.title !== undefined) result.title = formData.title
    if (formData.content !== undefined) result.content = formData.content
    if (formData.type !== undefined) result.type = formData.type
    if (formData.isPinned !== undefined) result.isPinned = formData.isPinned
    if (formData.publishTime !== undefined) {
      result.publishTime = formData.publishTime ? new Date(formData.publishTime).toISOString() : undefined
    }
    if (formData.expireTime !== undefined) {
      result.expireTime = formData.expireTime ? new Date(formData.expireTime).toISOString() : undefined
    }
    
    return result
  },

  // 公告数据转表单数据
  announcementToFormData(announcement: Announcement): AnnouncementForm {
    return {
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      isPinned: announcement.isPinned,
      publishTime: announcement.publishTime ? new Date(announcement.publishTime) : null,
      expireTime: announcement.expireTime ? new Date(announcement.expireTime) : null,
    }
  },

  // 格式化日期显示
  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/')
  },

  // 格式化日期时间显示
  formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  },

  // 获取类型颜色
  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      system: 'primary',
      maintenance: 'warning',
      event: 'success',
      update: 'info'
    }
    return colors[type] || 'primary'
  },

  // 获取类型标签
  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      system: '系统',
      maintenance: '维护',
      event: '活动',
      update: '更新'
    }
    return labels[type] || type
  },

  // 获取状态颜色
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      published: 'success',
      draft: 'info',
      expired: 'danger'
    }
    return colors[status] || 'info'
  },

  // 获取状态标签
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      published: '已发布',
      draft: '草稿',
      expired: '已过期'
    }
    return labels[status] || status
  },

  // 检查是否过期
  isExpired(expireTime: string | null): boolean {
    if (!expireTime) return false
    return new Date(expireTime) < new Date()
  }
}

// 公告验证工具函数
export const announcementValidator = {
  // 验证公告标题
  validateTitle(title: string): boolean {
    return title && title.trim().length > 0 && title.length <= 100
  },

  // 验证公告内容
  validateContent(content: string): boolean {
    return content && content.trim().length > 0 && content.length <= 2000
  },

  // 验证公告类型
  validateType(type: string): boolean {
    const validTypes = ['system', 'maintenance', 'event', 'update']
    return validTypes.includes(type)
  },

  // 验证时间范围
  validateTimeRange(publishTime: Date | null, expireTime: Date | null): boolean {
    if (!publishTime || !expireTime) return true
    return publishTime < expireTime
  },

  // 验证创建表单数据
  validateCreateForm(formData: AnnouncementForm): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.validateTitle(formData.title)) {
      errors.push('标题长度必须在1-100个字符之间')
    }

    if (!this.validateContent(formData.content)) {
      errors.push('内容长度必须在1-2000个字符之间')
    }

    if (!this.validateType(formData.type)) {
      errors.push('请选择有效的公告类型')
    }

    if (!this.validateTimeRange(formData.publishTime, formData.expireTime)) {
      errors.push('发布时间不能晚于过期时间')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export default announcementApi