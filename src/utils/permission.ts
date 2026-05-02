// src/utils/permission.ts
import type { RouteRecordRaw } from 'vue-router'

// 用户角色定义
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

// 权限检查函数
export function hasPermission(userRole: string, allowedRoles?: string[]): boolean {
  // 如果没有指定角色限制，默认允许所有已认证用户访问
  if (!allowedRoles || allowedRoles.length === 0) {
    return true
  }
  
  // admin 拥有所有权限
  if (userRole === UserRole.ADMIN) {
    return true
  }
  
  // 检查用户角色是否在允许列表中
  return allowedRoles.includes(userRole)
}

// 获取角色显示名称
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case UserRole.ADMIN:
      return '超级管理员'
    case UserRole.USER:
      return '普通用户'
    default:
      return '未知角色'
  }
}

// 获取角色颜色样式
export function getRoleColorClass(role: string): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'text-red-600 bg-red-100'
    case UserRole.USER:
      return 'text-blue-600 bg-blue-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

// 页面权限配置
export const PAGE_PERMISSIONS = {
  // 仪表盘 - 所有角色都可以访问
  dashboard: [UserRole.ADMIN, UserRole.USER],

  // 用户管理 - 只有超级管理员
  users: [UserRole.ADMIN],

  // 狗号管理 - 只有超级管理员
  keychip: [UserRole.ADMIN],

  // 兑换管理 - 只有超级管理员
  redeem: [UserRole.ADMIN],

  // 数据上传 - 只有超级管理员
  upload: [UserRole.ADMIN],

  // 公告管理 - 只有超级管理员
  announcements: [UserRole.ADMIN],

  // 前端设置 - 所有角色都可以访问
  setting: [UserRole.ADMIN, UserRole.USER]
}

// 获取用户可访问的页面列表
export function getAccessiblePages(userRole: string): string[] {
  const accessiblePages: string[] = []
  
  for (const [page, allowedRoles] of Object.entries(PAGE_PERMISSIONS)) {
    if (hasPermission(userRole, allowedRoles)) {
      accessiblePages.push(page)
    }
  }
  
  return accessiblePages
}

// 检查用户是否可以访问特定页面
export function canAccessPage(userRole: string, pageName: string): boolean {
  const allowedRoles = PAGE_PERMISSIONS[pageName as keyof typeof PAGE_PERMISSIONS]
  return hasPermission(userRole, allowedRoles)
}

// 获取用户的默认首页
export function getDefaultHomePage(userRole: string): string {
  switch (userRole) {
    case UserRole.ADMIN:
      return '/dashboard' // 超级管理员默认仪表盘
    case UserRole.USER:
      return '/dashboard' // 普通用户默认仪表盘
    default:
      return '/dashboard'
  }
}

// 获取侧边栏菜单配置
export function getSidebarMenuConfig(userRole: string) {
  const allMenuItems = [
    {
      path: '/dashboard',
      name: 'DashboardHome',
      title: '仪表盘',
      icon: 'dashboard',
      allowedRoles: [UserRole.ADMIN, UserRole.USER]
    },
    {
      path: '/dashboard/users',
      name: 'Users',
      title: '用户管理',
      icon: 'people',
      allowedRoles: [UserRole.ADMIN]
    },
    {
      path: '/dashboard/keychip',
      name: 'Keychips',
      title: '狗号管理',
      icon: 'key',
      allowedRoles: [UserRole.ADMIN]
    },
    {
      path: '/dashboard/redeem',
      name: 'Redeems',
      title: '兑换管理',
      icon: 'gift',
      allowedRoles: [UserRole.ADMIN]
    },
    {
      path: '/dashboard/upload',
      name: 'Upload',
      title: '数据上传',
      icon: 'upload',
      allowedRoles: [UserRole.ADMIN]
    },
    {
      path: '/dashboard/announcements',
      name: 'Announcements',
      title: '公告管理',
      icon: 'notification',
      allowedRoles: [UserRole.ADMIN]
    },
    {
      path: '/dashboard/setting',
      name: 'Setting',
      title: '前端设置',
      icon: 'setting',
      allowedRoles: [UserRole.ADMIN, UserRole.USER]
    }
  ]

  // 根据用户角色过滤菜单项
  return allMenuItems.filter(item => hasPermission(userRole, item.allowedRoles))
}