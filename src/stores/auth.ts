// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type LoginRequest, type UserProfile } from '@/api/auth'
import { ElMessage } from 'element-plus'
import {
  clearAuthSessionPersistence,
  onStoredUserChanged,
  persistUserProfile,
  readStoredUserProfile,
} from '@/utils/auth-session'
import {
  onAuthTokensChanged,
  persistTokens,
  readAccessRaw,
  readRefreshRaw,
} from '@/utils/auth-token'

/** 远端会话校验节流：避免因「永远不 initAuth」导致 access 过期只能靠统计等接口兜底；又不会每次路由都打 /profile */
const SESSION_VERIFY_INTERVAL_MS = 90 * 1000

export const useAuthStore = defineStore('auth', () => {
  const lastRemoteSessionVerifyAt = ref(0)

  /** 单次飞行，合并并发 initAuth（例如快速连点多级路由） */
  let verifyInFlight: Promise<void> | null = null

  function syncRefsFromStorage() {
    accessToken.value = readAccessRaw()
    refreshToken.value = readRefreshRaw()
  }

  function syncUserFromStored() {
    user.value = readStoredUserProfile()
  }

  const user = ref<UserProfile | null>(readStoredUserProfile())
  const accessToken = ref<string | null>(readAccessRaw())
  const refreshToken = ref<string | null>(readRefreshRaw())
  const loading = ref(false)

  onAuthTokensChanged(syncRefsFromStorage)
  onStoredUserChanged(syncUserFromStored)

  const isAuthenticated = computed(() => !!accessToken.value?.trim())
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isUser = computed(() => user.value?.role === 'user')

  const setTokens = (access: string, refresh: string) => {
    persistTokens(access, refresh)
  }

  /** 仅存一份：持久化并由 onStoredUserChanged 回写到 ref（含同 tab 内同步 notify） */
  const setUser = (userInfo: UserProfile) => {
    persistUserProfile(userInfo)
  }

  const clearAuth = () => {
    lastRemoteSessionVerifyAt.value = 0
    clearAuthSessionPersistence()
  }

  const login = async (loginData: LoginRequest): Promise<boolean> => {
    try {
      loading.value = true
      const response = await authApi.login(loginData)

      setTokens(response.access_token, response.refresh_token)
      setUser({
        id: response.user.id,
        username: response.user.username,
        nickname: response.user.nickname,
        role: response.user.role,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      })
      lastRemoteSessionVerifyAt.value = Date.now()

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

  const logout = async () => {
    try {
      if (readAccessRaw()) {
        await authApi.logout()
      }
    } catch {
      /* 注销接口失败仍可清理本地会话 */
    } finally {
      clearAuth()
      ElMessage.success('已注销')
    }
  }

  const initAuth = async () => {
    if (!readAccessRaw()) return
    if (verifyInFlight) return verifyInFlight

    const elapsed = Date.now() - lastRemoteSessionVerifyAt.value
    if (elapsed >= 0 && elapsed < SESSION_VERIFY_INTERVAL_MS) return

    verifyInFlight = (async () => {
      const cached = readStoredUserProfile()
      if (cached) user.value = cached

      const ok = await fetchUserProfile()
      if (ok) lastRemoteSessionVerifyAt.value = Date.now()
    })().finally(() => {
      verifyInFlight = null
    })

    return verifyInFlight
  }

  return {
    user,
    accessToken,
    refreshToken,
    loading,

    isAuthenticated,
    isAdmin,
    isUser,

    login,
    logout,
    fetchUserProfile,
    clearAuth,
    initAuth,
    setTokens,
    setUser,
  }
})
