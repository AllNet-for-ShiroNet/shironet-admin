<template>
  <div class="space-y-4 sm:space-y-6 px-2 sm:px-0">
    <!-- 页面标题和操作栏 -->
    <div :class="[
      'p-4 sm:p-6 rounded-lg border',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ]">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 :class="[
            'text-xl sm:text-2xl font-bold',
            isDark ? 'text-white' : 'text-gray-900'
          ]">狗号管理</h2>
          <p :class="[
            'text-xs sm:text-sm mt-1',
            isDark ? 'text-gray-400' : 'text-gray-500'
          ]">管理游戏账号信息和状态</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-button @click="expandAll" size="small" class="text-xs sm:text-sm">
            <span class="material-icons mr-1 text-sm">expand_more</span>
            <span class="hidden sm:inline">展开全部</span>
            <span class="sm:hidden">展开</span>
          </el-button>
          <el-button @click="collapseAll" size="small" class="text-xs sm:text-sm">
            <span class="material-icons mr-1 text-sm">expand_less</span>
            <span class="hidden sm:inline">收起全部</span>
            <span class="sm:hidden">收起</span>
          </el-button>
          <el-button type="primary" @click="showAddDialog = true" size="small" class="text-xs sm:text-sm">
            <span class="material-icons mr-1 sm:mr-2 text-sm">add</span>
            <span class="hidden sm:inline">新增狗号</span>
            <span class="sm:hidden">新增</span>
          </el-button>
          <el-button @click="generateRandomAccount" plain size="small" class="text-xs sm:text-sm">
            <span class="material-icons mr-1 sm:mr-2 text-sm">auto_fix_high</span>
            <span class="hidden sm:inline">快速生成</span>
            <span class="sm:hidden">生成</span>
          </el-button>
          <el-button @click="refreshData" :loading="loading" size="small" class="text-xs sm:text-sm">
            <span class="material-icons mr-1 text-sm">refresh</span>
            <span class="hidden sm:inline">刷新</span>
            <span class="sm:hidden">刷新</span>
          </el-button>
        </div>
      </div>
      
      <!-- 搜索和筛选区域 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <el-input
          v-model="searchQuery"
          placeholder="搜索账号或备注..."
          clearable
          size="default"
          @input="handleSearch"
        >
          <template #prefix>
            <span class="material-icons text-gray-400">search</span>
          </template>
        </el-input>
        
        <el-select 
          v-model="gameFilter" 
          placeholder="游戏筛选" 
          clearable
          size="default"
          @change="handleSearch"
        >
          <el-option label="SDHD" value="SDHD" />
          <el-option label="SDEZ" value="SDEZ" />
          <el-option label="SDDT" value="SDDT" />
        </el-select>
        
        <el-select 
          v-model="statusFilter" 
          placeholder="状态筛选" 
          clearable
          size="default"
          @change="handleSearch"
        >
          <el-option label="OTA启用" value="ota_enabled" />
          <el-option label="OTA禁用" value="ota_disabled" />
          <el-option label="CAB启用" value="cab_enabled" />
          <el-option label="CAB禁用" value="cab_disabled" />
        </el-select>
        
        <el-button @click="resetFilters" class="text-xs sm:text-sm">
          <span class="material-icons mr-1 text-sm">refresh</span>
          重置筛选
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-8">
      <el-icon class="is-loading text-2xl"><Loading /></el-icon>
      <p class="mt-2 text-gray-500">加载中...</p>
    </div>

    <!-- 空数据提示 -->
    <div v-else-if="!filteredGroups.length" :class="[
      'text-center py-12 rounded-lg border',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ]">
      <span class="material-icons text-4xl mb-4" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        inbox
      </span>
      <p :class="['text-lg mb-2', isDark ? 'text-gray-300' : 'text-gray-600']">
        {{ searchQuery || gameFilter || statusFilter ? '没有找到匹配的账号' : '暂无账号数据' }}
      </p>
      <p :class="['text-sm', isDark ? 'text-gray-400' : 'text-gray-500']">
        {{ searchQuery || gameFilter || statusFilter ? '请尝试调整筛选条件' : '点击"新增狗号"添加第一个账号' }}
      </p>
    </div>

    <!-- 分组账号列表 -->
    <div v-else class="space-y-3 sm:space-y-4">
      <div
        v-for="group in filteredGroups"
        :key="group.name"
        :class="[
          'rounded-lg border overflow-hidden',
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        ]"
      >
        <!-- 分组头部 -->
        <div 
          @click="toggleGroup(group.name)"
          :class="[
            'flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 cursor-pointer transition-colors hover:bg-opacity-80',
            isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-slate-100 hover:bg-slate-200'
          ]"
        >
          <div class="flex items-center space-x-2 min-w-0 flex-1">
            <span 
              :class="[
                'material-icons transition-transform duration-200 flex-shrink-0',
                'text-lg sm:text-base',
                expandedGroups.includes(group.name) ? 'rotate-0' : '-rotate-90',
                isDark ? 'text-gray-200' : 'text-gray-700'
              ]"
            >
              keyboard_arrow_down
            </span>
            <h3 :class="[
              'text-sm sm:text-base font-medium truncate',
              isDark ? 'text-white' : 'text-gray-900'
            ]">
              {{ group.displayName || group.name }}
            </h3>
            <span :class="[
              'text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 min-w-[20px] text-center',
              isDark ? 'bg-gray-600 text-gray-200' : 'bg-slate-200 text-slate-700'
            ]">
              {{ group.accounts?.length || 0 }}
            </span>
          </div>
        </div>

        <!-- 分组内容 -->
        <div 
          v-show="expandedGroups.includes(group.name)"
          class="transition-all duration-300"
        >
          <!-- 桌面端表格头部 -->
          <div :class="[
            'hidden lg:block border-b',
            isDark ? 'border-gray-600' : 'border-gray-200'
          ]">
            <div :class="[
              'grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium',
              isDark ? 'text-gray-200 bg-gray-750' : 'text-gray-800 bg-gray-100'
            ]">
              <div class="col-span-2">Serial</div>
              <div class="col-span-1">Game</div>
              <div class="col-span-1">Country</div>
              <div class="col-span-2">OTA Enable</div>
              <div class="col-span-2">Is CAB</div>
              <div class="col-span-2">备注</div>
              <div class="col-span-2">操作</div>
            </div>
          </div>

          <!-- 账号列表 -->
          <div v-if="group.accounts && group.accounts.length > 0" 
               class="divide-y" 
               :class="isDark ? 'divide-gray-600' : 'divide-gray-200'">
            <div
              v-for="account in group.accounts"
              :key="account.serial"
              :class="[
                'p-3 sm:p-4 transition-colors',
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              ]"
            >
              <!-- 桌面端布局 -->
              <div class="hidden lg:grid grid-cols-12 gap-4 items-center">
                <div class="col-span-2">
                  <span :class="[
                    'font-mono text-sm font-medium',
                    isDark ? 'text-gray-100' : 'text-gray-800'
                  ]">{{ account.serial || '-' }}</span>
                </div>
                <div class="col-span-1">
                  <span :class="[
                    'text-sm font-medium',
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  ]">{{ account.game || '-' }}</span>
                </div>
                <div class="col-span-1">
                  <span :class="[
                    'text-sm font-medium',
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  ]">{{ account.country || '-' }}</span>
                </div>
                <div class="col-span-2">
                  <el-tag 
                    :type="getOtaStatus(account) ? 'success' : 'danger'" 
                    size="small"
                  >
                    {{ getOtaStatus(account) ? '启用' : '禁用' }}
                  </el-tag>
                </div>
                <div class="col-span-2">
                  <el-tag 
                    :type="getCabStatus(account) ? 'success' : 'danger'" 
                    size="small"
                  >
                    {{ getCabStatus(account) ? '启用' : '禁用' }}
                  </el-tag>
                </div>
                <div class="col-span-2">
                  <span :class="[
                    'text-sm',
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  ]">{{ account.note || '-' }}</span>
                </div>
                <div class="col-span-2">
                  <div class="flex items-center space-x-1">
                    <el-button 
                      size="small" 
                      type="primary" 
                      @click="editAccount(account, group.name)"
                      class="!w-8 !h-8 !p-0"
                    >
                      <span class="material-icons text-sm">edit</span>
                    </el-button>
                    <el-button 
                      size="small" 
                      type="danger" 
                      @click="deleteAccount(account)"
                      class="!w-8 !h-8 !p-0"
                    >
                      <span class="material-icons text-sm">delete</span>
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- 移动端布局 -->
              <div class="block lg:hidden">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span :class="[
                      'font-mono text-sm font-medium',
                      isDark ? 'text-gray-100' : 'text-gray-800'
                    ]">{{ account.serial || '-' }}</span>
                    <div class="flex items-center space-x-1">
                      <el-button 
                        size="small" 
                        type="primary" 
                        @click="editAccount(account, group.name)"
                        class="!w-7 !h-7 !p-0"
                      >
                        <span class="material-icons text-xs">edit</span>
                      </el-button>
                      <el-button 
                        size="small" 
                        type="danger" 
                        @click="deleteAccount(account)"
                        class="!w-7 !h-7 !p-0"
                      >
                        <span class="material-icons text-xs">delete</span>
                      </el-button>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span :class="[
                        'text-xs font-medium',
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      ]">游戏:</span>
                      <span :class="[
                        'ml-1',
                        isDark ? 'text-gray-200' : 'text-gray-700'
                      ]">{{ account.game || '-' }}</span>
                    </div>
                    <div>
                      <span :class="[
                        'text-xs font-medium',
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      ]">国家:</span>
                      <span :class="[
                        'ml-1',
                        isDark ? 'text-gray-200' : 'text-gray-700'
                      ]">{{ account.country || '-' }}</span>
                    </div>
                  </div>
                  
                  <div class="flex items-center space-x-3">
                    <div class="flex items-center space-x-1">
                      <span :class="[
                        'text-xs font-medium',
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      ]">OTA:</span>
                      <el-tag 
                        :type="getOtaStatus(account) ? 'success' : 'danger'" 
                        size="small"
                      >
                        {{ getOtaStatus(account) ? '启用' : '禁用' }}
                      </el-tag>
                    </div>
                    <div class="flex items-center space-x-1">
                      <span :class="[
                        'text-xs font-medium',
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      ]">CAB:</span>
                      <el-tag 
                        :type="getCabStatus(account) ? 'success' : 'danger'" 
                        size="small"
                      >
                        {{ getCabStatus(account) ? '启用' : '禁用' }}
                      </el-tag>
                    </div>
                  </div>
                  
                  <div v-if="account.note">
                    <span :class="[
                      'text-xs font-medium',
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    ]">备注:</span>
                    <span :class="[
                      'ml-1 text-sm',
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    ]">{{ account.note }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 空数据提示 -->
          <div v-else class="p-8 text-center">
            <p :class="['text-sm', isDark ? 'text-gray-400' : 'text-gray-500']">
              该分组暂无账号
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑账号对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingAccount ? '编辑账号' : '添加账号'"
      :width="isMobile ? '95%' : '500px'"
      align-center
      @closed="resetForm"
    >
      <el-form
        ref="accountFormRef"
        :model="accountForm"
        :rules="accountRules"
        :label-width="isMobile ? '80px' : '100px'"
      >
        <el-form-item label="Serial" prop="serial">
          <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <el-input 
              v-model="accountForm.serial" 
              class="flex-1"
              :disabled="!!editingAccount"
            />
            <el-button 
              @click="generateSerial" 
              type="primary" 
              plain 
              :size="isMobile ? 'small' : 'default'"
              :disabled="!!editingAccount"
            >
              <span class="material-icons mr-1 text-sm">casino</span>
              <span class="hidden sm:inline">随机生成</span>
              <span class="sm:hidden">生成</span>
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="Game" prop="game">
          <el-select v-model="accountForm.game" class="w-full">
            <el-option label="SDHD" value="SDHD" />
            <el-option label="SDEZ" value="SDEZ" />
            <el-option label="SDDT" value="SDDT" />
          </el-select>
        </el-form-item>
        <el-form-item label="Country" prop="country">
          <el-select v-model="accountForm.country" class="w-full">
            <el-option label="JPN" value="JPN" />
            <el-option label="USA" value="USA" />
            <el-option label="CHN" value="CHN" />
          </el-select>
        </el-form-item>
        <el-form-item label="分组" prop="group">
          <el-select v-model="accountForm.group" class="w-full">
            <el-option 
              v-for="group in availableGroups" 
              :key="group.name"
              :label="group.displayName || group.name" 
              :value="group.name" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="memo">
          <el-input v-model="accountForm.memo" placeholder="可选" />
        </el-form-item>
        <el-form-item label="状态设置">
          <div class="space-y-2">
            <el-checkbox v-model="accountForm.ota_enable">启用 OTA</el-checkbox>
            <el-checkbox v-model="accountForm.is_cab">启用 CAB</el-checkbox>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="text-center space-x-2">
          <el-button @click="showAddDialog = false" :size="isMobile ? 'small' : 'default'">
            取消
          </el-button>
          <el-button 
            type="primary" 
            @click="saveAccount" 
            :loading="saving"
            :size="isMobile ? 'small' : 'default'"
          >
            {{ editingAccount ? '更新' : '添加' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, inject, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { keychipApi, type Account, type AccountGroup } from '@/api/keychip'

const showAddDialog = ref(false)
const editingAccount = ref<Account | null>(null)
const editingGroupName = ref('')
const searchQuery = ref('')
const gameFilter = ref('')
const statusFilter = ref('')
const expandedGroups = ref<string[]>([])
const isMobile = ref(false)
const loading = ref(false)
const saving = ref(false)
const accountFormRef = ref()

// 从父组件获取主题状态
const isDark = inject('isDark', ref(false))

// 数据存储
const accountGroups = ref<AccountGroup[]>([])
const availableGroups = computed(() => {
  // 确保返回有效的分组列表
  return accountGroups.value.filter(g => g && g.name)
})

// 检测屏幕尺寸
const checkMobile = () => {
  isMobile.value = window.innerWidth < 640
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  loadData()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 表单数据类型定义
interface AccountForm {
  serial: string
  game: string
  country: string
  group: string
  memo: string
  ota_enable: boolean
  is_cab: boolean
}

const accountForm = reactive<AccountForm>({
  serial: '',
  game: 'SDHD',
  country: 'JPN',
  group: 'other',
  memo: '',
  ota_enable: false,
  is_cab: false
})

const accountRules = {
  serial: [
    { required: true, message: '请输入Serial', trigger: 'blur' },
    { pattern: /^[A-Z0-9]+$/, message: 'Serial只能包含大写字母和数字', trigger: 'blur' }
  ],
  game: [
    { required: true, message: '请选择游戏', trigger: 'change' }
  ],
  country: [
    { required: true, message: '请选择国家', trigger: 'change' }
  ],
  group: [
    { required: true, message: '请选择分组', trigger: 'change' }
  ]
}

// 获取OTA状态
const getOtaStatus = (account: Account): boolean => {
  return account.otaEnable ?? false
}

// 获取CAB状态
const getCabStatus = (account: Account): boolean => {
  return account.isCab ?? false
}

// 数据加载
const loadData = async () => {
  loading.value = true
  try {
    const data = await keychipApi.getAccountGroups()
    
    // 数据验证和清理
    accountGroups.value = (data || []).filter(group => {
      // 过滤掉无效的分组
      if (!group || !group.name) return false
      
      // 确保accounts是数组
      if (!Array.isArray(group.accounts)) {
        group.accounts = []
      }
      
      // 过滤掉无效的账号
      group.accounts = group.accounts.filter(account => {
        return account && account.serial
      })
      
      return true
    })
    
    // 默认展开有数据的分组
    await nextTick()
    expandedGroups.value = accountGroups.value
      .filter(g => g.accounts && g.accounts.length > 0)
      .map(g => g.name)
      
  } catch (error: any) {
    console.error('加载数据失败:', error)
    ElMessage.error(error.message || '加载数据失败')
    // 初始化为空数组避免显示错误
    accountGroups.value = []
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = async () => {
  await loadData()
  ElMessage.success('数据刷新成功')
}

// 搜索处理
const handleSearch = () => {
  // 触发计算属性重新计算
}

// 筛选逻辑
const filteredGroups = computed(() => {
  if (!accountGroups.value || accountGroups.value.length === 0) {
    return []
  }

  let groups = accountGroups.value.map(group => {
    // 深拷贝分组对象
    const filteredGroup = { ...group }
    
    // 如果没有筛选条件，返回原始分组
    if (!searchQuery.value && !gameFilter.value && !statusFilter.value) {
      return filteredGroup
    }
    
    // 过滤账号
    filteredGroup.accounts = (group.accounts || []).filter(account => {
      if (!account) return false
      
      let matches = true

      // 搜索过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        matches = matches && (
          (account.serial && account.serial.toLowerCase().includes(query)) ||
          (account.note && account.note.toLowerCase().includes(query))
        )
      }

      // 游戏过滤
      if (gameFilter.value) {
        matches = matches && account.game === gameFilter.value
      }

      // 状态过滤 - 修复逻辑
      if (statusFilter.value) {
        const otaStatus = getOtaStatus(account)
        const cabStatus = getCabStatus(account)
        
        switch(statusFilter.value) {
          case 'ota_enabled':
            matches = matches && otaStatus
            break
          case 'ota_disabled':
            matches = matches && !otaStatus
            break
          case 'cab_enabled':
            matches = matches && cabStatus
            break
          case 'cab_disabled':
            matches = matches && !cabStatus
            break
        }
      }

      return matches
    })
    
    return filteredGroup
  })

  // 过滤掉没有账号的分组（仅在有筛选条件时）
  if (searchQuery.value || gameFilter.value || statusFilter.value) {
    groups = groups.filter(group => group.accounts && group.accounts.length > 0)
  }

  return groups
})

// 分组操作
const toggleGroup = (groupName: string) => {
  const index = expandedGroups.value.indexOf(groupName)
  if (index > -1) {
    expandedGroups.value.splice(index, 1)
  } else {
    expandedGroups.value.push(groupName)
  }
}

const expandAll = () => {
  expandedGroups.value = accountGroups.value.map(g => g.name)
}

const collapseAll = () => {
  expandedGroups.value = []
}

const resetFilters = () => {
  searchQuery.value = ''
  gameFilter.value = ''
  statusFilter.value = ''
}

// 重置表单
const resetForm = () => {
  editingAccount.value = null
  editingGroupName.value = ''
  
  Object.assign(accountForm, {
    serial: '',
    game: 'SDHD',
    country: 'JPN',
    group: 'other',
    memo: '',
    ota_enable: false,
    is_cab: false
  })
  
  // 清除表单验证状态
  if (accountFormRef.value) {
    accountFormRef.value.clearValidate()
  }
}

// 生成随机Serial号码
const generateSerial = () => {
  const prefix = 'A65E'
  const digit1 = Math.floor(Math.random() * 10)
  const digit2 = Math.floor(Math.random() * 10)
  const validLetters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const randomLetter = validLetters[Math.floor(Math.random() * validLetters.length)]
  
  let eightDigits = ''
  for (let i = 0; i < 8; i++) {
    eightDigits += Math.floor(Math.random() * 10)
  }
  
  const serial = `${prefix}${digit1}${digit2}${randomLetter}${eightDigits}`
  accountForm.serial = serial
}

// 快速生成随机账号
const generateRandomAccount = () => {
  resetForm()
  generateSerial()
  
  const games = ['SDHD', 'SDEZ', 'SDDT']
  accountForm.game = games[Math.floor(Math.random() * games.length)]
  
  const countries = ['JPN', 'USA', 'CHN']
  accountForm.country = countries[Math.floor(Math.random() * countries.length)]
  
  // 确保有可用的分组
  if (availableGroups.value.length > 0) {
    const groups = availableGroups.value.map(g => g.name)
    accountForm.group = groups[Math.floor(Math.random() * groups.length)]
  }
  
  const notes = ['测试账号', '开发用途', '临时使用', 'Demo账号', '用户测试']
  accountForm.memo = notes[Math.floor(Math.random() * notes.length)]
  
  accountForm.ota_enable = Math.random() > 0.5
  accountForm.is_cab = Math.random() > 0.5
  
  showAddDialog.value = true
}

// 编辑账号
const editAccount = (account: Account, groupName: string) => {
  editingAccount.value = account
  editingGroupName.value = groupName
  
  Object.assign(accountForm, {
    serial: account.serial || '',
    game: account.game || 'SDHD',
    country: account.country || 'JPN',
    group: groupName,
    memo: account.note || '',
    ota_enable: account.otaEnable ?? false,
    is_cab: account.isCab ?? false
  })
  
  showAddDialog.value = true
}

// 删除账号
const deleteAccount = async (account: Account) => {
  if (!account.serial) {
    ElMessage.error('账号Serial无效')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除账号 ${account.serial} 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    await keychipApi.deleteMachine(account.serial)
    ElMessage.success('账号删除成功')
    await loadData() // 重新加载数据
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 保存账号
const saveAccount = async () => {
  // 表单验证
  try {
    await accountFormRef.value?.validate()
  } catch {
    return
  }
  
  saving.value = true
  
  try {
    if (editingAccount.value) {
      // 更新账号 - 不包含 serial
      const payload = {
        game: accountForm.game,
        country: accountForm.country,
        arcadeName: accountForm.group,
        memo: accountForm.memo,
        ota_enable: accountForm.ota_enable,
        is_cab: accountForm.is_cab
      }
      await keychipApi.updateMachine(editingAccount.value.serial, payload)
      ElMessage.success('账号更新成功')
    } else {
      // 添加新账号 - 包含 serial
      const payload = {
        serial: accountForm.serial,
        game: accountForm.game,
        country: accountForm.country,
        arcadeName: accountForm.group,
        memo: accountForm.memo,
        ota_enable: accountForm.ota_enable,
        is_cab: accountForm.is_cab
      }
      await keychipApi.createMachine(payload)
      ElMessage.success('账号添加成功')
    }
    
    showAddDialog.value = false
    resetForm()
    
    // 重新加载数据
    await loadData()
  } catch (error: any) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>