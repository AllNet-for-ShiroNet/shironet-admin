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
          ]">用户管理</h2>
          <p :class="[
            'text-xs sm:text-sm mt-1',
            isDark ? 'text-gray-400' : 'text-gray-500'
          ]">管理系统用户和权限设置</p>
        </div>
        <el-button type="primary" @click="showAddDialog = true" class="self-start sm:self-auto">
          <span class="material-icons mr-2 text-sm">person_add</span>
          添加用户
        </el-button>
      </div>
      
      <!-- 搜索和筛选区域 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名或邮箱..."
          clearable
          size="default"
          @input="handleSearch"
        >
          <template #prefix>
            <span class="material-icons text-gray-400">search</span>
          </template>
        </el-input>
        
        <el-select 
          v-model="roleFilter" 
          placeholder="权限组筛选" 
          clearable
          size="default"
          @change="handleFilter"
        >
          <el-option label="超级管理员" value="super_admin" />
          <el-option label="管理员" value="admin" />
          <el-option label="可信用户" value="trust_user" />
          <el-option label="普通用户" value="user" />
        </el-select>
        
        <el-select 
          v-model="cardStatusFilter" 
          placeholder="卡片状态" 
          clearable
          size="default"
          @change="handleFilter"
        >
          <el-option label="正常" value="normal" />
          <el-option label="已锁定" value="locked" />
          <el-option label="已封禁" value="banned" />
        </el-select>
        
        <el-button @click="resetFilters" class="sm:col-span-1 lg:col-span-1">
          <span class="material-icons mr-1 text-sm">refresh</span>
          重置筛选
        </el-button>
      </div>
    </div>

    <!-- 移动端卡片视图 -->
    <div class="block sm:hidden">
      <div v-loading="loading" class="space-y-3">
        <div
          v-for="user in users"
          :key="user.id"
          :class="[
            'p-4 rounded-lg border',
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          ]"
        >
          <!-- 用户基本信息 -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center mb-1">
                <h3 :class="[
                  'font-medium text-base truncate',
                  isDark ? 'text-white' : 'text-gray-900'
                ]">{{ user.username }}</h3>
                <span class="ml-2 text-xs text-gray-500">#{{ user.id }}</span>
              </div>
              <p :class="[
                'text-sm truncate',
                isDark ? 'text-gray-300' : 'text-gray-600'
              ]">{{ user.email }}</p>
            </div>
            <span 
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2"
              :class="getRoleStyle(user.role)"
            >
              {{ getRoleLabel(user.role) }}
            </span>
          </div>

          <!-- AIME卡信息 -->
          <div v-if="user.aimeCard" class="mb-3">
            <div :class="[
              'text-xs font-medium mb-1',
              isDark ? 'text-gray-400' : 'text-gray-500'
            ]">AIME卡</div>
            <div :class="[
              'font-mono text-sm bg-gray-100 px-2 py-1 rounded',
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            ]">
              {{ user.aimeCard }}
            </div>
          </div>

          <!-- 状态标签 -->
          <div class="flex flex-wrap gap-2 mb-3">
            <span 
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              :class="user.cardLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'"
            >
              {{ user.cardLocked ? '卡片锁定' : '卡片正常' }}
            </span>
            <span 
              v-if="user.cardBanned"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
            >
              卡片封禁
            </span>
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
              ]">{{ formatDate(user.createdAt) }}</div>
            </div>
            <div>
              <div :class="[
                'font-medium mb-1',
                isDark ? 'text-gray-400' : 'text-gray-500'
              ]">最后登录</div>
              <div :class="[
                isDark ? 'text-gray-300' : 'text-gray-600'
              ]">{{ user.lastLogin ? formatDate(user.lastLogin) : '-' }}</div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-end space-x-2">
            <el-button
              size="small"
              type="primary"
              @click="editUser(user)"
            >
              <span class="material-icons text-sm mr-1">edit</span>
              编辑
            </el-button>
            <el-button
              size="small"
              type="warning"
              @click="toggleCardBan(user)"
            >
              <span class="material-icons text-sm mr-1">
                {{ user.cardBanned ? 'check_circle' : 'block' }}
              </span>
              {{ user.cardBanned ? '解封' : '封禁' }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteUser(user)"
            >
              <span class="material-icons text-sm">delete</span>
            </el-button>
          </div>
        </div>

        <!-- 移动端空状态 -->
        <div 
          v-if="users.length === 0 && !loading"
          :class="[
            'text-center py-12',
            isDark ? 'text-gray-400' : 'text-gray-500'
          ]"
        >
          <span class="material-icons text-4xl mb-4 block opacity-50">person_off</span>
          <p>暂无用户数据</p>
        </div>
      </div>

      <!-- 移动端分页 -->
      <div 
        v-if="total > 0" 
        :class="[
          'mt-4 p-4 rounded-lg border flex flex-col items-center space-y-3',
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        ]"
      >
        <p :class="[
          'text-sm',
          isDark ? 'text-gray-400' : 'text-gray-500'
        ]">
          共 {{ total }} 个用户
        </p>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="sizes, prev, pager, next"
          small
          background
          @current-change="loadUsers"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 桌面端表格视图 -->
    <div :class="[
      'hidden sm:block rounded-lg border overflow-hidden',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ]">
      <div class="overflow-x-auto">
        <table class="w-full">
          <!-- 表头 -->
          <thead :class="[
            'border-b text-sm font-medium',
            isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
          ]">
            <tr>
              <th class="px-4 py-3 text-center w-20">ID</th>
              <th class="px-4 py-3 text-center w-32">用户名</th>
              <th class="px-4 py-3 text-center w-48">邮箱</th>
              <th class="px-4 py-3 text-center w-24">权限</th>
              <th class="px-4 py-3 text-center w-40">AIME卡</th>
              <th class="px-4 py-3 text-center w-24">卡片锁定</th>
              <th class="px-4 py-3 text-center w-24">卡片封禁</th>
              <th class="px-4 py-3 text-center w-32">创建日期</th>
              <th class="px-4 py-3 text-center w-32">最后登录</th>
              <th class="px-4 py-3 text-center w-24">操作</th>
            </tr>
          </thead>
          
          <!-- 表体 -->
          <tbody v-loading="loading">
            <tr 
              v-for="user in users" 
              :key="user.id"
              :class="[
                'border-b transition-colors hover:cursor-pointer',
                isDark 
                  ? 'border-gray-700 hover:bg-gray-700 text-gray-300' 
                  : 'border-gray-100 hover:bg-gray-50 text-gray-900'
              ]"
            >
              <!-- ID -->
              <td class="px-4 py-4 text-center text-sm font-medium">
                {{ user.id }}
              </td>
              
              <!-- 用户名 -->
              <td class="px-4 py-4 text-center">
                <div>
                  <div :class="[
                    'font-medium text-sm',
                    isDark ? 'text-white' : 'text-gray-900'
                  ]">{{ user.username }}</div>
                </div>
              </td>
              
              <!-- 邮箱 -->
              <td class="px-4 py-4 text-center">
                <span :class="[
                  'text-sm',
                  isDark ? 'text-gray-300' : 'text-gray-700'
                ]">{{ user.email }}</span>
              </td>
              
              <!-- 权限 -->
              <td class="px-4 py-4 text-center">
                <span 
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="getRoleStyle(user.role)"
                >
                  {{ getRoleLabel(user.role) }}
                </span>
              </td>
              
              <!-- AIME卡 -->
              <td class="px-4 py-4 text-center">
                <span :class="[
                  'font-mono text-sm',
                  isDark ? 'text-gray-300' : 'text-gray-600'
                ]">{{ user.aimeCard || '-' }}</span>
              </td>
              
              <!-- 卡片锁定 -->
              <td class="px-4 py-4 text-center">
                <span 
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="user.cardLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'"
                >
                  {{ user.cardLocked ? '锁定' : '未锁定' }}
                </span>
              </td>
              
              <!-- 卡片封禁 -->
              <td class="px-4 py-4 text-center">
                <span 
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="user.cardBanned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'"
                >
                  {{ user.cardBanned ? '封禁' : '未封禁' }}
                </span>
              </td>
              
              <!-- 创建日期 -->
              <td class="px-4 py-4 text-center">
                <span :class="[
                  'text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                ]">{{ formatDate(user.createdAt) }}</span>
              </td>
              
              <!-- 最后登录 -->
              <td class="px-4 py-4 text-center">
                <span :class="[
                  'text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                ]">{{ user.lastLogin ? formatDate(user.lastLogin) : '-' }}</span>
              </td>
              
              <!-- 操作 -->
              <td class="px-4 py-4 text-center">
                <div class="flex items-center justify-center space-x-1">
                  <el-button
                    size="small"
                    type="primary"
                    @click="editUser(user)"
                    class="!w-8 !h-8 !p-0"
                    title="编辑"
                  >
                    <span class="material-icons text-sm">edit</span>
                  </el-button>
                  <el-button
                    size="small"
                    type="warning"
                    @click="toggleCardBan(user)"
                    class="!w-8 !h-8 !p-0"
                    :title="user.cardBanned ? '解封' : '封禁'"
                  >
                    <span class="material-icons text-sm">
                      {{ user.cardBanned ? 'check_circle' : 'block' }}
                    </span>
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="deleteUser(user)"
                    class="!w-8 !h-8 !p-0"
                    title="删除"
                  >
                    <span class="material-icons text-sm">delete</span>
                  </el-button>
                </div>
              </td>
            </tr>

            <!-- 空状态 -->
            <tr v-if="users.length === 0 && !loading">
              <td colspan="10" :class="[
                'text-center py-12',
                isDark ? 'text-gray-400' : 'text-gray-500'
              ]">
                <span class="material-icons text-4xl mb-4 block opacity-50">person_off</span>
                <p>暂无用户数据</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 桌面端分页 -->
      <div v-if="total > 0" :class="[
        'px-6 py-4 border-t flex items-center justify-between',
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      ]">
        <p :class="[
          'text-sm',
          isDark ? 'text-gray-400' : 'text-gray-500'
        ]">
          共 {{ total }} 个用户
        </p>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="sizes, prev, pager, next"
          small
          background
          @current-change="loadUsers"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingUser ? '编辑用户' : '添加用户'"
      :width="isMobile ? '90%' : '500px'"
      align-center
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" type="email" />
        </el-form-item>
        <el-form-item label="Aime卡号" prop="aimeCard">
          <el-input v-model="userForm.aimeCard" placeholder="可选，留空表示未绑定" />
        </el-form-item>
        <el-form-item label="权限组" prop="role">
          <el-select v-model="userForm.role" class="w-full">
            <el-option label="超级管理员" value="super_admin" />
            <el-option label="管理员" value="admin" />
            <el-option label="可信用户" value="trust_user" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="卡片状态">
          <div class="flex flex-col space-y-2">
            <el-checkbox v-model="userForm.cardLocked">锁定卡片</el-checkbox>
            <el-checkbox v-model="userForm.cardBanned">封禁卡片</el-checkbox>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="text-center">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="saveUser" :loading="saveLoading">
            {{ editingUser ? '更新' : '添加' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, inject, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  userApi, 
  dataTransform, 
  userValidator,
  type User, 
  type CreateUserRequest, 
  type UpdateUserRequest 
} from '@/api/user-list'

const loading = ref(false)
const saveLoading = ref(false)
const showAddDialog = ref(false)
const editingUser = ref<User | null>(null)
const searchQuery = ref('')
const roleFilter = ref('')
const cardStatusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isMobile = ref(false)

// 从父组件获取主题状态
const isDark = inject('isDark', ref(false))

// 用户数据
const users = ref<User[]>([])

// 检测屏幕尺寸
const checkMobile = () => {
  isMobile.value = window.innerWidth < 640
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  loadUsers()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const userForm = reactive({
  username: '',
  email: '',
  aimeCard: '',
  role: 'user',
  cardLocked: false,
  cardBanned: false
})

const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择权限组', trigger: 'change' }
  ]
}

// 加载用户列表
const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      role: roleFilter.value || undefined,
      cardStatus: cardStatusFilter.value || undefined,
    }
    
    const result = await userApi.getUserList(params)
    
    users.value = result.users
    total.value = result.total
    
    console.log('加载的用户数据:', users.value)
    console.log('总数:', total.value)
    
  } catch (error: any) {
    console.error('加载用户列表失败:', error)
    ElMessage.error(error.message || '加载用户列表失败')
    users.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 事件处理函数
const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

const handleFilter = () => {
  currentPage.value = 1
  loadUsers()
}

const handleSizeChange = () => {
  currentPage.value = 1
  loadUsers()
}

// 使用 dataTransform 中的工具函数
const getRoleStyle = (role: string) => {
  return dataTransform.getRoleStyle(role)
}

const getRoleLabel = (role: string) => {
  return dataTransform.getRoleLabel(role)
}

const formatDate = (dateStr: string | undefined) => {
  return dataTransform.formatDate(dateStr)
}

const resetFilters = () => {
  searchQuery.value = ''
  roleFilter.value = ''
  cardStatusFilter.value = ''
  currentPage.value = 1
  loadUsers()
}

const editUser = (user: User) => {
  editingUser.value = user
  const formData = dataTransform.userToFormData(user)
  Object.assign(userForm, formData)
  showAddDialog.value = true
}

const toggleCardBan = async (user: User) => {
  const action = user.cardBanned ? '解封' : '封禁'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}用户 ${user.username} 的卡片吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userApi.toggleCardBan(user.id)
    ElMessage.success(`卡片${action}成功`)
    await loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('切换卡片封禁状态失败:', error)
      ElMessage.error(error.message || '操作失败')
    }
  }
}

const deleteUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 ${user.username} 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    await userApi.deleteUser(user.id)
    ElMessage.success('用户删除成功')
    await loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const saveUser = async () => {
  // 先进行表单验证
  const validation = editingUser.value 
    ? userValidator.validateUpdateForm(userForm)
    : userValidator.validateCreateForm(userForm)
  
  if (!validation.valid) {
    validation.errors.forEach(error => {
      ElMessage.error(error)
    })
    return
  }

  saveLoading.value = true
  
  try {
    if (editingUser.value) {
      // 更新用户
      const updateData = dataTransform.formToUpdateRequest(userForm)
      await userApi.updateUser(editingUser.value.id, updateData)
      ElMessage.success('用户更新成功')
    } else {
      // 添加新用户
      const createData = dataTransform.formToCreateRequest(userForm)
      await userApi.createUser(createData)
      ElMessage.success('用户添加成功')
    }
    
    showAddDialog.value = false
    editingUser.value = null
    
    // 重置表单
    Object.assign(userForm, {
      username: '',
      email: '',
      aimeCard: '',
      role: 'user',
      cardLocked: false,
      cardBanned: false
    })
    
    // 重新加载数据
    await loadUsers()
  } catch (error: any) {
    console.error('保存用户失败:', error)
    ElMessage.error(error.message || '保存失败')
  } finally {
    saveLoading.value = false
  }
}

// 切换卡片锁定状态
const toggleCardLock = async (user: User) => {
  const action = user.cardLocked ? '解锁' : '锁定'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}用户 ${user.username} 的卡片吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userApi.toggleCardLock(user.id)
    ElMessage.success(`卡片${action}成功`)
    await loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('切换卡片锁定状态失败:', error)
      ElMessage.error(error.message || '操作失败')
    }
  }
}

// 批量删除用户（可选功能）
const batchDeleteUsers = async (userIds: number[]) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${userIds.length} 个用户吗？此操作不可恢复！`,
      '确认批量删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    await userApi.batchDeleteUsers(userIds)
    ElMessage.success('批量删除成功')
    await loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

// 获取用户统计信息（可选功能）
const getUserStats = async () => {
  try {
    const stats = await userApi.getUserStats()
    console.log('用户统计信息:', stats)
    return stats
  } catch (error: any) {
    console.error('获取统计信息失败:', error)
    ElMessage.error(error.message || '获取统计信息失败')
  }
}

// 添加到对话框关闭时重置表单的处理
const handleDialogClose = () => {
  editingUser.value = null
  Object.assign(userForm, {
    username: '',
    email: '',
    aimeCard: '',
    role: 'user',
    cardLocked: false,
    cardBanned: false
  })
}

// 监听对话框关闭事件
const onDialogClosed = () => {
  handleDialogClose()
}
</script>