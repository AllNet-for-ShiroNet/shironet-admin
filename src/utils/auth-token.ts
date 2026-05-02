/**
 * 访问令牌唯一持久化与读取入口，供 http 拦截器与 Pinia 共用，避免「路由已登录但请求无 Authorization」。
 */
export const AUTH_ACCESS_KEY = 'access_token'
export const AUTH_REFRESH_KEY = 'refresh_token'

const listeners = new Set<() => void>()

export function onAuthTokensChanged(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notifyAuthTokensChanged() {
  for (const listener of listeners) {
    try {
      listener()
    } catch (e) {
      console.error('auth-token listener:', e)
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (ev) => {
    if (!ev.key) return
    if (ev.key === AUTH_ACCESS_KEY || ev.key === AUTH_REFRESH_KEY) {
      notifyAuthTokensChanged()
    }
  })
}

export function bearerFromAccessToken(raw: string): string {
  const t = raw.trim()
  return t.startsWith('Bearer ') ? t : `Bearer ${t}`
}

/** 读取 access_token（去空白）；无效则 null */
export function readAccessRaw(): string | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(AUTH_ACCESS_KEY)
  const t = raw?.trim()
  return t ?? null
}

/** 读取 refresh_token（去空白）；无效则 null */
export function readRefreshRaw(): string | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(AUTH_REFRESH_KEY)
  const t = raw?.trim()
  return t ?? null
}

/** 供 Axios 请求的 Authorization；无有效 access 则 null */
export function getAuthorizationHeaderValue(): string | null {
  const raw = readAccessRaw()
  return raw ? bearerFromAccessToken(raw) : null
}

export function persistTokens(access: string, refresh: string): void {
  const a = access.trim()
  const r = refresh.trim()
  if (!a || !r) return
  localStorage.setItem(AUTH_ACCESS_KEY, a)
  localStorage.setItem(AUTH_REFRESH_KEY, r)
  notifyAuthTokensChanged()
}

export function clearStoredAuthTokens(): void {
  localStorage.removeItem(AUTH_ACCESS_KEY)
  localStorage.removeItem(AUTH_REFRESH_KEY)
  notifyAuthTokensChanged()
}
