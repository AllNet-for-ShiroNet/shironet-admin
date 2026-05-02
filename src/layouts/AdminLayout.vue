<template>
  <div :class="[
    'min-h-screen transition-colors duration-300',
    isDark ? 'bg-gray-900' : 'bg-gray-50'
  ]">
    <!-- 侧边栏 -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 shadow-xl transform transition-all duration-300 ease-in-out lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        isDark ? 'bg-gray-800' : 'bg-white border-r border-gray-200'
      ]"
    >
      <!-- Logo 区域 -->
      <div :class="[
        'flex items-center h-14 sm:h-16 px-4 sm:px-6 border-b',
        isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
      ]">
        <div class="flex items-center">
          <h1 :class="[
            'font-bold text-base sm:text-lg',
            isDark ? 'text-white' : 'text-gray-900'
          ]">ALL.Net 街机管理系统</h1>
        </div>
      </div>

      <!-- 导航菜单 -->
      <nav class="mt-2 sm:mt-4 px-2 sm:px-3 pb-4 flex-1 overflow-y-auto">
        <div class="space-y-1">
          <div
            v-for="item in visibleMenuItems"
            :key="item.name"
            @click="navigateTo(item.path)"
            :class="[
              'flex items-center px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 group',
              $route.path === item.path 
                ? 'bg-blue-500 text-white shadow-lg' 
                : isDark 
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            ]"
          >
            <span 
              :class="[
                'material-icons mr-2 sm:mr-3 text-lg',
                $route.path === item.path 
                  ? 'text-white' 
                  : isDark 
                    ? 'text-gray-400 group-hover:text-gray-200' 
                    : 'text-gray-500 group-hover:text-gray-700'
              ]"
            >
              {{ item.icon }}
            </span>
            <span class="flex-1 truncate">{{ item.title }}</span>
          </div>
        </div>

        <!-- 分割线 - 只有当有底部菜单项时才显示 -->
        <div 
          v-if="visibleBottomMenuItems.length > 0"
          :class="[
            'border-t my-3 sm:my-4',
            isDark ? 'border-gray-600' : 'border-gray-200'
          ]">
        </div>

        <!-- 底部菜单 -->
        <div class="space-y-1">
          <div
            v-for="item in visibleBottomMenuItems"
            :key="item.name"
            @click="navigateTo(item.path)"
            :class="[
              'flex items-center px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 group',
              $route.path === item.path 
                ? 'bg-blue-500 text-white shadow-lg' 
                : isDark 
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            ]"
          >
            <span 
              :class="[
                'material-icons mr-2 sm:mr-3 text-lg',
                $route.path === item.path 
                  ? 'text-white' 
                  : isDark 
                    ? 'text-gray-400 group-hover:text-gray-200' 
                    : 'text-gray-500 group-hover:text-gray-700'
              ]"
            >
              {{ item.icon }}
            </span>
            <span class="truncate">{{ item.title }}</span>
          </div>
        </div>
      </nav>
    </aside>

    <!-- 主内容区域 -->
    <div class="lg:ml-64">
      <!-- 顶部导航栏 -->
      <header :class="[
        'shadow-sm border-b sticky top-0 z-40 transition-colors duration-300',
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      ]">
        <div class="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6">
          <!-- 左侧：菜单按钮和面包屑 -->
          <div class="flex items-center min-w-0 flex-1">
            <button
              @click="toggleSidebar"
              :class="[
                'p-2 rounded-lg lg:hidden mr-2 sm:mr-4 transition-colors flex-shrink-0 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500',
                isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
              ]"
            >
              <span class="material-icons text-xl">menu</span>
            </button>
            
            <!-- 面包屑导航 -->
            <nav class="flex min-w-0 flex-1" aria-label="Breadcrumb">
              <div class="flex items-center space-x-1 sm:space-x-2 min-w-0">
                <div class="flex items-center">
                  <span :class="[
                    'material-icons text-base sm:text-lg mr-1 sm:mr-2',
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  ]">home</span>
                  <span :class="[
                    'text-xs sm:text-sm font-medium',
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  ]">首页</span>
                </div>
                <div v-if="currentPage" class="flex items-center min-w-0">
                  <span :class="[
                    'material-icons mx-1 sm:mx-2 text-xs sm:text-sm',
                    isDark ? 'text-gray-600' : 'text-gray-300'
                  ]">chevron_right</span>
                  <span :class="[
                    'text-xs sm:text-sm font-medium truncate',
                    isDark ? 'text-white' : 'text-gray-900'
                  ]">{{ currentPage }}</span>
                </div>
              </div>
            </nav>
          </div>

          <!-- 右侧：主题切换和用户菜单 -->
          <div class="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <!-- 主题切换按钮 -->
            <button
              @click="toggleTheme"
              :class="[
                'flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none border-0 outline-none',
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              ]"
              :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
            >
              <span class="material-icons text-lg">
                {{ isDark ? 'light_mode' : 'dark_mode' }}
              </span>
            </button>

            <!-- 用户菜单 -->
            <el-dropdown placement="bottom-end">
              <div :class="[
                'flex items-center cursor-pointer p-1 sm:p-2 rounded-lg transition-colors',
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              ]">
                <div class="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center mr-1 sm:mr-3">
                  <span class="material-icons text-white text-sm">person</span>
                </div>
                <div class="hidden md:block text-right mr-2">
                  <p :class="[
                    'text-sm font-medium',
                    isDark ? 'text-white' : 'text-gray-900'
                  ]">{{ currentUser.username || '用户' }}</p>
                  <p :class="[
                    'text-xs',
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  ]">{{ currentUser.role || '用户' }}</p>
                </div>
                <span :class="[
                  'material-icons text-lg hidden sm:block',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                ]">expand_more</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>
                    <span class="material-icons mr-2 text-sm">person</span>
                    个人资料
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <span class="material-icons mr-2 text-sm">settings</span>
                    账户设置
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <span class="material-icons mr-2 text-sm">help</span>
                    帮助中心
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="logout">
                    <span class="material-icons mr-2 text-sm">logout</span>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="p-3 sm:p-6">
        <router-view />
      </main>
    </div>

    <!-- 移动端遮罩 -->
    <div
      v-if="sidebarOpen"
      @click="toggleSidebar"
      class="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity duration-300"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()

const sidebarOpen = ref(false)
const { isDark, toggleTheme } = useTheme()

// 用户信息
const currentUser = ref({
  username: '',
  role: '',
  nickname: ''
})

// 完整菜单项
const menuItems = [
  { 
    name: 'Dashboard', 
    path: '/dashboard', 
    title: '仪表盘', 
    icon: 'dashboard',
    permissions: ['admin'] // 只有admin可以访问
  },
  { 
    name: 'User', 
    path: '/dashboard/userlist', 
    title: '管理员用户', 
    icon: 'group',
    permissions: ['admin']
  },
  { 
    name: 'Users', 
    path: '/dashboard/user', 
    title: '玩家管理', 
    icon: 'group',
    permissions: ['admin']
  },
  { 
    name: 'Keychip', 
    path: '/dashboard/keychip', 
    title: '狗号管理', 
    icon: 'memory',
    permissions: ['admin']
  },
  { 
    name: 'redeem', 
    path: '/dashboard/redeem', 
    title: '兑换码管理', 
    icon: 'confirmation_number',
    permissions: ['admin']
  },
  {
    name: 'Events',
    path: '/dashboard/events',
    title: '活动管理',
    icon: 'event',
    permissions: ['admin']
  },
  {
    name: 'DataManage',
    path: '/dashboard/data-manage',
    title: '数据管理',
    icon: 'storage',
    permissions: ['admin']
  },
]

const bottomMenuItems = [
  {
    name: 'DataUpload',
    path: '/dashboard/upload',
    title: '数据上传',
    icon: 'cloud_upload',
    permissions: ['admin']
  },
  {
    name: 'Announcements',
    path: '/dashboard/announcements',
    title: '公告管理',
    icon: 'speaker_notes',
    permissions: ['admin']
  },
  {
    name: 'Settings',
    path: '/dashboard/setting',
    title: '系统设置',
    icon: 'settings',
    permissions: ['admin']
  },
  {
    name: 'DataDownload',
    path: '/dashboard/data-download',
    title: '数据下载',
    icon: 'download',
    permissions: ['admin']
  }
]

// 根据用户权限过滤菜单
const visibleMenuItems = computed(() => {
  return menuItems.filter(item => {
    return item.permissions.includes(currentUser.value.role)
  })
})

const visibleBottomMenuItems = computed(() => {
  return bottomMenuItems.filter(item => {
    return item.permissions.includes(currentUser.value.role)
  })
})

const currentPage = computed(() => {
  const allItems = [...visibleMenuItems.value, ...visibleBottomMenuItems.value]
  const currentItem = allItems.find(item => item.path === route.path)
  return currentItem?.title || ''
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const navigateTo = (path: string) => {
  router.push(path)
  sidebarOpen.value = false // 移动端关闭侧边栏
}

const logout = () => {
  ElMessage.success('退出登录成功')
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user_info')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('remember_login')
      localStorage.removeItem('saved_username')
      localStorage.removeItem('user_info')
    } catch (e) {
      // 忽略存储错误
    }
  }
  router.push('/login')
}

// 获取用户信息
const getUserInfo = () => {
  if (typeof window !== 'undefined') {
    try {
      // 尝试从localStorage获取用户信息
      const userInfoStr = localStorage.getItem('user_info')
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        currentUser.value = {
          username: userInfo.username || '',
          role: userInfo.role || '',
          nickname: userInfo.nickname || userInfo.username || ''
        }
      }
      
      // 如果localStorage没有，尝试从sessionStorage获取
      if (!currentUser.value.username) {
        const sessionUserInfo = sessionStorage.getItem('user_info')
        if (sessionUserInfo) {
          const userInfo = JSON.parse(sessionUserInfo)
          currentUser.value = {
            username: userInfo.username || '',
            role: userInfo.role || '',
            nickname: userInfo.nickname || userInfo.username || ''
          }
        }
      }
      
      // 如果还是没有用户信息，可能需要重定向到登录页面
      if (!currentUser.value.username || !currentUser.value.role) {
        console.warn('用户信息不完整，可能需要重新登录')
        // 可以在这里添加重定向到登录页面的逻辑
        // router.push('/login')
      }
      
    } catch (e) {
      console.error('获取用户信息失败:', e)
      // 可以在这里添加错误处理逻辑
    }
  }
}

// 初始化
onMounted(() => {
  // 获取用户信息
  getUserInfo()
})
</script>

<style scoped>
/* 自定义滚动条 */
:deep(.overflow-y-auto) {
  scrollbar-width: thin;
}

:deep(.overflow-y-auto::-webkit-scrollbar) {
  width: 6px;
}

:deep(.overflow-y-auto::-webkit-scrollbar-track) {
  border-radius: 3px;
}

:deep(.overflow-y-auto::-webkit-scrollbar-thumb) {
  border-radius: 3px;
}

:deep(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
  opacity: 0.8;
}

/* 深色模式滚动条 */
.dark :deep(.overflow-y-auto) {
  scrollbar-color: #64748b #374151;
}

.dark :deep(.overflow-y-auto::-webkit-scrollbar-track) {
  background: #374151;
}

.dark :deep(.overflow-y-auto::-webkit-scrollbar-thumb) {
  background: #64748b;
}

/* 浅色模式滚动条 */
:deep(.overflow-y-auto) {
  scrollbar-color: #cbd5e1 #f1f5f9;
}

:deep(.overflow-y-auto::-webkit-scrollbar-track) {
  background: #f1f5f9;
}

:deep(.overflow-y-auto::-webkit-scrollbar-thumb) {
  background: #cbd5e1;
}

/* 确保在小屏幕上文本不会溢出 */
@media (max-width: 640px) {
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>