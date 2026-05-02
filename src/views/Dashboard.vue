<template>
  <div class="space-y-4 sm:space-y-6 px-2 sm:px-0">
    <!-- 服务器状态 -->
    <div :class="[
      'p-4 sm:p-6 rounded-lg border max-w-2xl mx-auto',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ]">
        <h3 :class="[
          'text-base sm:text-lg font-semibold mb-4',
          isDark ? 'text-white' : 'text-gray-900'
        ]">服务器监控(开发中)</h3>
        <div class="space-y-3 sm:space-y-4">
          <div
            v-for="server in serverStatus"
            :key="server.name"
            :class="[
              'flex items-center justify-between p-3 rounded-lg border',
              isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-200'
            ]"
          >
            <div class="flex items-center space-x-3 min-w-0 flex-1">
              <div
                class="w-3 h-3 rounded-full flex-shrink-0"
                :class="server.status === 'healthy' ? 'bg-green-500' : server.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'"
              ></div>
              <div class="min-w-0 flex-1">
                <p :class="[
                  'font-medium text-sm sm:text-base truncate',
                  isDark ? 'text-white' : 'text-gray-900'
                ]">{{ server.name }}</p>
                <p :class="[
                  'text-xs sm:text-sm truncate',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                ]">{{ server.description }}</p>
              </div>
            </div>
            <div class="text-right flex-shrink-0 ml-3">
              <p :class="[
                'text-xs sm:text-sm font-medium',
                isDark ? 'text-white' : 'text-gray-900'
              ]">{{ server.value }}</p>
              <p :class="[
                'text-xs',
                isDark ? 'text-gray-400' : 'text-gray-500'
              ]">{{ server.unit }}</p>
            </div>
          </div>
        </div>
      </div>

    <!-- 游戏公告和管理操作 -->
    <div :class="[
      'p-4 sm:p-6 rounded-lg border',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ]">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
        <h3 :class="[
          'text-base sm:text-lg font-semibold',
          isDark ? 'text-white' : 'text-gray-900'
        ]">游戏公告管理(开发中)</h3>
        <div class="flex flex-wrap gap-2">
          <el-button type="primary" size="small" class="text-xs sm:text-sm">
            <span class="material-icons mr-1 text-sm">add</span>
            发布公告
          </el-button>
          <el-button size="small" class="text-xs sm:text-sm">举报管理</el-button>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="announcement in announcements"
          :key="announcement.id"
          :class="[
            'p-3 sm:p-4 rounded-lg border hover:transition-colors cursor-pointer',
            isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-blue-300',
            { 'bg-blue-50 border-blue-200': !isDark && announcement.pinned },
            { 'bg-blue-900/30 border-blue-600': isDark && announcement.pinned }
          ]"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center mb-2">
                <h4 :class="[
                  'font-medium text-sm sm:text-base truncate flex-1',
                  isDark ? 'text-white' : 'text-gray-900'
                ]">{{ announcement.title }}</h4>
                <span
                  v-if="announcement.pinned"
                  :class="[
                    'ml-2 material-icons text-sm flex-shrink-0',
                    isDark ? 'text-yellow-400' : 'text-yellow-500'
                  ]"
                >
                  push_pin
                </span>
              </div>
              <p :class="[
                'text-xs sm:text-sm line-clamp-2',
                isDark ? 'text-gray-300' : 'text-gray-600'
              ]">{{ announcement.content }}</p>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between mt-3 space-y-2 sm:space-y-0">
                <p :class="[
                  'text-xs',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                ]">{{ announcement.time }}</p>
                <span
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium self-start sm:self-auto"
                  :class="getAnnouncementTypeClass(announcement.type)"
                >
                  {{ getAnnouncementTypeLabel(announcement.type) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const { isDark } = useTheme()

const serverStatus = ref([
  { name: '游戏服务器', value: '正常', status: 'healthy', description: '延迟 23ms', unit: 'GAME' },
  { name: 'aimedb', value: '正常', status: 'healthy', description: '连接正常', unit: 'DB' }
])

const announcements = ref([
  { id: 1, title: '服务器维护通知', content: '将于今晚2点进行服务器维护，预计时长2小时', type: 'urgent', pinned: true, time: '1小时前' },
  { id: 2, title: '新版本更新', content: '版本v1.2.0已发布，新增多项功能', type: 'update', pinned: false, time: '2天前' },
  { id: 3, title: '限时活动', content: '周末双倍经验活动即将开启', type: 'event', pinned: false, time: '3天前' }
])

const getAnnouncementTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    urgent: '紧急',
    update: '更新',
    event: '活动'
  }
  return labels[type] || type
}

const getAnnouncementTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    urgent: isDark.value ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800',
    update: isDark.value ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800',
    event: isDark.value ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
  }
  return classes[type] || classes.update
}
</script>

<style scoped>
/* 文本截断样式 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 确保在小屏幕上图标和文字对齐 */
@media (max-width: 640px) {
  .material-icons {
    vertical-align: middle;
  }
}
</style>
