import type { UserProfile } from '@/api/auth'
import { clearStoredAuthTokens } from '@/utils/auth-token'

/** 与其它地方历史键名一致 */
export const AUTH_USER_INFO_KEY = 'user_info'

const userListeners = new Set<() => void>()

export function onStoredUserChanged(listener: () => void): () => void {
  userListeners.add(listener)
  return () => userListeners.delete(listener)
}

function notifyStoredUserChanged() {
  for (const listener of userListeners) {
    try {
      listener()
    } catch (e) {
      console.error('auth-session user listener:', e)
    }
  }
}

function parseUser(raw: string | null): UserProfile | null {
  if (!raw?.trim()) return null
  try {
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

/**
 * 优先 localStorage；仅 sessionStorage 有条目时顺带迁到 localStorage（旧版 AdminLayout）。
 */
export function readStoredUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  const ls = parseUser(localStorage.getItem(AUTH_USER_INFO_KEY))
  if (ls) return ls
  const ss = parseUser(sessionStorage.getItem(AUTH_USER_INFO_KEY))
  if (ss) {
    persistUserProfile(ss)
    sessionStorage.removeItem(AUTH_USER_INFO_KEY)
    return ss
  }
  return null
}

export function persistUserProfile(profile: UserProfile): void {
  localStorage.setItem(AUTH_USER_INFO_KEY, JSON.stringify(profile))
  notifyStoredUserChanged()
}

/** 清空用户缓存（含 sessionStorage 里可能存在的同名键），不碰 token */
export function clearStoredUserProfile(): void {
  localStorage.removeItem(AUTH_USER_INFO_KEY)
  sessionStorage.removeItem(AUTH_USER_INFO_KEY)
  notifyStoredUserChanged()
}

/** Token 与用户资料一并清除：401 刷新失败、logout、鉴权作废 */
export function clearAuthSessionPersistence(): void {
  clearStoredAuthTokens()
  clearStoredUserProfile()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (ev) => {
    if (!ev.key) return
    if (ev.key === AUTH_USER_INFO_KEY) {
      notifyStoredUserChanged()
    }
  })
}
