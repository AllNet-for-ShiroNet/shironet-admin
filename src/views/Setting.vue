<template>
    <div class="setting-container min-h-screen bg-gray-50 p-6">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-800">系统设置</h1>
        <p class="text-gray-600 text-base mt-1">管理系统的基础配置信息</p>
      </div>
  
      <!-- 设置卡片 -->
      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          
          <!-- 卡片头部 -->
          <div class="bg-slate-600 px-6 py-5">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span class="text-lg font-medium text-white">版本配置</span>
            </div>
            <p class="text-slate-200 text-sm mt-1">设置系统核心版本信息</p>
          </div>
          
          <!-- 卡片内容 -->
          <div class="p-8 space-y-8">
            
            <!-- 排行榜版本 -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gray-900 flex items-center">
                <div class="w-1.5 h-1.5 bg-slate-500 rounded-full mr-3"></div>
                排行榜版本
              </h3>
              <p class="text-gray-600 ml-6">
                设置当前使用的排行榜版本号，影响排名算法和数据处理逻辑
              </p>
              <div class="ml-6 flex items-center space-x-3">
                <input 
                  type="number" 
                  v-model.number="settings.rankingVersion"
                  class="w-28 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none text-center font-medium"
                  min="1"
                  max="999"
                />
                <span class="text-gray-500">版本</span>
              </div>
              <p class="text-sm text-gray-500 ml-6">建议使用版本 17 或更高版本以获得最佳性能</p>
            </div>
  
            <!-- 分割线 -->
            <div class="border-t border-gray-100"></div>
  
            <!-- 前端版本 -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gray-900 flex items-center">
                <div class="w-1.5 h-1.5 bg-slate-500 rounded-full mr-3"></div>
                前端版本
              </h3>
              <p class="text-gray-600 ml-6">
                设置前端界面版本号，影响用户界面外观和功能特性
              </p>
              <div class="ml-6">
                <input 
                  type="text" 
                  v-model="settings.frontendVersion"
                  class="w-36 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none text-center font-medium"
                  placeholder="3.2.1"
                  pattern="^\d+\.\d+\.\d+$"
                />
              </div>
            </div>
  
          </div>
        </div>
  
        <!-- 操作按钮 -->
        <div class="flex justify-end space-x-3 mt-8">
          <button 
            @click="resetSettings"
            class="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-150 font-medium"
          >
            重置默认
          </button>
          <button 
            @click="saveSettings"
            :disabled="!hasChanges"
            class="px-6 py-2.5 text-white bg-slate-600 border border-transparent rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-150 font-medium"
          >
            保存设置
          </button>
        </div>
  
        <!-- 成功提示 -->
        <div v-if="showSuccessMessage" class="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-green-800 font-medium">
                设置已成功保存！
              </p>
            </div>
          </div>
        </div>
  
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  
  interface Settings {
    rankingVersion: number
    frontendVersion: string
  }
  
  // 响应式数据
  const settings = ref<Settings>({
    rankingVersion: 17,
    frontendVersion: '3.2.1'
  })
  
  const originalSettings = ref<Settings>({
    rankingVersion: 17,
    frontendVersion: '3.2.1'
  })
  
  const showSuccessMessage = ref(false)
  
  // 计算属性
  const hasChanges = computed(() => {
    return settings.value.rankingVersion !== originalSettings.value.rankingVersion ||
           settings.value.frontendVersion !== originalSettings.value.frontendVersion
  })
  
  // 方法
  const saveSettings = async () => {
    try {
      console.log('保存设置:', settings.value)
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 更新原始设置
      originalSettings.value = { ...settings.value }
      
      // 显示成功消息
      showSuccessMessage.value = true
      setTimeout(() => {
        showSuccessMessage.value = false
      }, 3000)
      
    } catch (error) {
      console.error('保存失败:', error)
    }
  }
  
  const resetSettings = () => {
    settings.value = {
      rankingVersion: 17,
      frontendVersion: '3.2.1'
    }
  }
  
  // 生命周期
  onMounted(() => {
    loadSettings()
  })
  
  const loadSettings = async () => {
    try {
      console.log('加载设置')
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }
  </script>
  
  <style scoped>
  .setting-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  }
  
  /* 移除数字输入框的默认箭头 */
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  input[type="number"] {
    -moz-appearance: textfield;
  }
  </style>