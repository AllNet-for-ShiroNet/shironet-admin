// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

// 定义路由权限类型
interface RouteMeta {
  requiresAuth?: boolean
  allowedRoles?: string[]  // 允许访问的角色列表
  title?: string
  icon?: string
  hideInMenu?: boolean    // 是否在菜单中隐藏
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { 
      requiresAuth: false,
      hideInMenu: true
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'DashboardHome',
        component: () => import('../views/Dashboard.vue'),
        meta: {
          title: '仪表盘',
          icon: 'dashboard',
          allowedRoles: ['admin']
        }
      },
      {
        path: 'user',
        name: 'user',
        component: () => import('../views/User.vue'),
        meta: { 
          title: '玩家管理', 
          icon: 'people',
          allowedRoles: ['admin'] // 只有 admin 可以访问
        }
      },
      {
        path: 'userlist',
        name: 'userlist',
        component: () => import('../views/userlist.vue'),
        meta: { 
          title: '用户管理', 
          icon: 'people',
          allowedRoles: ['admin'] // 只有 admin 可以访问
        }
      },
      {
        path: 'keychip',
        name: 'Keychips',
        component: () => import('../views/Keychip.vue'),
        meta: { 
          title: '狗号管理', 
          icon: 'key',
          allowedRoles: ['admin'] // 只有 admin 可以访问
        }
      },
      {
        path: 'redeem',
        name: 'Redeems',
        component: () => import('../views/Redeem.vue'),
        meta: { 
          title: '兑换管理', 
          icon: 'gift',
          allowedRoles: ['admin'] // 只有 admin 可以访问
        }
      },
      {
        path: 'upload',
        name: 'Upload',
        component: () => import('../views/upload.vue'),
        meta: { 
          title: '数据上传', 
          icon: 'upload',
          allowedRoles: ['admin'] // 只有 admin 可以访问
        }
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: () => import('../views/Announcements.vue'),
        meta: {
          title: '公告管理',
          icon: 'notification',
          allowedRoles: ['admin'] // 只有 admin 可以访问
        }
      },
      {
        path: 'data-manage',
        name: 'DataManage',
        component: () => import('../views/DataManage.vue'),
        meta: {
          title: '数据管理',
          icon: 'storage',
          allowedRoles: ['admin'] // 只有 admin 可以访问
        }
      },
      {
        path: 'setting',
        name: 'Setting',
        component: () => import('../views/Setting.vue'),
        meta: {
          title: '前端设置',
          icon: 'setting',
          allowedRoles: ['admin']
        }
      },
      {
        path: 'data-download',
        name: 'DataDownload',
        component: () => import('../views/DataDownload.vue'),
        meta: {
          title: '数据下载',
          icon: 'download',
          allowedRoles: ['admin']
        }
      },
    ]
  },
  // 用户数据详情页面（隐藏在菜单中）
  {
    path: '/data-manage/:id',
    name: 'UserDataDetail',
    component: () => import('../views/ChuniData.vue'),
    meta: {
      requiresAuth: true,
      allowedRoles: ['admin'],
      hideInMenu: true,
      title: '用户数据详情'
    }
  },
  // 403 权限不足页面
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('../views/Forbidden.vue'),
    meta: {
      hideInMenu: true
    }
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: {
      hideInMenu: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 权限检查函数
function hasPermission(userRole: string, allowedRoles?: string[]): boolean {
  // 如果没有指定角色限制，默认允许所有已认证用户访问
  if (!allowedRoles || allowedRoles.length === 0) {
    return true
  }
  
  // admin 拥有所有权限
  if (userRole === 'admin') {
    return true
  }
  
  // 检查用户角色是否在允许列表中
  return allowedRoles.includes(userRole)
}

// 获取用户可访问的菜单项
export function getAccessibleMenuItems(userRole: string): RouteRecordRaw[] {
  const dashboardRoute = routes.find(route => route.name === 'Dashboard')
  if (!dashboardRoute || !dashboardRoute.children) {
    return []
  }
  
  return dashboardRoute.children.filter(route => {
    const meta = route.meta as RouteMeta
    // 过滤掉隐藏的菜单项
    if (meta?.hideInMenu) {
      return false
    }
    // 检查权限
    return hasPermission(userRole, meta?.allowedRoles)
  })
}

// 添加全局错误处理
router.onError((error) => {
  console.error('Router error:', error)
  ElMessage.error('路由加载失败')
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  try {
    const authStore = useAuthStore()
    
    // 初始化认证状态
    if (!authStore.user && authStore.accessToken) {
      await authStore.initAuth()
    }
    
    const requiresAuth = to.meta?.requiresAuth !== false
    const isAuthenticated = authStore.isAuthenticated
    const userRole = authStore.user?.role || ''
    
    console.log('路由守卫检查:', {
      path: to.path,
      requiresAuth,
      isAuthenticated,
      userRole,
      allowedRoles: to.meta?.allowedRoles
    })

    // 检查是否需要认证
    if (requiresAuth && !isAuthenticated) {
      ElMessage.warning('请先登录')
      next('/login')
      return
    }

    // 如果已登录用户访问登录页，重定向到仪表盘
    if (to.path === '/login' && isAuthenticated) {
      next('/dashboard')
      return
    }

    // 检查角色权限
    if (requiresAuth && isAuthenticated) {
      const allowedRoles = to.meta?.allowedRoles as string[] | undefined
      
      if (!hasPermission(userRole, allowedRoles)) {
        console.warn('权限不足:', { userRole, allowedRoles, path: to.path })
        ElMessage.error('权限不足，无法访问该页面')
        next('/dashboard')
        return
      }
    }

    // 设置页面标题
    if (to.meta?.title) {
      document.title = `${to.meta.title} - ShiroNET管理系统`
    }

    next()
  } catch (error) {
    console.error('Navigation error:', error)
    ElMessage.error('页面导航失败')
    next(false)
  }
})

// 后置守卫 - 用于页面加载完成后的处理
router.afterEach((to) => {
  // 滚动到页面顶部
  window.scrollTo(0, 0)
  
  // 记录页面访问日志（可选）
  console.log('页面访问:', {
    path: to.path,
    name: to.name,
    title: to.meta?.title
  })
})

export default router