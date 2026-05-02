// src/chuni/chuni.controller.ts
import { Controller, Get, Param, ParseIntPipe, Query, Put, Body } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ChuniService } from './chuni.service';
import { AdminOnly } from '../auth/decorators/auth.decorator';

@AdminOnly()
@ApiBearerAuth()
@Controller('chuni')
export class ChuniController {
  constructor(private readonly chuniService: ChuniService) {}

  /**
   * 获取所有有CHUNITHM数据的用户列表
   */
  @Get('users')
  async getAllChuniUsers() {
    const users = await this.chuniService.getAllChuniUsers();
    return {
      success: true,
      data: users,
      message: '获取成功'
    };
  }

  /**
   * 获取用户的所有CHUNITHM数据（档案+成绩+企鹅）
   */
  @Get('user/:userId')
  async getUserChuniData(@Param('userId', ParseIntPipe) userId: number) {
    const data = await this.chuniService.getUserChuniData(userId);
    return {
      success: true,
      data: data,
      message: '获取成功'
    };
  }

  /**
   * 获取用户档案
   */
  @Get('user/:userId/profile')
  async getUserProfile(@Param('userId', ParseIntPipe) userId: number) {
    const profile = await this.chuniService.getUserProfile(userId);
    return {
      success: true,
      data: profile,
      message: '获取档案成功'
    };
  }

  /**
   * 获取用户成绩
   */
  @Get('user/:userId/scores')
  async getUserScores(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: number
  ) {
    const scores = await this.chuniService.getUserScores(userId, limit);
    return {
      success: true,
      data: scores,
      message: '获取成绩成功'
    };
  }

  /**
   * 获取用户企鹅道具
   */
  @Get('user/:userId/penguins')
  async getUserPenguins(@Param('userId', ParseIntPipe) userId: number) {
    const penguins = await this.chuniService.getUserPenguins(userId);
    return {
      success: true,
      data: penguins,
      message: '获取企鹅道具成功'
    };
  }

  /**
   * 更新用户档案
   */
  @Put('user/:userId/profile')
  async updateUserProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateData: {
      characterId?: number;
      nameplateId?: number;
      mapIconId?: number;
      voiceId?: number;
      stageId?: number;
    }
  ) {
    const profile = await this.chuniService.updateProfile(userId, updateData);
    return {
      success: true,
      data: profile,
      message: '更新档案成功'
    };
  }

  /**
   * 更新用户成绩
   */
  @Put('user/:userId/score/:scoreId')
  async updateUserScore(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('scoreId', ParseIntPipe) scoreId: number,
    @Body() updateData: {
      scoreMax?: number;
      isFullCombo?: boolean;
      isAllJustice?: boolean;
      maxComboCount?: number;
      missCount?: number;
    }
  ) {
    const score = await this.chuniService.updateScore(userId, scoreId, updateData);
    return {
      success: true,
      data: score,
      message: '更新成绩成功'
    };
  }
}
