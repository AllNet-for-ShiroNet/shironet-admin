// src/chuni/chuni.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChuniProfile } from './entities/chuni-profile.entity';
import { ChuniScore } from './entities/chuni-score.entity';
import { ChuniItem } from './entities/chuni-item.entity';
import { AimeUser } from '../user/entities/aime-user.entity';

@Injectable()
export class ChuniService {
  constructor(
    @InjectRepository(ChuniProfile)
    private profileRepository: Repository<ChuniProfile>,
    @InjectRepository(ChuniScore)
    private scoreRepository: Repository<ChuniScore>,
    @InjectRepository(ChuniItem)
    private itemRepository: Repository<ChuniItem>,
    @InjectRepository(AimeUser)
    private userRepository: Repository<AimeUser>,
  ) {}

  /**
   * 获取所有有CHUNITHM数据的用户列表
   */
  async getAllChuniUsers() {
    // 查询所有有profile的用户，获取每个用户最新的profile
    const profiles = await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.id IN (SELECT MAX(id) FROM chuni_profile_data GROUP BY user)')
      .orderBy('profile.userId', 'ASC')
      .getMany();

    // 格式化返回数据
    return profiles.map(profile => ({
      id: profile.userId,
      username: profile.user?.username || `User${profile.userId}`,
      email: profile.user?.email || '',
      aimeCard: profile.user?.cards?.[0]?.access_code || null,
      chuniProfile: {
        level: profile.level,
        playerName: profile.userName || profile.userNameEx,
        playerRating: profile.playerRating,
        highestRating: profile.highestRating,
        playCount: profile.playCount,
        lastPlayDate: profile.lastPlayDate,
        version: profile.version,
      }
    }));
  }

  /**
   * 获取用户的所有CHUNITHM数据
   */
  async getUserChuniData(userId: number) {
    // 获取玩家档案（最新版本）
    const profile = await this.profileRepository.findOne({
      where: { userId },
      order: { version: 'DESC' },
    });

    // 获取玩家成绩（不限制数量）
    const scores = await this.scoreRepository.find({
      where: { userId },
      order: { scoreMax: 'DESC' },
    });

    // 获取企鹅道具 (itemId in (8000, 8010, 8020, 8030) and itemKind = 5)
    const penguinItems = await this.itemRepository
      .createQueryBuilder('item')
      .where('item.user = :userId', { userId })
      .andWhere('item.itemId IN (:...itemIds)', { itemIds: [8000, 8010, 8020, 8030] })
      .andWhere('item.itemKind = :itemKind', { itemKind: 5 })
      .getMany();

    // 企鹅道具名称映射
    const penguinNames: Record<number, string> = {
      8000: '金企鹅',
      8020: '魂企鹅',
      8010: '银企鹅',
      8030: '彩企鹅',
    };

    // 格式化返回数据
    return {
      profile: profile ? this.formatProfile(profile) : null,
      scores: scores.map(score => this.formatScore(score)),
      penguins: penguinItems.map(item => ({
        id: item.id,
        itemId: item.itemId,
        itemName: penguinNames[item.itemId] || `未知道具 (${item.itemId})`,
        stock: item.stock,
        itemKind: item.itemKind,
      })),
    };
  }

  /**
   * 获取玩家档案
   */
  async getUserProfile(userId: number) {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      order: { version: 'DESC' },
    });

    if (!profile) {
      throw new NotFoundException('未找到玩家档案数据');
    }

    return this.formatProfile(profile);
  }

  /**
   * 获取玩家成绩
   */
  async getUserScores(userId: number, limit: number = 50) {
    const scores = await this.scoreRepository.find({
      where: { userId },
      order: { scoreMax: 'DESC' },
      take: limit,
    });

    return scores.map(score => this.formatScore(score));
  }

  /**
   * 获取玩家企鹅道具
   */
  async getUserPenguins(userId: number) {
    const penguinItems = await this.itemRepository
      .createQueryBuilder('item')
      .where('item.user = :userId', { userId })
      .andWhere('item.itemId IN (:...itemIds)', { itemIds: [8000, 8010, 8020, 8030] })
      .andWhere('item.itemKind = :itemKind', { itemKind: 5 })
      .getMany();

    const penguinNames: Record<number, string> = {
      8000: '金企鹅',
      8020: '魂企鹅',
      8010: '银企鹅',
      8030: '彩企鹅',
    };

    return penguinItems.map(item => ({
      id: item.id,
      itemId: item.itemId,
      itemName: penguinNames[item.itemId] || `未知道具 (${item.itemId})`,
      stock: item.stock,
      itemKind: item.itemKind,
    }));
  }

  /**
   * 格式化档案数据
   */
  private formatProfile(profile: ChuniProfile) {
    return {
      id: profile.id,
      userId: profile.userId,
      version: profile.version,
      level: profile.level,
      playerName: profile.userName || profile.userNameEx || `User${profile.userId}`,
      playerRating: profile.playerRating || 0,
      highestRating: profile.highestRating || 0,
      playCount: profile.playCount || 0,
      totalPoint: profile.totalPoint || 0,
      characterId: profile.characterId,
      lastPlayDate: profile.lastPlayDate,
      friendCount: profile.friendCount || 0,
      // 添加更多字段
      nameplateId: profile.nameplateId,
      mapIconId: profile.mapIconId,
      trophyId: profile.trophyId,
      teamId: profile.teamId,
      lastPlaceName: profile.lastPlaceName,
      lastRegionName: profile.lastRegionName,
      totalBasicHighScore: profile.totalBasicHighScore,
      totalExpertHighScore: profile.totalExpertHighScore,
      totalMasterHighScore: profile.totalMasterHighScore,
      totalRepertoireCount: profile.totalRepertoireCount,
      netBattlePlayCount: profile.netBattlePlayCount,
      netBattleWinCount: profile.netBattleWinCount,
      netBattleLoseCount: profile.netBattleLoseCount,
      voiceId: profile.voiceId,
      stageId: profile.stageId,
    };
  }

  /**
   * 格式化成绩数据
   */
  private formatScore(score: ChuniScore) {
    return {
      id: score.id,
      musicId: score.musicId,
      level: score.level,
      scoreMax: score.scoreMax || 0,
      playCount: score.playCount || 0,
      isFullCombo: !!score.isFullCombo,
      isAllJustice: !!score.isAllJustice,
      maxComboCount: score.maxComboCount || 0,
      scoreRank: score.scoreRank,
      missCount: score.missCount || 0,
    };
  }

  /**
   * 更新用户档案
   */
  async updateProfile(userId: number, updateData: {
    characterId?: number;
    nameplateId?: number;
    mapIconId?: number;
    voiceId?: number;
    stageId?: number;
  }) {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      order: { version: 'DESC' },
    });

    if (!profile) {
      throw new NotFoundException('未找到玩家档案数据');
    }

    // 更新字段
    if (updateData.characterId !== undefined) profile.characterId = updateData.characterId;
    if (updateData.nameplateId !== undefined) profile.nameplateId = updateData.nameplateId;
    if (updateData.mapIconId !== undefined) profile.mapIconId = updateData.mapIconId;
    if (updateData.voiceId !== undefined) profile.voiceId = updateData.voiceId;
    if (updateData.stageId !== undefined) profile.stageId = updateData.stageId;

    await this.profileRepository.save(profile);
    return this.formatProfile(profile);
  }

  /**
   * 更新用户成绩
   */
  async updateScore(userId: number, scoreId: number, updateData: {
    scoreMax?: number;
    isFullCombo?: boolean;
    isAllJustice?: boolean;
    maxComboCount?: number;
    missCount?: number;
  }) {
    const score = await this.scoreRepository.findOne({
      where: { id: scoreId, userId },
    });

    if (!score) {
      throw new NotFoundException('未找到成绩数据');
    }

    // 更新字段
    if (updateData.scoreMax !== undefined) score.scoreMax = updateData.scoreMax;
    if (updateData.isFullCombo !== undefined) score.isFullCombo = updateData.isFullCombo;
    if (updateData.isAllJustice !== undefined) score.isAllJustice = updateData.isAllJustice;
    if (updateData.maxComboCount !== undefined) score.maxComboCount = updateData.maxComboCount;
    if (updateData.missCount !== undefined) score.missCount = updateData.missCount;

    await this.scoreRepository.save(score);
    return this.formatScore(score);
  }
}
