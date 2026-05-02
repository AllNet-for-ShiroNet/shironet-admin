// src/api/user-list.ts
import http from '@/utils/http'

// 类型定义
export interface User {
  id: number
  username: string
  email: string
  aimeCard?: string
  role: string
  cardLocked: boolean
  cardBanned: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

export interface UserListResponse {
  users: User[]
  total: number
}

export interface UserListParams {
  page: number
  limit: number
  search?: string
  role?: string
  cardStatus?: string
}

export interface CreateUserRequest {
  username: string
  email: string
  aimeCard?: string | null
  role: string
  cardLocked?: boolean
  cardBanned?: boolean
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  aimeCard?: string | null
  role?: string
  cardLocked?: boolean
  cardBanned?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// API 调用函数
export const userApi = {
  // 获取用户列表
  async getUserList(params: UserListParams): Promise<UserListResponse> {
    try {
      const cleanParams = {
        page: params.page,
        limit: params.limit,
        ...(params.search && { search: params.search }),
        ...(params.role && { role: params.role }),
        ...(params.cardStatus && { cardStatus: params.cardStatus }),
      }
      
      const response = await http.get('/users', { params: cleanParams })
      
      // 处理不同的后端响应格式
      const data = response.data
      
      if (data && typeof data === 'object') {
        // 格式1: { success: true, data: { users: [], total: number } }
        if (data.success && data.data && 'users' in data.data && 'total' in data.data) {
          return {
            users: data.data.users.map((item: any) => dataTransform.backendToFrontend(item)) || [],
            total: data.data.total || 0
          }
        }
        // 格式2: { users: [], total: number }
        else if ('users' in data && 'total' in data) {
          return {
            users: data.users.map((item: any) => dataTransform.backendToFrontend(item)) || [],
            total: data.total || 0
          }
        }
        // 格式3: { data: { users: [], total: number } }
        else if ('data' in data && data.data && 'users' in data.data) {
          return {
            users: data.data.users.map((item: any) => dataTransform.backendToFrontend(item)) || [],
            total: data.data.total || 0
          }
        }
        // 格式4: 直接返回用户数组
        else if (Array.isArray(data)) {
          return {
            users: data.map((item: any) => dataTransform.backendToFrontend(item)),
            total: data.length
          }
        }
        // 格式5: 其他可能的嵌套格式
        else {
          // 尝试从各种可能的位置提取数据
          const users = data.users || data.data?.users || data.result?.users || []
          const total = data.total || data.data?.total || data.result?.total || 0
          
          return {
            users: Array.isArray(users) ? users.map((item: any) => dataTransform.backendToFrontend(item)) : [],
            total: typeof total === 'number' ? total : 0
          }
        }
      } else {
        return {
          users: [],
          total: 0
        }
      }
    } catch (error: any) {
      console.error('获取用户列表失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取用户列表失败')
    }
  },

  // 创建用户
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const requestData = dataTransform.frontendToBackend(userData)
      const response = await http.post<ApiResponse<any>>('/users', requestData)
      
      if (response.data.success && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      throw new Error(response.data.message || '创建用户失败')
    } catch (error: any) {
      console.error('创建用户失败:', error)
      throw new Error(error.response?.data?.message || error.message || '创建用户失败')
    }
  },

  // 更新用户
  async updateUser(userId: number, userData: UpdateUserRequest): Promise<User> {
    try {
      const requestData = dataTransform.frontendToBackend(userData)
      const response = await http.patch<ApiResponse<any>>(`/users/${userId}`, requestData)
      
      if (response.data.success && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      throw new Error(response.data.message || '更新用户失败')
    } catch (error: any) {
      console.error('更新用户失败:', error)
      throw new Error(error.response?.data?.message || error.message || '更新用户失败')
    }
  },

  // 删除用户
  async deleteUser(userId: number): Promise<void> {
    try {
      const response = await http.delete<ApiResponse<void>>(`/users/${userId}`)
      if (response.data && !response.data.success) {
        throw new Error(response.data.message || '删除用户失败')
      }
    } catch (error: any) {
      console.error('删除用户失败:', error)
      throw new Error(error.response?.data?.message || error.message || '删除用户失败')
    }
  },

  // 切换卡片锁定状态
  async toggleCardLock(userId: number): Promise<User> {
    try {
      const response = await http.patch<ApiResponse<any>>(`/users/${userId}/toggle-lock`)
      
      if (response.data.success && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      throw new Error(response.data.message || '切换卡片锁定状态失败')
    } catch (error: any) {
      console.error('切换卡片锁定状态失败:', error)
      throw new Error(error.response?.data?.message || error.message || '切换卡片锁定状态失败')
    }
  },

  // 切换卡片封禁状态
  async toggleCardBan(userId: number): Promise<User> {
    try {
      const response = await http.patch<ApiResponse<any>>(`/users/${userId}/toggle-ban`)
      
      if (response.data.success && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      throw new Error(response.data.message || '切换卡片封禁状态失败')
    } catch (error: any) {
      console.error('切换卡片封禁状态失败:', error)
      throw new Error(error.response?.data?.message || error.message || '切换卡片封禁状态失败')
    }
  },

  // 根据ID获取用户信息
  async getUserById(userId: number): Promise<User> {
    try {
      const response = await http.get<ApiResponse<any>>(`/users/${userId}`)
      
      if (response.data.success && response.data.data) {
        return dataTransform.backendToFrontend(response.data.data)
      }
      throw new Error(response.data.message || '获取用户信息失败')
    } catch (error: any) {
      console.error('获取用户信息失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取用户信息失败')
    }
  },

  // 批量删除用户
  async batchDeleteUsers(userIds: number[]): Promise<void> {
    try {
      const response = await http.delete<ApiResponse<void>>('/users/batch', {
        data: { userIds }
      })
      
      if (response.data && !response.data.success) {
        throw new Error(response.data.message || '批量删除用户失败')
      }
    } catch (error: any) {
      console.error('批量删除用户失败:', error)
      throw new Error(error.response?.data?.message || error.message || '批量删除用户失败')
    }
  },

  // 获取用户统计信息
  async getUserStats(): Promise<any> {
    try {
      const response = await http.get<ApiResponse<any>>('/users/stats')
      
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.message || '获取用户统计信息失败')
    } catch (error: any) {
      console.error('获取用户统计信息失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取用户统计信息失败')
    }
  }
}

// 数据转换工具函数
export const dataTransform = {
  // 后端数据转前端数据
  backendToFrontend(backendData: any): User {
    return {
      id: backendData.id,
      username: backendData.username,
      email: backendData.email,
      aimeCard: backendData.aime_card || backendData.aimeCard,
      role: backendData.role,
      cardLocked: backendData.card_locked ?? backendData.cardLocked ?? false,
      cardBanned: backendData.card_banned ?? backendData.cardBanned ?? false,
      createdAt: backendData.created_at || backendData.createdAt,
      updatedAt: backendData.updated_at || backendData.updatedAt,
      lastLogin: backendData.last_login || backendData.lastLogin
    }
  },

  // 前端数据转后端数据
  frontendToBackend(frontendData: any): any {
    const result: any = {}
    
    if (frontendData.id !== undefined) result.id = frontendData.id
    if (frontendData.username !== undefined) result.username = frontendData.username
    if (frontendData.email !== undefined) result.email = frontendData.email
    if (frontendData.aimeCard !== undefined) result.aimeCard = frontendData.aimeCard
    if (frontendData.role !== undefined) result.role = frontendData.role
    if (frontendData.cardLocked !== undefined) result.cardLocked = frontendData.cardLocked
    if (frontendData.cardBanned !== undefined) result.cardBanned = frontendData.cardBanned
    
    return result
  },

  // 表单数据转创建请求
  formToCreateRequest(formData: any): CreateUserRequest {
    return {
      username: formData.username,
      email: formData.email,
      aimeCard: formData.aimeCard || null,
      role: formData.role,
      cardLocked: formData.cardLocked || false,
      cardBanned: formData.cardBanned || false
    }
  },

  // 表单数据转更新请求
  formToUpdateRequest(formData: any): UpdateUserRequest {
    const result: UpdateUserRequest = {}
    
    if (formData.username !== undefined) result.username = formData.username
    if (formData.email !== undefined) result.email = formData.email
    if (formData.aimeCard !== undefined) result.aimeCard = formData.aimeCard || null
    if (formData.role !== undefined) result.role = formData.role
    if (formData.cardLocked !== undefined) result.cardLocked = formData.cardLocked
    if (formData.cardBanned !== undefined) result.cardBanned = formData.cardBanned
    
    return result
  },

  // 用户数据转表单数据
  userToFormData(user: User): any {
    return {
      username: user.username,
      email: user.email,
      aimeCard: user.aimeCard || '',
      role: user.role,
      cardLocked: user.cardLocked,
      cardBanned: user.cardBanned
    }
  },

  // 格式化日期显示
  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/')
  },

  // 格式化日期时间显示
  formatDateTime(dateStr: string | null | undefined): string {
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

  // 获取角色样式
  getRoleStyle(role: string): string {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'trust_user':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  },

  // 获取角色标签
  getRoleLabel(role: string): string {
    switch (role) {
      case 'super_admin':
        return '超级管理员'
      case 'admin':
        return '管理员'
      case 'trust_user':
        return '可信用户'
      default:
        return '普通用户'
    }
  },

  // 获取卡片状态标签
  getCardStatusLabel(cardLocked: boolean, cardBanned: boolean): string {
    if (cardBanned) return '已封禁'
    if (cardLocked) return '已锁定'
    return '正常'
  },

  // 获取卡片状态样式
  getCardStatusStyle(cardLocked: boolean, cardBanned: boolean): string {
    if (cardBanned) return 'bg-red-100 text-red-800'
    if (cardLocked) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }
}

// 用户数据验证工具函数
export const userValidator = {
  // 验证用户名格式
  validateUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{2,20}$/
    return usernameRegex.test(username)
  },

  // 验证邮箱格式
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // 验证AIME卡号格式
  validateAimeCard(aimeCard: string): boolean {
    if (!aimeCard) return true // 可选字段
    const aimeCardRegex = /^[0-9]{8,20}$/
    return aimeCardRegex.test(aimeCard)
  },

  // 验证角色
  validateRole(role: string): boolean {
    const validRoles = ['super_admin', 'admin', 'trust_user', 'user']
    return validRoles.includes(role)
  },

  // 验证创建用户表单数据
  validateCreateForm(formData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!formData.username || !this.validateUsername(formData.username)) {
      errors.push('用户名格式不正确（2-20位字母、数字或下划线）')
    }

    if (!formData.email || !this.validateEmail(formData.email)) {
      errors.push('邮箱格式不正确')
    }

    if (formData.aimeCard && !this.validateAimeCard(formData.aimeCard)) {
      errors.push('AIME卡号格式不正确（8-20位数字）')
    }

    if (!formData.role || !this.validateRole(formData.role)) {
      errors.push('请选择有效的角色')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  // 验证更新用户表单数据
  validateUpdateForm(formData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (formData.username && !this.validateUsername(formData.username)) {
      errors.push('用户名格式不正确（2-20位字母、数字或下划线）')
    }

    if (formData.email && !this.validateEmail(formData.email)) {
      errors.push('邮箱格式不正确')
    }

    if (formData.aimeCard && !this.validateAimeCard(formData.aimeCard)) {
      errors.push('AIME卡号格式不正确（8-20位数字）')
    }

    if (formData.role && !this.validateRole(formData.role)) {
      errors.push('请选择有效的角色')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export default userApi