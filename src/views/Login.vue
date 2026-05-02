<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full space-y-8">
      <!-- 头部 -->
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">管理员登录</h2>
        <p class="mt-2 text-gray-600">shiroNET街机管理系统</p>
      </div>

      <!-- 登录表单 -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="space-y-6"
          @submit.prevent="handleLogin"
        >
          <!-- 用户名 -->
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              size="large"
              placeholder="用户名"
              :prefix-icon="User"
              class="w-full"
              clearable
            />
          </el-form-item>

          <!-- 密码 -->
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              size="large"
              placeholder="密码"
              :prefix-icon="Lock"
              show-password
              class="w-full"
              clearable
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <!-- 选项 -->
          <el-form-item>
            <div class="flex items-center justify-between w-full">
              <el-checkbox v-model="loginForm.remember" class="text-gray-600">
                记住登录状态
              </el-checkbox>
            </div>
          </el-form-item>

          <!-- 登录按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="w-full"
              :loading="authStore.loading"
              @click="handleLogin"
            >
              {{ authStore.loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref<FormInstance>()

const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    
    const success = await authStore.login({
      username: loginForm.username,
      password: loginForm.password
    })
    
    if (success) {
      // 检查是否选择了"记住我"
      if (loginForm.remember) {
        localStorage.setItem('remember_login', 'true')
        localStorage.setItem('saved_username', loginForm.username)
      } else {
        localStorage.removeItem('remember_login')
        localStorage.removeItem('saved_username')
      }
      
      // 跳转到仪表板
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 组件挂载时检查是否已登录
onMounted(async () => {
  if (authStore.isAuthenticated) {
    // 已登录，跳转到仪表板
    router.push('/dashboard')
    return
  }
  
  // 如果选择了记住登录，自动填充表单
  const rememberLogin = localStorage.getItem('remember_login')
  if (rememberLogin) {
    const savedUsername = localStorage.getItem('saved_username')
    if (savedUsername) {
      loginForm.username = savedUsername
      loginForm.remember = true
    }
  }
})
</script>

<style scoped>
/* 简化的输入框样式 */
:deep(.el-input__wrapper) {
  border-radius: 6px;
  border: 1px solid #d1d5db;
  transition: border-color 0.2s;
}

:deep(.el-input__wrapper:hover) {
  border-color: #9ca3af;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:deep(.el-button--primary) {
  background-color: #3b82f6;
  border-color: #3b82f6;
  border-radius: 6px;
  font-weight: 500;
}

:deep(.el-button--primary:hover) {
  background-color: #2563eb;
  border-color: #2563eb;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}
</style>