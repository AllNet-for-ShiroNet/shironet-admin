<template>
  <div class="space-y-4 sm:space-y-6 px-2 sm:px-0">
    <!-- 页面标题和筛选 -->
    <div :class="[
      'p-4 sm:p-6 rounded-lg border',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ]">
      <div class="mb-4 sm:mb-6">
        <h2 :class="[
          'text-xl sm:text-2xl font-bold',
          isDark ? 'text-white' : 'text-gray-900'
        ]">数据管理</h2>
        <p :class="[
          'text-xs sm:text-sm mt-1',
          isDark ? 'text-gray-400' : 'text-gray-500'
        ]">查看所有CHUNITHM玩家数据（共 {{ totalCount }} 个用户）</p>
      </div>

      <!-- 搜索框 -->
      <div class="flex flex-col sm:flex-row gap-3">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户ID、用户名或AIME卡号..."
          clearable
          size="default"
          @input="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <span class="material-icons text-gray-400">search</span>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch" class="w-full sm:w-auto">
          <span class="material-icons mr-1 text-sm">search</span>
          搜索
        </el-button>
        <el-button @click="loadData" class="w-full sm:w-auto">
          <span class="material-icons mr-1 text-sm">refresh</span>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 用户列表 -->
    <div :class="[
      'p-4 sm:p-6 rounded-lg border',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ]">
      <div v-if="loading" class="flex justify-center py-12">
        <el-icon class="is-loading"><span class="material-icons">loading</span></el-icon>
      </div>

      <div v-else-if="users.length === 0" class="text-center py-12">
        <p :class="[
          'text-base',
          isDark ? 'text-gray-400' : 'text-gray-500'
        ]">暂无CHUNITHM用户数据</p>
      </div>

      <div v-else>
        <!-- 移动端卡片视图 -->
        <div class="block sm:hidden space-y-3">
          <div
            v-for="user in users"
            :key="user.id"
            :class="[
              'p-4 rounded-lg border cursor-pointer transition-colors',
              isDark
                ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            ]"
            @click="selectUser(user)"
          >
            <!-- 用户头部 -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center mb-1">
                  <h3 :class="[
                    'font-medium text-base truncate',
                    isDark ? 'text-white' : 'text-gray-900'
                  ]">{{ user.username }}</h3>
                  <span class="ml-2 text-xs text-gray-500">#{{ user.id }}</span>
                </div>
                <p v-if="user.email" :class="[
                  'text-sm truncate',
                  isDark ? 'text-gray-300' : 'text-gray-600'
                ]">{{ user.email }}</p>
              </div>
              <el-button size="small" type="primary">
                <span class="material-icons text-sm mr-1">visibility</span>
                查看详情
              </el-button>
            </div>

            <!-- AIME卡信息 -->
            <div v-if="user.aimeCard" class="mb-3">
              <div :class="[
                'text-xs font-medium mb-1',
                isDark ? 'text-gray-400' : 'text-gray-500'
              ]">AIME卡</div>
              <div :class="[
                'font-mono text-sm px-2 py-1 rounded',
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
              ]">
                {{ user.aimeCard }}
              </div>
            </div>

            <!-- CHUNITHM档案数据 -->
            <div :class="[
              'p-3 rounded border',
              isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
            ]">
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span :class="[
                    'block mb-1',
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  ]">玩家名</span>
                  <span :class="[
                    'font-medium',
                    isDark ? 'text-white' : 'text-gray-900'
                  ]">{{ user.chuniProfile.playerName || '-' }}</span>
                </div>
                <div>
                  <span :class="[
                    'block mb-1',
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  ]">等级</span>
                  <span :class="[
                    'font-medium',
                    isDark ? 'text-white' : 'text-gray-900'
                  ]">{{ user.chuniProfile.level }}</span>
                </div>
                <div>
                  <span :class="[
                    'block mb-1',
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  ]">Rating</span>
                  <span :class="[
                    'font-medium',
                    isDark ? 'text-white' : 'text-gray-900'
                  ]">{{ user.chuniProfile.playerRating }}</span>
                </div>
                <div>
                  <span :class="[
                    'block mb-1',
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  ]">游玩次数</span>
                  <span :class="[
                    'font-medium',
                    isDark ? 'text-white' : 'text-gray-900'
                  ]">{{ user.chuniProfile.playCount }}</span>
                </div>
              </div>
            </div>

            <!-- 最后游玩时间 -->
            <div :class="[
              'text-xs',
              isDark ? 'text-gray-400' : 'text-gray-500'
            ]">
              最后游玩: {{ user.chuniProfile.lastPlayDate || '未记录' }}
            </div>
          </div>
        </div>

        <!-- 桌面端表格视图 -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="w-full">
            <thead :class="[
              'border-b text-sm font-medium',
              isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
            ]">
              <tr>
                <th class="px-4 py-3 text-center w-20">ID</th>
                <th class="px-4 py-3 text-center w-28">用户名</th>
                <th class="px-4 py-3 text-center w-40">玩家名</th>
                <th class="px-4 py-3 text-center w-20">等级</th>
                <th class="px-4 py-3 text-center w-24">Rating</th>
                <th class="px-4 py-3 text-center w-24">游玩次数</th>
                <th class="px-4 py-3 text-center w-32">AIME卡</th>
                <th class="px-4 py-3 text-center w-32">最后游玩</th>
                <th class="px-4 py-3 text-center w-24">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in users"
                :key="user.id"
                :class="[
                  'border-b transition-colors cursor-pointer',
                  isDark
                    ? 'border-gray-700 hover:bg-gray-700 text-gray-300'
                    : 'border-gray-100 hover:bg-gray-50 text-gray-900'
                ]"
                @click="selectUser(user)"
              >
                <td class="px-4 py-4 text-center text-sm font-medium">
                  {{ user.id }}
                </td>
                <td class="px-4 py-4 text-center">
                  <div :class="[
                    'font-medium text-sm',
                    isDark ? 'text-white' : 'text-gray-900'
                  ]">{{ user.username }}</div>
                </td>
                <td class="px-4 py-4 text-center">
                  <span :class="[
                    'text-sm',
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  ]">{{ user.chuniProfile.playerName || '-' }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span :class="[
                    'text-sm font-medium',
                    isDark ? 'text-white' : 'text-gray-900'
                  ]">{{ user.chuniProfile.level }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span :class="[
                    'text-sm font-medium',
                    isDark ? 'text-white' : 'text-gray-900'
                  ]">{{ user.chuniProfile.playerRating }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span :class="[
                    'text-sm',
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  ]">{{ user.chuniProfile.playCount }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <div v-if="user.aimeCard" :class="[
                    'font-mono text-xs px-2 py-1 rounded inline-block',
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  ]">
                    {{ user.aimeCard }}
                  </div>
                  <span v-else :class="[
                    'text-xs',
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  ]">-</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span :class="[
                    'text-xs',
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  ]">{{ formatDateTime(user.chuniProfile.lastPlayDate) }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <el-button
                    size="small"
                    type="primary"
                    @click.stop="selectUser(user)"
                  >
                    <span class="material-icons text-sm mr-1">visibility</span>
                    查看详情
                  </el-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { chuniApi, type ChuniUser } from '@/api/chuni'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const { isDark } = useTheme()

const searchQuery = ref('')
const users = ref<ChuniUser[]>([])
const loading = ref(false)
const totalCount = ref(0)
const isSearching = ref(false)

// 加载所有CHUNITHM用户数据
const loadData = async () => {
  loading.value = true
  isSearching.value = false

  try {
    const data = await chuniApi.getAllChuniUsers()
    users.value = data
    totalCount.value = data.length
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载数据失败')
    users.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

// 搜索用户（筛选功能）
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    // 如果搜索框为空，重新加载所有数据
    loadData()
    return
  }

  loading.value = true
  isSearching.value = true

  try {
    const query = searchQuery.value.trim().toLowerCase()

    // 前端筛选已有数据
    const allUsers = await chuniApi.getAllChuniUsers()

    users.value = allUsers.filter(user => {
      const idMatch = user.id.toString().includes(query)
      const usernameMatch = user.username.toLowerCase().includes(query)
      const aimeCardMatch = user.aimeCard && user.aimeCard.includes(query)
      const playerNameMatch = user.chuniProfile.playerName &&
        user.chuniProfile.playerName.toLowerCase().includes(query)

      return idMatch || usernameMatch || aimeCardMatch || playerNameMatch
    })

    totalCount.value = users.value.length
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '搜索失败')
    users.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

// 选择用户查看详情
const selectUser = (user: ChuniUser) => {
  router.push(`/data-manage/${user.id}`)
}

// 格式化日期时间
const formatDateTime = (dateString: string | undefined) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 页面加载时自动加载数据
onMounted(() => {
  loadData()
})
</script>
