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
          ]">兑换码管理</h2>
          <p :class="[
            'text-xs sm:text-sm mt-1',
            isDark ? 'text-gray-400' : 'text-gray-500'
          ]">管理游戏兑换码和奖励物品</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-button type="primary" @click="showAddDialog = true" size="small" class="text-xs sm:text-sm">
            <span class="material-icons mr-1 sm:mr-2 text-sm">add</span>
            <span class="hidden sm:inline">创建兑换码</span>
            <span class="sm:hidden">创建</span>
          </el-button>
          <el-button @click="generateBatchCodes" plain size="small" class="text-xs sm:text-sm">
            <span class="material-icons mr-1 sm:mr-2 text-sm">auto_fix_high</span>
            <span class="hidden sm:inline">批量生成</span>
            <span class="sm:hidden">批量</span>
          </el-button>
        </div>
      </div>
      
      <!-- 搜索和筛选区域 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <el-input
          v-model="searchQuery"
          placeholder="搜索兑换码..."
          clearable
          size="default"
        >
          <template #prefix>
            <span class="material-icons text-gray-400">search</span>
          </template>
        </el-input>
        
        <el-select 
          v-model="statusFilter" 
          placeholder="状态筛选" 
          clearable
          size="default"
        >
          <el-option label="活跃" value="active" />
          <el-option label="已禁用" value="disabled" />
          <el-option label="已过期" value="expired" />
        </el-select>
        
        <el-select 
          v-model="rewardFilter" 
          placeholder="奖励类型" 
          clearable
          size="default"
        >
          <el-option label="游戏币" value="coins" />
          <el-option label="道具" value="items" />
          <el-option label="经验" value="exp" />
          <el-option label="皮肤" value="skin" />
        </el-select>
        
        <el-button @click="resetFilters" class="text-xs sm:text-sm">
          <span class="material-icons mr-1 text-sm">refresh</span>
          重置筛选
        </el-button>
      </div>
    </div>

    <!-- 移动端卡片视图 -->
    <div class="block lg:hidden">
      <div v-loading="loading" class="space-y-3">
        <div
          v-for="code in paginatedCodes"
          :key="code.id"
          :class="[
            'p-4 rounded-lg border',
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          ]"
        >
          <!-- 兑换码头部 -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center mb-2">
                <h3 :class="[
                  'font-mono font-medium text-sm sm:text-base truncate flex-1',
                  isDark ? 'text-white' : 'text-gray-900'
                ]">{{ code.code }}</h3>
                <el-button 
                  size="small" 
                  text 
                  @click="copyCode(code.code)"
                  class="!w-6 !h-6 !p-0 ml-2 flex-shrink-0"
                >
                  <span class="material-icons text-xs">content_copy</span>
                </el-button>
              </div>
              <div class="flex items-center space-x-2 mb-2">
                <el-tag 
                  :type="getStatusType(code)" 
                  size="small"
                >
                  {{ getStatusLabel(code) }}
                </el-tag>
                <span :class="[
                  'text-xs',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                ]">ID: {{ code.itemId }}</span>
              </div>
            </div>
          </div>

          <!-- 物品信息 -->
          <div class="grid grid-cols-2 gap-3 mb-3 text-sm">
            <div>
              <div :class="[
                'text-xs font-medium mb-1',
                isDark ? 'text-gray-400' : 'text-gray-500'
              ]">类型/数量</div>
              <div :class="[
                isDark ? 'text-gray-300' : 'text-gray-700'
              ]">{{ code.itemKind }} / {{ code.amount }}</div>
            </div>
            <div>
              <div :class="[
                'text-xs font-medium mb-1',
                isDark ? 'text-gray-400' : 'text-gray-500'
              ]">使用次数</div>
              <div :class="[
                isDark ? 'text-gray-300' : 'text-gray-700'
              ]">{{ code.maxUserUses || '无限' }}</div>
            </div>
          </div>

          <!-- 使用进度 -->
          <div class="mb-3">
            <div class="flex items-center justify-between mb-1">
              <span :class="[
                'text-xs font-medium',
                isDark ? 'text-gray-400' : 'text-gray-500'
              ]">全局使用进度</span>
              <span :class="[
                'text-xs font-medium',
                isDark ? 'text-gray-300' : 'text-gray-700'
              ]">{{ code.usedCount }}/{{ code.maxGlobalUses || '∞' }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: getUsagePercentage(code) + '%' }"
              ></div>
            </div>
          </div>

          <!-- 时间信息 -->
          <div class="grid grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <div :class="[
                'font-medium mb-1',
                isDark ? 'text-gray-400' : 'text-gray-500'
              ]">创建时间</div>
              <div :class="[
                isDark ? 'text-gray-300' : 'text-gray-600'
              ]">{{ formatDate(code.createdAt) }}</div>
            </div>
            <div>
              <div :class="[
                'font-medium mb-1',
                isDark ? 'text-gray-400' : 'text-gray-500'
              ]">过期时间</div>
              <div :class="[
                isExpired(code.endTime) ? 'text-red-500' : isDark ? 'text-gray-300' : 'text-gray-600'
              ]">{{ code.endTime ? formatDate(code.endTime) : '永不过期' }}</div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-end space-x-2">
            <el-button 
              size="small" 
              type="primary" 
              @click="editCode(code)"
            >
              <span class="material-icons text-sm mr-1">edit</span>
              编辑
            </el-button>
            <el-button 
              size="small" 
              :type="code.isActive ? 'warning' : 'success'" 
              @click="toggleCodeStatus(code)"
            >
              <span class="material-icons text-sm mr-1">
                {{ code.isActive ? 'pause' : 'play_arrow' }}
              </span>
              {{ code.isActive ? '禁用' : '启用' }}
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteCode(code)"
            >
              <span class="material-icons text-sm">delete</span>
            </el-button>
          </div>
        </div>

        <!-- 移动端空状态 -->
        <div 
          v-if="filteredCodes.length === 0 && !loading"
          :class="[
            'text-center py-12',
            isDark ? 'text-gray-400' : 'text-gray-500'
          ]"
        >
          <span class="material-icons text-4xl mb-4 block opacity-50">redeem</span>
          <p>暂无兑换码数据</p>
        </div>
      </div>

      <!-- 移动端分页 -->
      <div 
        v-if="filteredCodes.length > 0" 
        :class="[
          'mt-4 p-4 rounded-lg border flex flex-col items-center space-y-3',
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        ]"
      >
        <p :class="[
          'text-sm',
          isDark ? 'text-gray-400' : 'text-gray-500'
        ]">
          共 {{ total }} 个兑换码
        </p>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="sizes, prev, pager, next"
          small
          background
        />
      </div>
    </div>

    <!-- 桌面端表格视图 -->
    <div :class="[
      'hidden lg:block rounded-lg border',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ]">
      <div class="overflow-x-auto">
        <table class="w-full">
          <!-- 表头 -->
          <thead :class="[
            'border-b text-sm font-medium',
            isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-slate-100 border-gray-200 text-gray-800'
          ]">
            <tr>
              <th class="px-4 py-3 text-center w-32">兑换码</th>
              <th class="px-4 py-3 text-center w-24">物品ID</th>
              <th class="px-4 py-3 text-center w-24">物品类型</th>
              <th class="px-4 py-3 text-center w-24">数量</th>
              <th class="px-4 py-3 text-center w-24">个人使用次数</th>
              <th class="px-4 py-3 text-center w-24">全局限制</th>
              <th class="px-4 py-3 text-center w-20">状态</th>
              <th class="px-4 py-3 text-center w-32">创建时间</th>
              <th class="px-4 py-3 text-center w-32">过期时间</th>
              <th class="px-4 py-3 text-center w-24">操作</th>
            </tr>
          </thead>
          
          <!-- 表体 -->
          <tbody v-loading="loading">
            <tr 
              v-for="code in paginatedCodes" 
              :key="code.id"
              :class="[
                'border-b transition-colors hover:cursor-pointer',
                isDark 
                  ? 'border-gray-700 hover:bg-gray-700 text-gray-300' 
                  : 'border-gray-100 hover:bg-gray-50 text-gray-900'
              ]"
            >
              <!-- 兑换码 -->
              <td class="px-4 py-4 text-center">
                <div class="flex items-center justify-center space-x-2">
                  <span :class="[
                    'font-mono font-medium text-sm',
                    isDark ? 'text-gray-100' : 'text-gray-800'
                  ]">{{ code.code }}</span>
                  <el-button 
                    size="small" 
                    text 
                    @click="copyCode(code.code)"
                    class="!w-6 !h-6 !p-0"
                  >
                    <span class="material-icons text-xs">content_copy</span>
                  </el-button>
                </div>
              </td>
              
              <!-- 物品ID -->
              <td class="px-4 py-4 text-center">
                <span :class="[
                  'text-sm font-medium',
                  isDark ? 'text-gray-200' : 'text-gray-700'
                ]">{{ code.itemId }}</span>
              </td>
              
              <!-- 物品类型 -->
              <td class="px-4 py-4 text-center">
                <span :class="[
                  'text-sm',
                  isDark ? 'text-gray-200' : 'text-gray-700'
                ]">{{ code.itemKind }}</span>
              </td>
              
              <!-- 数量 -->
              <td class="px-4 py-4 text-center">
                <span :class="[
                  'text-sm font-medium',
                  isDark ? 'text-gray-200' : 'text-gray-700'
                ]">{{ code.amount }}</span>
              </td>
              
              <!-- 个人使用次数 -->
              <td class="px-4 py-4 text-center">
                <span :class="[
                  'text-sm',
                  isDark ? 'text-gray-200' : 'text-gray-700'
                ]">{{ code.maxUserUses || '无限制' }}</span>
              </td>
              
              <!-- 全局限制 -->
              <td class="px-4 py-4 text-center">
                <div class="flex flex-col items-center">
                  <span :class="[
                    'text-sm font-medium',
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  ]">{{ code.usedCount }}/{{ code.maxGlobalUses || '∞' }}</span>
                  <div class="w-16 bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      class="bg-blue-500 h-1 rounded-full transition-all duration-300"
                      :style="{ width: getUsagePercentage(code) + '%' }"
                    ></div>
                  </div>
                </div>
              </td>
              
              <!-- 状态 -->
              <td class="px-4 py-4 text-center">
                <el-tag 
                  :type="getStatusType(code)" 
                  size="small"
                >
                  {{ getStatusLabel(code) }}
                </el-tag>
              </td>
              
              <!-- 创建时间 -->
              <td class="px-4 py-4 text-center">
                <span :class="[
                  'text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                ]">{{ formatDate(code.createdAt) }}</span>
              </td>
              
              <!-- 过期时间 -->
              <td class="px-4 py-4 text-center">
                <span :class="[
                  'text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-500',
                  isExpired(code.endTime) ? 'text-red-500' : ''
                ]">{{ code.endTime ? formatDate(code.endTime) : '永不过期' }}</span>
              </td>
              
              <!-- 操作 -->
              <td class="px-4 py-4 text-center">
                <div class="flex items-center justify-center space-x-1">
                  <el-button 
                    size="small" 
                    type="primary" 
                    @click="editCode(code)"
                    class="!w-8 !h-8 !p-0"
                  >
                    <span class="material-icons text-sm">edit</span>
                  </el-button>
                  <el-button 
                    size="small" 
                    :type="code.isActive ? 'warning' : 'success'" 
                    @click="toggleCodeStatus(code)"
                    class="!w-8 !h-8 !p-0"
                  >
                    <span class="material-icons text-sm">
                      {{ code.isActive ? 'pause' : 'play_arrow' }}
                    </span>
                  </el-button>
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="deleteCode(code)"
                    class="!w-8 !h-8 !p-0"
                  >
                    <span class="material-icons text-sm">delete</span>
                  </el-button>
                </div>
              </td>
            </tr>

            <!-- 空状态 -->
            <tr v-if="filteredCodes.length === 0 && !loading">
              <td colspan="10" :class="[
                'text-center py-12',
                isDark ? 'text-gray-400' : 'text-gray-500'
              ]">
                <span class="material-icons text-4xl mb-4 block opacity-50">redeem</span>
                <p>暂无兑换码数据</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 桌面端分页 -->
      <div v-if="filteredCodes.length > 0" :class="[
        'px-6 py-4 border-t flex items-center justify-between',
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      ]">
        <p :class="[
          'text-sm',
          isDark ? 'text-gray-400' : 'text-gray-500'
        ]">
          共 {{ total }} 个兑换码
        </p>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="sizes, prev, pager, next"
          small
          background
        />
      </div>
    </div>

    <!-- 添加/编辑兑换码对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingCode ? '编辑兑换码' : '生成兑换码'"
      :width="isMobile ? '95%' : '500px'"
      align-center
    >
      <div class="space-y-4 sm:space-y-6">
        <!-- 兑换码输入 -->
        <div>
          <label class="text-sm text-gray-600 mb-2 block">兑换码</label>
          <el-input 
            v-model="codeForm.code" 
            placeholder="输入自定义兑换码或留空自动生成"
            class="mb-2"
          />
          <div class="flex items-center space-x-2">
            <el-button 
              @click="generateRandomCode" 
              type="primary" 
              text
              size="small"
            >
              随机生成兑换码
            </el-button>
          </div>
        </div>

        <!-- 物品ID -->
        <div>
          <label class="text-sm text-gray-600 mb-2 block">
            <span class="text-red-500">*</span> 物品ID
          </label>
          <div class="space-y-2">
            <el-select 
              v-model="selectedItemId" 
              placeholder="请选择物品ID"
              class="w-full"
              @change="updateItemInfo"
              clearable
            >
              <el-option label="金企鹅 (8000)" value="8000" />
              <el-option label="金企鹅 (8010)" value="8010" />
              <el-option label="金企鹅 (8020)" value="8020" />
              <el-option label="金企鹅 (8030)" value="8030" />
              <el-option label="自定义ID" value="custom" />
            </el-select>
            
            <!-- 自定义ID输入框 -->
            <el-input 
              v-if="selectedItemId === 'custom'"
              v-model="codeForm.itemId" 
              placeholder="请输入自定义物品ID"
              type="number"
            />
          </div>
        </div>

        <!-- 物品类型 -->
        <div>
          <label class="text-sm text-gray-600 mb-2 block">
            <span class="text-red-500">*</span> 物品类型
          </label>
          <div class="flex items-center space-x-2">
            <el-button @click="decreaseItemKind" size="small" :disabled="codeForm.itemKind <= 1">-</el-button>
            <el-input-number 
              v-model="codeForm.itemKind" 
              :min="1" 
              :controls="false"
              class="flex-1"
            />
            <el-button @click="increaseItemKind" size="small">+</el-button>
          </div>
        </div>

        <!-- 物品数量 -->
        <div>
          <label class="text-sm text-gray-600 mb-2 block">
            <span class="text-red-500">*</span> 物品数量
          </label>
          <div class="flex items-center space-x-2">
            <el-button @click="decreaseAmount" size="small" :disabled="codeForm.amount <= 1">-</el-button>
            <el-input-number 
              v-model="codeForm.amount" 
              :min="1" 
              :controls="false"
              class="flex-1"
            />
            <el-button @click="increaseAmount" size="small">+</el-button>
          </div>
        </div>

        <!-- 全局使用次数 -->
        <div>
          <label class="text-sm text-gray-600 mb-2 block">全局使用次数</label>
          <el-input-number
            v-model="codeForm.maxGlobalUses"
            :min="0"
            class="w-full"
            :size="isMobile ? 'small' : 'default'"
          />
          <p class="text-xs text-gray-500 mt-1">0表示不限制</p>
        </div>

        <!-- 用户使用次数 -->
        <div>
          <label class="text-sm text-gray-600 mb-2 block">用户使用次数</label>
          <el-input-number
            v-model="codeForm.maxUserUses"
            :min="0"
            class="w-full"
            :size="isMobile ? 'small' : 'default'"
          />
          <p class="text-xs text-gray-500 mt-1">0表示不限制</p>
        </div>

        <!-- 开始时间 -->
        <div>
          <label class="text-sm text-gray-600 mb-2 block">开始时间</label>
          <el-date-picker
            v-model="codeForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            class="w-full"
            :size="isMobile ? 'small' : 'default'"
          />
          <p class="text-xs text-gray-500 mt-1">留空表示立即生效</p>
        </div>

        <!-- 过期时间 -->
        <div>
          <label class="text-sm text-gray-600 mb-2 block">过期时间</label>
          <el-date-picker
            v-model="codeForm.endTime"
            type="datetime"
            placeholder="选择过期时间"
            class="w-full"
            :size="isMobile ? 'small' : 'default'"
          />
          <p class="text-xs text-gray-500 mt-1">留空表示永不过期</p>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end space-x-2">
          <el-button @click="cancelEdit" :size="isMobile ? 'small' : 'default'">取消</el-button>
          <el-button type="primary" @click="saveCode" :loading="saving" :size="isMobile ? 'small' : 'default'">
            {{ editingCode ? '更新' : '生成' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量生成对话框 -->
    <el-dialog
      v-model="showBatchDialog"
      title="批量生成兑换码"
      :width="isMobile ? '95%' : '500px'"
      align-center
    >
      <el-form
        :model="batchForm"
        :label-width="isMobile ? '80px' : '120px'"
      >
        <el-form-item label="生成数量">
          <el-input-number v-model="batchForm.count" :min="1" :max="100" class="w-full" />
        </el-form-item>
        
        <el-form-item label="码长度">
          <el-input-number v-model="batchForm.length" :min="10" :max="30" class="w-full" />
        </el-form-item>
        
        <el-form-item label="物品ID">
          <el-input-number v-model="batchForm.itemId" :min="1" class="w-full" />
        </el-form-item>
        
        <el-form-item label="物品类型">
          <el-input-number v-model="batchForm.itemKind" :min="1" class="w-full" />
        </el-form-item>
        
        <el-form-item label="物品数量">
          <el-input-number v-model="batchForm.amount" :min="1" class="w-full" />
        </el-form-item>
        
        <el-form-item label="全局使用次数">
          <el-input-number v-model="batchForm.maxGlobalUses" :min="0" class="w-full" />
          <p class="text-xs text-gray-500 mt-1">0表示不限制</p>
        </el-form-item>
        
        <el-form-item label="用户使用次数">
          <el-input-number v-model="batchForm.maxUserUses" :min="0" class="w-full" />
          <p class="text-xs text-gray-500 mt-1">0表示不限制</p>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="text-center space-x-2">
          <el-button @click="showBatchDialog = false" :size="isMobile ? 'small' : 'default'">取消</el-button>
          <el-button type="primary" @click="generateBatch" :loading="batchGenerating" :size="isMobile ? 'small' : 'default'">
            生成 {{ batchForm.count }} 个兑换码
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, inject, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { redeemApi, dataTransform, codeValidator, type RedemptionCode, type CreateRedemptionCodeRequest, type UpdateRedemptionCodeRequest, type BatchCreateRequest } from '@/api/redeem'

interface CodeForm {
  code: string
  itemId: number
  itemKind: number
  amount: number
  maxGlobalUses: number
  maxUserUses: number
  startTime: Date | null
  endTime: Date | null
}

const loading = ref(false)
const saving = ref(false)
const batchGenerating = ref(false)
const showAddDialog = ref(false)
const showBatchDialog = ref(false)
const editingCode = ref<RedemptionCode | null>(null)
const searchQuery = ref('')
const statusFilter = ref('')
const rewardFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const isMobile = ref(false)

// 从父组件获取主题状态
const isDark = inject('isDark', ref(false))

// 检测屏幕尺寸
const checkMobile = () => {
  isMobile.value = window.innerWidth < 640
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  fetchCodes()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const selectedItemId = ref('8000')

const codeForm = reactive<CodeForm>({
  code: '',
  itemId: 8000,
  itemKind: 1,
  amount: 1,
  maxGlobalUses: 1,
  maxUserUses: 1,
  startTime: null,
  endTime: null
})

const batchForm = reactive({
  count: 10,
  length: 20,
  itemId: 8000,
  itemKind: 1,
  amount: 100,
  maxGlobalUses: 1000,
  maxUserUses: 1
})

const redemptionCodes = ref<RedemptionCode[]>([])

// 获取兑换码列表
const fetchCodes = async () => {
  try {
    loading.value = true
    redemptionCodes.value = await redeemApi.getAllRedemptionCodes()
  } catch (error: any) {
    console.error('获取兑换码列表失败:', error)
    ElMessage.error(error.message || '获取兑换码列表失败')
  } finally {
    loading.value = false
  }
}

const filteredCodes = computed(() => {
  let filtered = redemptionCodes.value

  // 搜索过滤
  if (searchQuery.value) {
    filtered = filtered.filter(code => 
      code.code.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // 状态过滤
  if (statusFilter.value === 'active') {
    filtered = filtered.filter(code => code.isActive && !isExpired(code.endTime))
  } else if (statusFilter.value === 'disabled') {
    filtered = filtered.filter(code => !code.isActive)
  } else if (statusFilter.value === 'expired') {
    filtered = filtered.filter(code => isExpired(code.endTime))
  }

  return filtered
})

const total = computed(() => filteredCodes.value.length)

const paginatedCodes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredCodes.value.slice(start, end)
})

const formatDate = (dateStr: string) => {
  return dataTransform.formatDate(dateStr)
}

const getStatusType = (code: RedemptionCode) => {
  return dataTransform.getStatusType(code)
}

const getStatusLabel = (code: RedemptionCode) => {
  return dataTransform.getStatusLabel(code)
}

const getUsagePercentage = (code: RedemptionCode) => {
  return dataTransform.getUsagePercentage(code)
}

const isExpired = (endTime: string | null) => {
  return dataTransform.isExpired(endTime)
}

const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  codeForm.code = result
}

// 增减按钮功能
const decreaseAmount = () => {
  if (codeForm.amount > 1) codeForm.amount--
}

const increaseAmount = () => {
  codeForm.amount++
}

const decreaseItemKind = () => {
  if (codeForm.itemKind > 1) codeForm.itemKind--
}

const increaseItemKind = () => {
  codeForm.itemKind++
}

const updateItemInfo = () => {
  if (selectedItemId.value === 'custom') {
    return
  }
  
  const itemIdNum = parseInt(selectedItemId.value)
  codeForm.itemId = itemIdNum
  
  // 根据物品ID设置默认值
  const itemInfo: Record<number, { kind: number, amount: number }> = {
    8000: { kind: 1, amount: 1000 },
    8010: { kind: 1, amount: 1000 },
    8020: { kind: 1, amount: 1000 },
    8030: { kind: 1, amount: 1000 }
  }
  
  const info = itemInfo[itemIdNum]
  if (info) {
    codeForm.itemKind = info.kind
    codeForm.amount = info.amount
  }
}

const copyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success('兑换码已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  rewardFilter.value = ''
  currentPage.value = 1
}

const resetForm = () => {
  Object.assign(codeForm, {
    code: '',
    itemId: 8000,
    itemKind: 1,
    amount: 1,
    maxGlobalUses: 1,
    maxUserUses: 1,
    startTime: null,
    endTime: null
  })
  selectedItemId.value = '8000'
}

const editCode = (code: RedemptionCode) => {
  editingCode.value = code
  selectedItemId.value = code.itemId.toString()
  
  // 使用数据转换工具函数
  const formData = dataTransform.codeToFormData(code)
  Object.assign(codeForm, formData)
  
  showAddDialog.value = true
}

const cancelEdit = () => {
  showAddDialog.value = false
  editingCode.value = null
  resetForm()
}

const toggleCodeStatus = async (code: RedemptionCode) => {
  const newStatus = !code.isActive
  const action = newStatus ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}兑换码 ${code.code} 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const updatedCode = await redeemApi.toggleRedemptionCodeStatus(code.id)
    // 更新本地数据
    const index = redemptionCodes.value.findIndex(c => c.id === code.id)
    if (index > -1) {
      redemptionCodes.value[index] = updatedCode
    }
    ElMessage.success(`兑换码${action}成功`)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('切换状态失败:', error)
      ElMessage.error(error.message || '操作失败')
    }
  }
}

const deleteCode = async (code: RedemptionCode) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除兑换码 ${code.code} 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    await redeemApi.deleteRedemptionCode(code.id)
    const index = redemptionCodes.value.findIndex(c => c.id === code.id)
    if (index > -1) {
      redemptionCodes.value.splice(index, 1)
    }
    ElMessage.success('兑换码删除成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const generateBatchCodes = () => {
  showBatchDialog.value = true
}

const generateBatch = async () => {
  try {
    batchGenerating.value = true
    
    // 使用数据转换工具函数
    const batchData = dataTransform.batchFormToRequest(batchForm)
    
    const newCodes = await redeemApi.batchCreateRedemptionCodes(batchData)
    // 添加到本地数据
    redemptionCodes.value.push(...newCodes)
    showBatchDialog.value = false
    ElMessage.success(`成功生成 ${batchForm.count} 个兑换码`)
  } catch (error: any) {
    console.error('批量生成失败:', error)
    ElMessage.error(error.message || '批量生成失败')
  } finally {
    batchGenerating.value = false
  }
}

const saveCode = async () => {
  try {
    // 验证表单数据
    const validation = codeValidator.validateCreateForm(codeForm)
    if (!validation.valid) {
      ElMessage.error(validation.errors.join(', '))
      return
    }
    
    saving.value = true
    
    if (editingCode.value) {
      // 更新兑换码
      const updateData = dataTransform.formToUpdateRequest(codeForm)
      const updatedCode = await redeemApi.updateRedemptionCode(editingCode.value.id, updateData)
      const index = redemptionCodes.value.findIndex(c => c.id === editingCode.value!.id)
      if (index > -1) {
        redemptionCodes.value[index] = updatedCode
      }
      ElMessage.success('兑换码更新成功')
    } else {
      // 创建新兑换码
      const createData = dataTransform.formToCreateRequest(codeForm)
      const newCode = await redeemApi.createRedemptionCode(createData)
      redemptionCodes.value.push(newCode)
      ElMessage.success('兑换码创建成功')
    }
    
    showAddDialog.value = false
    editingCode.value = null
    resetForm()
  } catch (error: any) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>