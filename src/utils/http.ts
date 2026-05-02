import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { clearAuthSessionPersistence } from '@/utils/auth-session'
import {
  bearerFromAccessToken,
  getAuthorizationHeaderValue,
  persistTokens,
  readRefreshRaw,
} from '@/utils/auth-token'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers = AxiosHeaders.from(config.headers ?? {})
    if (config.data instanceof FormData) {
      config.headers.delete('Content-Type')
    }
    const bearer = getAuthorizationHeaderValue()
    if (bearer) {
      config.headers.set('Authorization', bearer)
    }
    return config
  },
  (error) => Promise.reject(error),
)

let refreshInFlight: Promise<{ access_token: string; refresh_token: string }> | null = null

async function performTokenRefresh(refreshTok: string): Promise<{ access_token: string; refresh_token: string }> {
  const response = await axios.post<{ access_token: string; refresh_token: string }>(
    `${API_BASE_URL}/auth/refresh`,
    { refresh_token: refreshTok },
  )
  const { access_token, refresh_token } = response.data
  persistTokens(String(access_token), String(refresh_token))
  return { access_token: String(access_token), refresh_token: String(refresh_token) }
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      const refreshTokenValue = readRefreshRaw()
      if (refreshTokenValue) {
        try {
          if (!refreshInFlight) {
            refreshInFlight = performTokenRefresh(refreshTokenValue).finally(() => {
              refreshInFlight = null
            })
          }
          const { access_token } = await refreshInFlight

          originalRequest.headers = AxiosHeaders.from(originalRequest.headers ?? {})
          originalRequest.headers.set('Authorization', bearerFromAccessToken(access_token))
          return http(originalRequest)
        } catch (refreshError) {
          clearAuthSessionPersistence()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

export default http
