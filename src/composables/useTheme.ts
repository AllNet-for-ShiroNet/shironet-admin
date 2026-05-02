// src/composables/useTheme.ts
import { ref, computed, watch } from 'vue'

export interface ThemeConfig {
  isDark: boolean
  toggleTheme: () => void
  setTheme: (dark: boolean) => void
}

const isDark = ref(false)
const listeners: Set<(dark: boolean) => void> = new Set()

// 从sessionStorage初始化主题
if (typeof window !== 'undefined') {
  try {
    const savedTheme = sessionStorage.getItem('theme')
    if (savedTheme) {
      isDark.value = savedTheme === 'dark'
    } else {
      // 检测系统主题偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDark.value = prefersDark
    }
  } catch (e) {
    // 忽略存储错误，使用默认值
  }
}

// 保存主题到sessionStorage
watch(isDark, (newValue) => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('theme', newValue ? 'dark' : 'light')
      // 更新document class
      if (newValue) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch (e) {
      // 忽略存储错误
    }
  }
  // 通知所有监听器
  listeners.forEach(listener => listener(newValue))
}, { immediate: true })

/**
 * 主题管理 Composable
 * 提供统一的暗黑模式支持
 */
export function useTheme(): ThemeConfig {
  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  const setTheme = (dark: boolean) => {
    isDark.value = dark
  }

  return {
    isDark: computed(() => isDark.value),
    toggleTheme,
    setTheme
  }
}

/**
 * 监听主题变化
 * 用于跨组件通信
 */
export function onThemeChange(callback: (dark: boolean) => void) {
  listeners.add(callback)
  // 返回清理函数
  return () => {
    listeners.delete(callback)
  }
}

/**
 * 获取当前主题值（非响应式）
 */
export function getThemeValue(): boolean {
  return isDark.value
}
