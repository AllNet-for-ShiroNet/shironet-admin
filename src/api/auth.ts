// src/api/auth.ts
import http from '@/utils/http'

// 类型定义
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: {
    id: number
    username: string
    nickname: string
    role: string
  }
}

export interface UserProfile {
  id: number
  username: string
  nickname: string
  role: string
  createdAt: string
  lastLoginAt: string | null
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// 认证相关 API
export const authApi = {
  // 用户登录
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await http.post('/auth/login', data)
      return response.data
    } catch (error: any) {
      console.error('登录失败:', error)
      throw new Error(error.response?.data?.message || error.message || '登录失败')
    }
  },

  // 获取用户信息
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await http.get<UserProfile>('/auth/profile')
      return response.data
    } catch (error: any) {
      console.error('获取用户信息失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取用户信息失败')
    }
  },

  // 刷新访问令牌
  async refreshToken(data: RefreshTokenRequest): Promise<LoginResponse> {
    try {
      const response = await http.post<LoginResponse>('/auth/refresh', data)
      return response.data
    } catch (error: any) {
      console.error('刷新令牌失败:', error)
      throw new Error(error.response?.data?.message || error.message || '刷新令牌失败')
    }
  },

  // 用户注销
  async logout(): Promise<{ message: string }> {
    try {
      const response = await http.post<{ message: string }>('/auth/logout')
      return response.data
    } catch (error: any) {
      console.error('注销失败:', error)
      // 即使注销失败也要清除本地存储
      return { message: '注销成功' }
    }
  }
}

export default authApi