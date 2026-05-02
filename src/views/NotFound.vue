<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
    <div class="text-center max-w-md mx-auto">
      <!-- 404 数字 -->
      <div class="mb-8 relative">
        <h1 class="text-9xl font-bold text-slate-200 select-none">
          404
        </h1>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-24 h-24 rounded-full bg-slate-300 opacity-30 animate-pulse"></div>
        </div>
      </div>

      <!-- 错误信息 -->
      <div class="mb-8 space-y-2">
        <h2 class="text-2xl font-semibold text-slate-700">
          页面未找到
        </h2>
        <p class="text-slate-500">
          抱歉，您访问的页面不存在或已被移除
        </p>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          @click="goBack"
          class="inline-flex items-center justify-center px-6 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors duration-200 shadow-sm"
        >
          <ArrowLeftIcon class="w-4 h-4 mr-2" />
          返回上页
        </button>
        
        <button
          @click="goHome"
          class="inline-flex items-center justify-center px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 shadow-sm"
        >
          <HomeIcon class="w-4 h-4 mr-2" />
          回到首页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

// 如果使用 Element Plus 图标
import { 
  ArrowLeft as ArrowLeftIcon,
  House as HomeIcon 
} from '@element-plus/icons-vue'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
/* Tailwind CSS 会处理所有样式，无需额外CSS */
</style>