// src/api/chuni.ts
import http from '@/utils/http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// 类型定义
export interface ChuniProfile {
  id: number
  userId: number
  version: number
  level: number
  playerName: string
  playerRating: number
  highestRating: number
  playCount: number
  totalPoint: number
  characterId?: number
  lastPlayDate?: string
  friendCount: number
  nameplateId?: number
  mapIconId?: number
  trophyId?: number
  teamId?: number
  lastPlaceName?: string
  lastRegionName?: string
  totalBasicHighScore?: number
  totalExpertHighScore?: number
  totalMasterHighScore?: number
  totalRepertoireCount?: number
  netBattlePlayCount: number
  netBattleWinCount: number
  netBattleLoseCount: number
  voiceId?: number
  stageId?: number
}

export interface ChuniScore {
  id: number
  musicId: number
  level: number
  scoreMax: number
  playCount: number
  isFullCombo: boolean
  isAllJustice: boolean
  maxComboCount: number
  scoreRank?: number
  missCount: number
}

export interface PenguinItem {
  id: number
  itemId: number
  itemName: string
  stock: number
  itemKind: number
}

export interface UserChuniData {
  profile: ChuniProfile | null
  scores: ChuniScore[]
  penguins: PenguinItem[]
}

export interface ChuniUser {
  id: number
  username: string
  email: string
  aimeCard: string | null
  chuniProfile: {
    level: number
    playerName: string
    playerRating: number
    highestRating: number
    playCount: number
    lastPlayDate: string
    version: number
  }
}

// API 方法
export const chuniApi = {
  /**
   * 获取所有有CHUNITHM数据的用户列表
   */
  async getAllChuniUsers(): Promise<ChuniUser[]> {
    const response = await http.get(`/chuni/users`)
    return response.data.data
  },

  /**
   * 获取用户的所有CHUNITHM数据
   */
  async getUserChuniData(userId: number): Promise<UserChuniData> {
    const response = await http.get(`/chuni/user/${userId}`)
    return response.data.data
  },

  /**
   * 获取用户档案
   */
  async getUserProfile(userId: number): Promise<ChuniProfile> {
    const response = await http.get(`/chuni/user/${userId}/profile`)
    return response.data.data
  },

  /**
   * 获取用户成绩
   */
  async getUserScores(userId: number, limit?: number): Promise<ChuniScore[]> {
    const response = await http.get(`/chuni/user/${userId}/scores`, {
      params: { limit }
    })
    return response.data.data
  },

  /**
   * 获取用户企鹅道具
   */
  async getUserPenguins(userId: number): Promise<PenguinItem[]> {
    const response = await http.get(`/chuni/user/${userId}/penguins`)
    return response.data.data
  },

  /**
   * 更新用户档案
   */
  async updateUserProfile(userId: number, updateData: {
    characterId?: number
    nameplateId?: number
    mapIconId?: number
    voiceId?: number
    stageId?: number
  }): Promise<ChuniProfile> {
    const response = await http.put(`/chuni/user/${userId}/profile`, updateData)
    return response.data.data
  },

  /**
   * 更新用户成绩
   */
  async updateUserScore(userId: number, scoreId: number, updateData: {
    scoreMax?: number
    isFullCombo?: boolean
    isAllJustice?: boolean
    maxComboCount?: number
    missCount?: number
  }): Promise<ChuniScore> {
    const response = await http.put(`/chuni/user/${userId}/score/${scoreId}`, updateData)
    return response.data.data
  }
}
