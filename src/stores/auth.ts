// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type LoginRequest, type UserProfile } from '@/api/auth'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<UserProfile | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))
  const loading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!accessToken.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isUser = computed(() => user.value?.role === 'user')

  // 设置令牌
  const setTokens = (access: string, refresh: string) => {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  }

  // 设置用户信息
  const setUser = (userInfo: UserProfile) => {
    user.value = userInfo
    localStorage.setItem('user_info', JSON.stringify(userInfo))
  }

  // 清除认证信息
  const clearAuth = () => {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_info')
  }

  // 登录
  const login = async (loginData: LoginRequest): Promise<boolean> => {
    try {
      loading.value = true
      const response = await authApi.login(loginData)
      
      // 保存令牌和用户信息
      setTokens(response.access_token, response.refresh_token)
      setUser({
        id: response.user.id,
        username: response.user.username,
        nickname: response.user.nickname,
        role: response.user.role,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      })

      ElMessage.success('登录成功！')
      return true
    } catch (error: any) {
      const message = error.message || '登录失败'
      ElMessage.error(message)
      return false
    } finally {
      loading.value = false
    }
  }

  // 获取用户信息
  const fetchUserProfile = async (): Promise<boolean> => {
    try {
      const userProfile = await authApi.getProfile()
      setUser(userProfile)
      return true
    } catch (error) {
      clearAuth()
      return false
    }
  }

  // 注销
  const logout = async () => {
    try {
      if (accessToken.value) {
        await authApi.logout()
      }
    } catch (error) {
      console.warn('注销请求失败:', error)
    } finally {
      clearAuth()
      ElMessage.success('已注销')
    }
  }

  // 初始化认证状态
  const initAuth = async () => {
    const storedUser = localStorage.getItem('user_info')
    if (storedUser && accessToken.value) {
      try {
        user.value = JSON.parse(storedUser)
        // 验证令牌是否仍然有效
        await fetchUserProfile()
      } catch (error) {
        clearAuth()
      }
    }
  }

  return {
    // 状态
    user,
    accessToken,
    refreshToken,
    loading,
    
    // 计算属性
    isAuthenticated,
    isAdmin,
    isUser,
    
    // 方法
    login,
    logout,
    fetchUserProfile,
    clearAuth,
    initAuth,
    setTokens,
    setUser
  }
})