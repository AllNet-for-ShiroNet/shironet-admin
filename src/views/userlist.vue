<template>
  <div class="space-y-4 sm:space-y-6 px-2 sm:px-0">
    <!-- 页面标题和操作栏 -->
    <div class="p-4 sm:p-6 rounded-lg border bg-white border-gray-200">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900">用户管理</h2>
          <p class="text-xs sm:text-sm mt-1 text-gray-500">管理系统用户和权限设置</p>
        </div>
        <el-button type="primary" @click="showAddDialog = true" class="self-start sm:self-auto">
          <!-- 使用 Element Plus 内置图标 -->
          <el-icon class="mr-2"><Plus /></el-icon>
          添加用户
        </el-button>
      </div>
      
      <!-- 搜索和筛选区域 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名..."
          clearable
          size="default"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon class="text-gray-400"><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select 
          v-model="roleFilter" 
          placeholder="角色筛选" 
          clearable
          size="default"
          @change="handleFilter"
        >
          <el-option label="管理员" value="admin" />
          <el-option label="普通用户" value="user" />
        </el-select>
        
        <el-select 
          v-model="statusFilter" 
          placeholder="状态筛选" 
          clearable
          size="default"
          @change="handleFilter"
        >
          <el-option label="正常" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
        
        <el-button @click="resetFilters" class="sm:col-span-1 lg:col-span-1">
          <el-icon class="mr-1"><RefreshRight /></el-icon>
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
          class="p-4 rounded-lg border bg-white border-gray-200"
        >
          <!-- 用户基本信息 -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center mb-1">
                <h3 class="font-medium text-base truncate text-gray-900">{{ user.username }}</h3>
                <span class="ml-2 text-xs text-gray-500">#{{ user.id }}</span>
              </div>
              <p class="text-sm truncate text-gray-600">{{ user.nickname }}</p>
            </div>
            <span 
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2"
              :class="getRoleStyle(user.role)"
            >
              {{ getRoleLabel(user.role) }}
            </span>
          </div>

          <!-- 时间信息 -->
          <div class="grid grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <div class="font-medium mb-1 text-gray-500">创建时间</div>
              <div class="text-gray-600">{{ formatDate(user.createdAt) }}</div>
            </div>
            <div>
              <div class="font-medium mb-1 text-gray-500">最后登录</div>
              <div class="text-gray-600">{{ user.lastLoginAt ? formatDate(user.lastLoginAt) : '从未登录' }}</div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-end space-x-2">
            <el-button 
              size="small" 
              type="primary" 
              @click="editUser(user)"
            >
              <el-icon class="mr-1"><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteUser(user)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 移动端空状态 -->
        <div 
          v-if="users.length === 0 && !loading"
          class="text-center py-12 text-gray-500"
        >
          <el-icon class="text-4xl mb-4 block opacity-50"><UserFilled /></el-icon>
          <p>暂无用户数据</p>
        </div>
      </div>

      <!-- 移动端分页 -->
      <div 
        v-if="total > 0" 
        class="mt-4 p-4 rounded-lg border flex flex-col items-center space-y-3 bg-white border-gray-200"
      >
        <p class="text-sm text-gray-500">
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
    <div class="hidden sm:block rounded-lg border overflow-hidden bg-white border-gray-200">
      <div class="overflow-x-auto">
        <table class="w-full">
          <!-- 表头 -->
          <thead class="border-b text-sm font-medium bg-gray-50 border-gray-200 text-gray-700">
            <tr>
              <th class="px-4 py-3 text-center w-20">ID</th>
              <th class="px-4 py-3 text-center w-32">用户名</th>
              <th class="px-4 py-3 text-center w-32">昵称</th>
              <th class="px-4 py-3 text-center w-24">角色</th>
              <th class="px-4 py-3 text-center w-32">创建时间</th>
              <th class="px-4 py-3 text-center w-32">最后登录</th>
              <th class="px-4 py-3 text-center w-24">操作</th>
            </tr>
          </thead>
          
          <!-- 表体 -->
          <tbody v-loading="loading">
            <tr 
              v-for="user in users" 
              :key="user.id"
              class="border-b transition-colors hover:cursor-pointer border-gray-100 hover:bg-gray-50 text-gray-900"
            >
              <!-- ID -->
              <td class="px-4 py-4 text-center text-sm font-medium">
                {{ user.id }}
              </td>
              
              <!-- 用户名 -->
              <td class="px-4 py-4 text-center">
                <div class="font-medium text-sm text-gray-900">{{ user.username }}</div>
              </td>
              
              <!-- 昵称 -->
              <td class="px-4 py-4 text-center">
                <span class="text-sm text-gray-700">{{ user.nickname }}</span>
              </td>
              
              <!-- 角色 -->
              <td class="px-4 py-4 text-center">
                <span 
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="getRoleStyle(user.role)"
                >
                  {{ getRoleLabel(user.role) }}
                </span>
              </td>
              
              <!-- 创建时间 -->
              <td class="px-4 py-4 text-center">
                <span class="text-sm text-gray-500">{{ formatDate(user.createdAt) }}</span>
              </td>
              
              <!-- 最后登录 -->
              <td class="px-4 py-4 text-center">
                <span class="text-sm text-gray-500">{{ user.lastLoginAt ? formatDate(user.lastLoginAt) : '从未登录' }}</span>
              </td>
              
              <!-- 操作 -->
              <td class="px-4 py-4 text-center">
                <div class="flex items-center justify-center space-x-1">
                  <el-button 
                    size="small" 
                    type="primary" 
                    @click="editUser(user)"
                    class="!w-8 !h-8 !p-0"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="deleteUser(user)"
                    class="!w-8 !h-8 !p-0"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </td>
            </tr>

            <!-- 空状态 -->
            <tr v-if="users.length === 0 && !loading">
              <td colspan="7" class="text-center py-12 text-gray-500">
                <el-icon class="text-4xl mb-4 block opacity-50"><UserFilled /></el-icon>
                <p>暂无用户数据</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 桌面端分页 -->
      <div v-if="total > 0" class="px-6 py-4 border-t flex items-center justify-between border-gray-200 bg-gray-50">
        <p class="text-sm text-gray-500">
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
      @closed="handleDialogClose"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="!!editingUser" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userForm.nickname" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!editingUser">
          <el-input v-model="userForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" class="w-full">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
// 导入 Element Plus 图标
import { 
  Plus, 
  Search, 
  RefreshRight, 
  Edit, 
  Delete, 
  UserFilled 
} from '@element-plus/icons-vue'
import { userApi, type AdminUser, type CreateUserRequest } from '@/api/user'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const saveLoading = ref(false)
const showAddDialog = ref(false)
const editingUser = ref<AdminUser | null>(null)
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isMobile = ref(false)
const userFormRef = ref<FormInstance>()

// 用户数据
const users = ref<AdminUser[]>([])

// 表单数据
const userForm = reactive({
  username: '',
  nickname: '',
  password: '',
  role: 'user' as 'admin' | 'user'
})

// 表单验证规则
const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 100, message: '昵称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 255, message: '密码长度在 6 到 255 个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择用户角色', trigger: 'change' }
  ]
}

// 检测屏幕尺寸
const checkMobile = () => {
  isMobile.value = window.innerWidth < 640
}

// 生命周期
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  loadUsers()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 加载用户列表
const loadUsers = async () => {
  loading.value = true
  try {
    const allUsers = await userApi.getAllUsers()
    
    // 前端过滤和分页
    let filteredUsers = allUsers.filter(user => {
      const matchesSearch = !searchQuery.value || 
        user.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        user.nickname.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchesRole = !roleFilter.value || user.role === roleFilter.value
      return matchesSearch && matchesRole
    })
    
    total.value = filteredUsers.length
    
    // 分页
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    users.value = filteredUsers.slice(start, end)
    
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

// 获取角色样式
const getRoleStyle = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800'
    case 'user':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// 获取角色标签
const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin':
      return '管理员'
    case 'user':
      return '普通用户'
    default:
      return '未知'
  }
}

// 格式化日期
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 重置筛选器
const resetFilters = () => {
  searchQuery.value = ''
  roleFilter.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  loadUsers()
}

// 编辑用户
const editUser = (user: AdminUser) => {
  editingUser.value = user
  userForm.username = user.username
  userForm.nickname = user.nickname
  userForm.password = ''
  userForm.role = user.role as 'admin' | 'user'
  showAddDialog.value = true
}

// 删除用户
const deleteUser = async (user: AdminUser) => {
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
    
    // 这里调用删除 API（需要在后端实现）
    ElMessage.success('用户删除成功')
    await loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 保存用户
const saveUser = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    saveLoading.value = true
    
    if (editingUser.value) {
      // 编辑模式 - 这里需要实现更新用户的API
      ElMessage.success('用户更新成功')
    } else {
      // 新增模式
      const userData: CreateUserRequest = {
        username: userForm.username,
        nickname: userForm.nickname,
        password: userForm.password,
        role: userForm.role
      }
      
      await userApi.createUser(userData)
      ElMessage.success('用户创建成功')
    }
    
    showAddDialog.value = false
    await loadUsers()
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    saveLoading.value = false
  }
}

// 关闭对话框
const handleDialogClose = () => {
  editingUser.value = null
  Object.assign(userForm, {
    username: '',
    nickname: '',
    password: '',
    role: 'user'
  })
  userFormRef.value?.resetFields()
}
</script>

<style scoped>
/* UnoCSS 会处理大部分样式，这里只需要少量自定义样式 */
</style>