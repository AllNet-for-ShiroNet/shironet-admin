// src/api/keychip.ts
import http from '@/utils/http'

// 类型定义
export interface Account {
  serial: string
  game: string
  country: string
  otaEnable: boolean
  isCab: boolean
  note?: string
  arcadeName?: string
}

export interface AccountGroup {
  name: string
  displayName: string
  accounts: Account[]
}

export interface Machine {
  id: number
  arcade: number
  serial: string
  board?: string
  game?: string
  country?: string
  timezone?: string
  ota_enable?: boolean
  memo?: string
  is_cab?: boolean
  data?: any
  arcade_info?: {
    id: number
    name?: string
    nickname?: string
    country?: string
    region_id?: number
  }
}

export interface CreateMachineRequest {
  serial: string
  game?: string
  country?: string
  arcadeName?: string
  memo?: string
  ota_enable?: boolean
  is_cab?: boolean
  board?: string
  timezone?: string
  data?: any
}

export interface UpdateMachineRequest {
  game?: string
  country?: string
  arcadeName?: string
  memo?: string
  ota_enable?: boolean
  is_cab?: boolean
  board?: string
  timezone?: string
  data?: any
}

export interface SearchMachineRequest {
  search?: string
  game?: string
  country?: string
  arcade?: string
  ota_enable?: boolean
  is_cab?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// API 调用函数
export const keychipApi = {
  // 获取账号分组数据（主要用于前端显示）
  async getAccountGroups(): Promise<AccountGroup[]> {
    try {
      const response = await http.get<ApiResponse<AccountGroup[]>>('/machines/groups')
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.message || '获取账号分组失败')
    } catch (error: any) {
      console.error('获取账号分组失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取账号分组失败')
    }
  },

  // 获取所有机器
  async getAllMachines(): Promise<Machine[]> {
    try {
      const response = await http.get<ApiResponse<Machine[]>>('/machines')
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.message || '获取机器列表失败')
    } catch (error: any) {
      console.error('获取机器列表失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取机器列表失败')
    }
  },

  // 根据serial获取机器
  async getMachineBySerial(serial: string): Promise<Machine> {
    try {
      const response = await http.get<ApiResponse<Machine>>(`/machines/${serial}`)
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.message || '获取机器信息失败')
    } catch (error: any) {
      console.error('获取机器信息失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取机器信息失败')
    }
  },

  // 创建新机器
  async createMachine(machineData: CreateMachineRequest): Promise<Machine> {
    try {
      const response = await http.post<ApiResponse<Machine>>('/machines', machineData)
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.message || '创建机器失败')
    } catch (error: any) {
      console.error('创建机器失败:', error)
      throw new Error(error.response?.data?.message || error.message || '创建机器失败')
    }
  },

  // 更新机器信息
  async updateMachine(serial: string, machineData: UpdateMachineRequest): Promise<Machine> {
    try {
      const response = await http.put<ApiResponse<Machine>>(`/machines/${serial}`, machineData)
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.message || '更新机器失败')
    } catch (error: any) {
      console.error('更新机器失败:', error)
      throw new Error(error.response?.data?.message || error.message || '更新机器失败')
    }
  },

  // 删除机器
  async deleteMachine(serial: string): Promise<void> {
    try {
      const response = await http.delete<ApiResponse<void>>(`/machines/${serial}`)
      if (!response.data.success) {
        throw new Error(response.data.message || '删除机器失败')
      }
    } catch (error: any) {
      console.error('删除机器失败:', error)
      throw new Error(error.response?.data?.message || error.message || '删除机器失败')
    }
  },

  // 搜索机器
  async searchMachines(searchParams: SearchMachineRequest): Promise<Machine[]> {
    try {
      const response = await http.get<ApiResponse<Machine[]>>('/machines/search', {
        params: searchParams
      })
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.message || '搜索机器失败')
    } catch (error: any) {
      console.error('搜索机器失败:', error)
      throw new Error(error.response?.data?.message || error.message || '搜索机器失败')
    }
  },

  // 获取所有arcade信息
  async getAllArcades(): Promise<any[]> {
    try {
      const response = await http.get<ApiResponse<any[]>>('/machines/arcades')
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.message || '获取arcade列表失败')
    } catch (error: any) {
      console.error('获取arcade列表失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取arcade列表失败')
    }
  }
}

// 数据转换工具函数
export const dataTransform = {
  // 将后端Machine数据转换为前端Account格式
  machineToAccount(machine: Machine): Account {
    return {
      serial: machine.serial,
      game: machine.game || 'SDHD',
      country: machine.country || 'JPN',
      otaEnable: machine.ota_enable || false,
      isCab: machine.is_cab || false,
      note: machine.memo,
      arcadeName: machine.arcade_info?.name
    }
  },

  // 将前端Account数据转换为后端CreateMachineRequest格式
  accountToCreateRequest(account: Account, groupName: string): CreateMachineRequest {
    return {
      serial: account.serial,
      game: account.game,
      country: account.country,
      arcadeName: groupName,
      memo: account.note,
      ota_enable: account.otaEnable,
      is_cab: account.isCab
    }
  },

  // 将前端Account数据转换为后端UpdateMachineRequest格式
  accountToUpdateRequest(account: Account, groupName?: string): UpdateMachineRequest {
    return {
      game: account.game,
      country: account.country,
      arcadeName: groupName,
      memo: account.note,
      ota_enable: account.otaEnable,
      is_cab: account.isCab
    }
  }
}

export default keychipApi