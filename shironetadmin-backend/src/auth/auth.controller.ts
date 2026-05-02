// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { User, UserRole } from './entities/user.entity';
import { Auth } from './decorators/auth.decorator';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refresh_token') refreshToken: string): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshToken);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { message: '注销成功' };
  }

  @Post('create-user')
  @Auth(UserRole.ADMIN)
  async createUser(
    @Body()
    createUserDto: {
      username: string;
      nickname: string;
      password: string;
      role?: string;
    },
    @CurrentUser() currentUser: User,
  ) {
    return this.authService.createUser(createUserDto, currentUser);
  }

  @Get('users')
  @Auth(UserRole.ADMIN)
  async getAllUsers(@CurrentUser() _user: User) {
    return this.authService.getAllUsers();
  }
}
