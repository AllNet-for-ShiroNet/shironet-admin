import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AdminOnly } from '../auth/decorators/auth.decorator';

@AdminOnly()
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 获取用户列表
  @Get()
  async findAll(@Query() query: UserQueryDto): Promise<{
    success: boolean;
    data: { users: UserResponseDto[], total: number };
    message: string;
  }> {
    const result = await this.userService.findAll(query);
    return {
      success: true,
      data: result,
      message: '获取用户列表成功'
    };
  }

  // 获取单个用户
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{
    success: boolean;
    data: UserResponseDto;
    message: string;
  }> {
    const user = await this.userService.findOne(id);
    return {
      success: true,
      data: user,
      message: '获取用户信息成功'
    };
  }

  // 创建用户
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<{
    success: boolean;
    data: UserResponseDto;
    message: string;
  }> {
    const user = await this.userService.create(createUserDto);
    return {
      success: true,
      data: user,
      message: '用户创建成功'
    };
  }

  // 更新用户
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<{
    success: boolean;
    data: UserResponseDto;
    message: string;
  }> {
    const user = await this.userService.update(id, updateUserDto);
    return {
      success: true,
      data: user,
      message: '用户更新成功'
    };
  }

  // 删除用户
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.userService.remove(id);
    return {
      success: true,
      message: '用户删除成功'
    };
  }

  // 切换卡片锁定状态
  @Patch(':id/toggle-lock')
  async toggleCardLock(@Param('id', ParseIntPipe) id: number): Promise<{
    success: boolean;
    data: UserResponseDto;
    message: string;
  }> {
    const user = await this.userService.toggleCardLock(id);
    return {
      success: true,
      data: user,
      message: `卡片${user.cardLocked ? '锁定' : '解锁'}成功`
    };
  }

  // 切换卡片封禁状态
  @Patch(':id/toggle-ban')
  async toggleCardBan(@Param('id', ParseIntPipe) id: number): Promise<{
    success: boolean;
    data: UserResponseDto;
    message: string;
  }> {
    const user = await this.userService.toggleCardBan(id);
    return {
      success: true,
      data: user,
      message: `卡片${user.cardBanned ? '封禁' : '解封'}成功`
    };
  }

  // 根据访问码查找用户（用于登录验证等）
  @Get('by-access-code/:accessCode')
  async findByAccessCode(@Param('accessCode') accessCode: string): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    const card = await this.userService.findCardByAccessCode(accessCode);
    if (!card) {
      return {
        success: false,
        data: null,
        message: 'AIME卡不存在'
      };
    }

    // 更新最后登录时间
    await this.userService.updateLastLoginDate(card.userId);

    return {
      success: true,
      data: {
        user: card.user,
        card: card,
        isActive: card.isActive
      },
      message: '查找成功'
    };
  }
}