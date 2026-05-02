<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full text-center">
        <div class="mb-8">
          <span class="i-material-symbols-block text-6xl text-red-500 mb-4 block"></span>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">403</h1>
          <h2 class="text-xl font-semibold text-gray-700 mb-4">权限不足</h2>
          <p class="text-gray-600 mb-6">
            抱歉，您没有权限访问此页面。
          </p>
          
          <!-- 根据用户角色显示不同的提示 -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div class="flex items-start">
              <span class="i-material-symbols-info text-blue-600 w-5 h-5 mt-0.5"></span>
              <div class="ml-2 text-left">
                <p class="text-sm font-medium text-blue-800">当前角色权限说明</p>
                <div class="text-xs text-blue-600 mt-1">
                  <div v-if="authStore.user?.role === 'admin'">
                    <p>• 超级管理员：拥有所有页面访问权限</p>
                  </div>
                  <div v-else-if="authStore.user?.role === 'user'">
                    <p>• 普通用户：只能访问基础功能</p>
                    <p>• 可访问：仪表盘、前端设置</p>
                  </div>
                  <div v-else>
                    <p>• 未知角色，请联系管理员</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <div class="space-y-3">
          <!-- 根据角色提供不同的跳转选项 -->
          <el-button 
            type="primary" 
            @click="goToAllowedPage"
            class="w-full"
          >
            <span class="i-material-symbols-arrow-back mr-2"></span>
            {{ getBackButtonText() }}
          </el-button>
          
          <el-button 
            @click="goToDashboard"
            class="w-full"
          >
            <span class="i-material-symbols-dashboard mr-2"></span>
            返回仪表盘
          </el-button>
  
          <el-button 
            @click="logout"
            type="danger"
            plain
            class="w-full"
          >
            <span class="i-material-symbols-logout mr-2"></span>
            重新登录
          </el-button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { getDefaultHomePage } from '@/utils/permission'
  import { ElMessage } from 'element-plus'
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  // 获取返回按钮文本
  const getBackButtonText = (): string => {
    const role = authStore.user?.role
    switch (role) {
      case 'admin':
        return '返回管理页面'
      case 'user':
        return '返回用户页面'
      default:
        return '返回首页'
    }
  }
  
  // 跳转到用户有权限访问的页面
  const goToAllowedPage = () => {
    const userRole = authStore.user?.role || ''
    const defaultPage = getDefaultHomePage(userRole)
    router.push(defaultPage)
  }
  
  // 返回仪表盘
  const goToDashboard = () => {
    router.push('/dashboard')
  }
  
  // 退出登录
  const logout = async () => {
    await authStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  }
  </script>