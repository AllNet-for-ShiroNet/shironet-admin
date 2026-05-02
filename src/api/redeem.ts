// src/api/redeem.ts
import http from '@/utils/http'

// 类型定义
export interface RedemptionCode {
  id: number
  code: string
  itemId: number
  itemKind: number
  amount: number
  isActive: boolean
  maxGlobalUses: number | null
  maxUserUses: number | null
  usedCount: number
  startTime: string | null
  endTime: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateRedemptionCodeRequest {
  code?: string
  itemId: number
  itemKind: number
  amount: number
  max_global_uses?: number
  max_user_uses?: number
  start_time?: string
  end_time?: string
}

export interface UpdateRedemptionCodeRequest {
  code?: string
  itemId?: number
  itemKind?: number
  amount?: number
  max_global_uses?: number
  max_user_uses?: number
  start_time?: string
  end_time?: string
  is_active?: boolean
}

export interface BatchCreateRequest {
  count: number
  length: number
  itemId?: number
  itemKind?: number
  amount?: number
  max_global_uses?: number
  max_user_uses?: number
  start_time?: string
  end_time?: string
}

export interface UseRedemptionCodeRequest {
  code: string
  userId: number
}

export interface RedemptionCodeUsage {
  id: number
  userId: number
  codeId: number
  usedAt: string
  code?: RedemptionCode
  user?: {
    id: number
    username?: string
    nickname?: string
  }
}

export interface SearchRedemptionCodeRequest {
  search?: string
  is_active?: boolean
  itemId?: number
  itemKind?: number
  start_time?: string
  end_time?: string
  hasExpired?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// API 调用函数
export const redeemApi = {
  // 获取所有兑换码
  async getAllRedemptionCodes(): Promise<RedemptionCode[]> {
    try {
      const response = await http.get('/redeem')
      // 根据你提供的实际返回数据格式，直接访问data数组
      if (response.data && response.data.data) {
        return response.data.data.map((item: any) => dataTransform.backendToFrontend(item))
      }
      // 如果没有包装，直接返回数组
      if (Array.isArray(response.data)) {
        return response.data.map((item: any) => dataTransform.backendToFrontend(item))
      }
      throw new Error('获取兑换码列表失败')
    } catch (error: any) {
      console.error('获取兑换码列表失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取兑换码列表失败')
    }
  },

  // 根据ID获取兑换码
  async getRedemptionCodeById(id: number): Promise<RedemptionCode> {
    try {
      const response = await http.get<ApiResponse<any>>(`/redeem/${id}`)
      if (response.data.success && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      throw new Error(response.data.message || '获取兑换码信息失败')
    } catch (error: any) {
      console.error('获取兑换码信息失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取兑换码信息失败')
    }
  },

  // 获取兑换码使用记录
  async getRedemptionCodeUsages(id: number): Promise<RedemptionCodeUsage[]> {
    try {
      const response = await http.get<ApiResponse<RedemptionCodeUsage[]>>(`/redeem/${id}/usages`)
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.message || '获取使用记录失败')
    } catch (error: any) {
      console.error('获取使用记录失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取使用记录失败')
    }
  },

  // 创建新兑换码
  async createRedemptionCode(codeData: CreateRedemptionCodeRequest): Promise<RedemptionCode> {
    try {
      const response = await http.post<ApiResponse<any>>('/redeem', codeData)
      // 处理包装的响应格式 { success: true, data: {...} }
      if (response.data && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      // 处理未包装的响应格式（直接返回数据）
      if (response.data) {
        return dataTransform.backendToFrontend(response.data)
      }
      throw new Error('创建兑换码失败：无效的响应格式')
    } catch (error: any) {
      console.error('创建兑换码失败:', error)
      throw new Error(error.response?.data?.message || error.message || '创建兑换码失败')
    }
  },

  // 批量创建兑换码
  async batchCreateRedemptionCodes(batchData: BatchCreateRequest): Promise<RedemptionCode[]> {
    try {
      const response = await http.post<ApiResponse<any[]>>('/redeem/batch', batchData)
      // 处理包装的响应格式 { success: true, data: [...] }
      if (response.data && response.data.data) {
        return response.data.data.map(item => dataTransform.backendToFrontend(item))
      }
      // 处理未包装的响应格式（直接返回数组）
      if (Array.isArray(response.data)) {
        return response.data.map(item => dataTransform.backendToFrontend(item))
      }
      throw new Error('批量创建兑换码失败：无效的响应格式')
    } catch (error: any) {
      console.error('批量创建兑换码失败:', error)
      throw new Error(error.response?.data?.message || error.message || '批量创建兑换码失败')
    }
  },

  // 更新兑换码信息
  async updateRedemptionCode(id: number, codeData: UpdateRedemptionCodeRequest): Promise<RedemptionCode> {
    try {
      const response = await http.patch<ApiResponse<any>>(`/redeem/${id}`, codeData)
      // 处理包装的响应格式 { success: true, data: {...} }
      if (response.data && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      // 处理未包装的响应格式（直接返回数据）
      if (response.data) {
        return dataTransform.backendToFrontend(response.data)
      }
      throw new Error('更新兑换码失败：无效的响应格式')
    } catch (error: any) {
      console.error('更新兑换码失败:', error)
      throw new Error(error.response?.data?.message || error.message || '更新兑换码失败')
    }
  },

  // 切换兑换码状态
  async toggleRedemptionCodeStatus(id: number): Promise<RedemptionCode> {
    try {
      const response = await http.patch<ApiResponse<any>>(`/redeem/${id}/toggle-status`)
      // 处理包装的响应格式 { success: true, data: {...} }
      if (response.data && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      // 处理未包装的响应格式（直接返回数据）
      if (response.data) {
        return dataTransform.backendToFrontend(response.data)
      }
      throw new Error('切换兑换码状态失败：无效的响应格式')
    } catch (error: any) {
      console.error('切换兑换码状态失败:', error)
      throw new Error(error.response?.data?.message || error.message || '切换兑换码状态失败')
    }
  },

  // 删除兑换码
  async deleteRedemptionCode(id: number): Promise<void> {
    try {
      const response = await http.delete<ApiResponse<void>>(`/redeem/${id}`)
      // 删除操作返回 204 No Content，response.data 可能为空
      // 只要没有抛出错误就认为成功
      if (response.status === 204) {
        return
      }
      // 如果有响应数据，检查 success 字段
      if (response.data && !response.data.success) {
        throw new Error(response.data.message || '删除兑换码失败')
      }
    } catch (error: any) {
      console.error('删除兑换码失败:', error)
      throw new Error(error.response?.data?.message || error.message || '删除兑换码失败')
    }
  },

  // 使用兑换码
  async useRedemptionCode(useData: UseRedemptionCodeRequest): Promise<any> {
    try {
      const response = await http.post<ApiResponse<any>>('/redeem/use', useData)
      // 处理包装的响应格式 { success: true, data: {...} }
      if (response.data && response.data.data) {
        return response.data.data
      }
      // 处理未包装的响应格式（直接返回数据）
      if (response.data) {
        return response.data
      }
      throw new Error('使用兑换码失败：无效的响应格式')
    } catch (error: any) {
      console.error('使用兑换码失败:', error)
      throw new Error(error.response?.data?.message || error.message || '使用兑换码失败')
    }
  },

  // 搜索兑换码
  async searchRedemptionCodes(searchParams: SearchRedemptionCodeRequest): Promise<RedemptionCode[]> {
    try {
      const response = await http.get<ApiResponse<any[]>>('/redeem/search', {
        params: searchParams
      })
      if (response.data.success && response.data.data) {
        return response.data.data.map(item => dataTransform.backendToFrontend(item))
      }
      throw new Error(response.data.message || '搜索兑换码失败')
    } catch (error: any) {
      console.error('搜索兑换码失败:', error)
      throw new Error(error.response?.data?.message || error.message || '搜索兑换码失败')
    }
  },

  // 获取兑换码统计信息
  async getRedemptionCodeStats(): Promise<any> {
    try {
      const response = await http.get<ApiResponse<any>>('/redeem/stats')
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.message || '获取统计信息失败')
    } catch (error: any) {
      console.error('获取统计信息失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取统计信息失败')
    }
  }
}

// 数据转换工具函数
export const dataTransform = {
  backendToFrontend(backendData: any): RedemptionCode {
    return {
      id: backendData.id,
      code: backendData.code,
      itemId: backendData.itemId,
      itemKind: backendData.itemKind,
      amount: backendData.amount,
      isActive: backendData.is_active,
      maxGlobalUses: backendData.max_global_uses,
      maxUserUses: backendData.max_user_uses,
      usedCount: backendData.usedCount,
      startTime: backendData.start_time,
      endTime: backendData.end_time,
      createdAt: backendData.created_at,
      updatedAt: backendData.updated_at
    }
  },

  frontendToBackend(frontendData: any): any {
    return {
      id: frontendData.id,
      code: frontendData.code,
      itemId: frontendData.itemId,
      itemKind: frontendData.itemKind,
      amount: frontendData.amount,
      is_active: frontendData.isActive,
      max_global_uses: frontendData.maxGlobalUses,
      max_user_uses: frontendData.maxUserUses,
      usedCount: frontendData.usedCount,
      start_time: frontendData.startTime,
      end_time: frontendData.endTime,
      created_at: frontendData.createdAt,
      updated_at: frontendData.updatedAt
    }
  },
  formToCreateRequest(formData: any): CreateRedemptionCodeRequest {
    return {
      code: formData.code || undefined,
      itemId: formData.itemId,
      itemKind: formData.itemKind,
      amount: formData.amount,
      max_global_uses: formData.maxGlobalUses || undefined,
      max_user_uses: formData.maxUserUses || undefined,
      start_time: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
      end_time: formData.endTime ? new Date(formData.endTime).toISOString() : undefined
    }
  },

  formToUpdateRequest(formData: any): UpdateRedemptionCodeRequest {
    return {
      code: formData.code || undefined,
      itemId: formData.itemId,
      itemKind: formData.itemKind,
      amount: formData.amount,
      max_global_uses: formData.maxGlobalUses || undefined,
      max_user_uses: formData.maxUserUses || undefined,
      start_time: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
      end_time: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
      is_active: formData.isActive
    }
  },

  codeToFormData(code: RedemptionCode): any {
    return {
      code: code.code,
      itemId: code.itemId,
      itemKind: code.itemKind,
      amount: code.amount,
      maxGlobalUses: code.maxGlobalUses || 0,
      maxUserUses: code.maxUserUses || 0,
      startTime: code.startTime ? new Date(code.startTime) : null,
      endTime: code.endTime ? new Date(code.endTime) : null,
      isActive: code.isActive
    }
  },

  batchFormToRequest(batchFormData: any): BatchCreateRequest {
    return {
      count: batchFormData.count,
      length: batchFormData.length,
      itemId: batchFormData.itemId,
      itemKind: batchFormData.itemKind,
      amount: batchFormData.amount,
      max_global_uses: batchFormData.maxGlobalUses || undefined,
      max_user_uses: batchFormData.maxUserUses || undefined,
      start_time: batchFormData.startTime ? new Date(batchFormData.startTime).toISOString() : undefined,
      end_time: batchFormData.endTime ? new Date(batchFormData.endTime).toISOString() : undefined
    }
  },

  // 格式化日期显示
  formatDate(dateStr: string | null): string {
    if (!dateStr) return '永不过期'
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  },

  // 检查兑换码是否过期
  isExpired(endTime: string | null): boolean {
    if (!endTime) return false
    return new Date(endTime) < new Date()
  },

  // 获取兑换码状态类型
  getStatusType(code: RedemptionCode): string {
    if (this.isExpired(code.endTime)) return 'danger'
    if (!code.isActive) return 'warning'
    return 'success'
  },

  // 获取兑换码状态标签
  getStatusLabel(code: RedemptionCode): string {
    if (this.isExpired(code.endTime)) return '已过期'
    if (!code.isActive) return '已禁用'
    return '活跃'
  },

  // 计算使用百分比
  getUsagePercentage(code: RedemptionCode): number {
    if (!code.maxGlobalUses) return 0
    return Math.min((code.usedCount / code.maxGlobalUses) * 100, 100)
  }
}

// 兑换码验证工具函数
export const codeValidator = {
  // 验证兑换码格式
  validateCodeFormat(code: string): boolean {
    // 验证兑换码长度和字符
    const codeRegex = /^[A-Z0-9]{10,30}$/
    return codeRegex.test(code)
  },

  // 验证物品ID
  validateItemId(itemId: number): boolean {
    return itemId > 0 && Number.isInteger(itemId)
  },

  // 验证物品数量
  validateAmount(amount: number): boolean {
    return amount > 0 && Number.isInteger(amount)
  },

  // 验证时间范围
  validateTimeRange(startTime: Date | null, endTime: Date | null): boolean {
    if (!startTime || !endTime) return true
    return startTime < endTime
  },

  // 验证创建表单数据
  validateCreateForm(formData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.validateItemId(formData.itemId)) {
      errors.push('物品ID必须为正整数')
    }

    if (!this.validateAmount(formData.amount)) {
      errors.push('物品数量必须为正整数')
    }

    if (formData.code && !this.validateCodeFormat(formData.code)) {
      errors.push('兑换码格式不正确（10-30位大写字母和数字）')
    }

    if (!this.validateTimeRange(formData.startTime, formData.endTime)) {
      errors.push('开始时间不能晚于结束时间')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export default redeemApi