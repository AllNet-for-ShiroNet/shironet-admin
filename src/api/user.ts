// src/api/user.ts
import http from '@/utils/http'

// 类型定义
export type UserRole = 'admin' | 'user'

export interface AdminUser {
  id: number
  username: string
  nickname: string
  role: UserRole  // 更新为支持所有角色
  createdAt: string
  lastLoginAt: string | null
}

export interface CreateUserRequest {
  username: string
  nickname: string
  password: string
  role: UserRole  // 更新为支持所有角色，移除可选符号
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// 用户管理 API
export const userApi = {
  // 获取所有用户列表（仅管理员）
  async getAllUsers(): Promise<AdminUser[]> {
    try {
      const response = await http.get<AdminUser[]>('/auth/users')
      return response.data
    } catch (error: any) {
      console.error('获取用户列表失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取用户列表失败')
    }
  },

  // 创建新用户（仅管理员）
  async createUser(userData: CreateUserRequest): Promise<AdminUser> {
    try {
      const response = await http.post<any>('/auth/create-user', userData)
      return {
        id: response.data.user.id,
        username: response.data.user.username,
        nickname: response.data.user.nickname,
        role: response.data.user.role,
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      }
    } catch (error: any) {
      console.error('创建用户失败:', error)
      throw new Error(error.response?.data?.message || error.message || '创建用户失败')
    }
  }
}

// 用户验证工具函数
export const userValidator = {
  // 验证用户名格式
  validateUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/
    return usernameRegex.test(username)
  },

  // 验证密码强度
  validatePassword(password: string): boolean {
    return password.length >= 6 && password.length <= 255
  },

  // 验证昵称
  validateNickname(nickname: string): boolean {
    return nickname.length >= 2 && nickname.length <= 100
  },

  // 验证用户角色
  validateRole(role: string): role is UserRole {
    return ['admin', 'user'].includes(role)
  },

  // 验证创建用户表单
  validateCreateUserForm(formData: CreateUserRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.validateUsername(formData.username)) {
      errors.push('用户名格式不正确（3-50位字母、数字、下划线）')
    }

    if (!this.validateNickname(formData.nickname)) {
      errors.push('昵称长度必须在2-100个字符之间')
    }

    if (!this.validatePassword(formData.password)) {
      errors.push('密码长度必须在6-255个字符之间')
    }

    if (!this.validateRole(formData.role)) {
      errors.push('用户角色不正确')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export default userApi