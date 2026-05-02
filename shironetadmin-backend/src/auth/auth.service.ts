// src/auth/auth.service.ts
import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import * as bcrypt from 'bcrypt';
  import { ConfigService } from '@nestjs/config';
  import { User, UserRole } from './entities/user.entity';
  import { LoginDto } from './dto/login.dto';
  import { AuthResponseDto } from './dto/auth-response.dto';
  
  // 内联定义 JwtPayload 接口
  export interface JwtPayload {
    sub: number;
    username: string;
    role: string;
    iat?: number;
    exp?: number;
  }
  
  // 创建用户 DTO
  export interface CreateUserDto {
    username: string;
    nickname: string;
    password: string;
    role?: string;
  }
  
  @Injectable()
  export class AuthService {
    constructor(
      @InjectRepository(User, 'shironet') // 指定使用 shironet 数据库连接
      private readonly userRepository: Repository<User>,
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
    ) {}
  
    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
      const { username, password } = loginDto;
  
      // 查找用户
      const user = await this.userRepository.findOne({
        where: { username },
      });
  
      if (!user) {
        throw new UnauthorizedException('用户名或密码错误');
      }
  
      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        throw new UnauthorizedException('用户名或密码错误');
      }
  
      // 更新最后登录时间
      await this.userRepository.update(user.id, {
        lastLoginAt: new Date(),
      });
  
      // 生成 JWT Token
      const tokens = await this.generateTokens(user);
  
      return {
        ...tokens,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
        },
      };
    }
  
    async validateUser(payload: JwtPayload): Promise<User> {
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });
  
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }
  
      return user;
    }
  
    async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
      try {
        const refreshSecret =
          this.configService.get<string>('JWT_REFRESH_SECRET') ?? process.env.JWT_REFRESH_SECRET;
        const payload = this.jwtService.verify(refreshToken, {
          secret: refreshSecret,
        });
  
        const user = await this.userRepository.findOne({
          where: { id: payload.sub },
        });
  
        if (!user) {
          throw new UnauthorizedException('用户不存在');
        }
  
        const tokens = await this.generateTokens(user);
  
        return {
          ...tokens,
          user: {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            role: user.role,
          },
        };
      } catch (error) {
        throw new UnauthorizedException('无效的刷新令牌');
      }
    }
  
    // 只有管理员可以创建用户
    async createUser(createUserDto: CreateUserDto, currentUser: User): Promise<AuthResponseDto> {
      const { username, nickname, password, role } = createUserDto;
  
      // 检查用户名是否已存在
      const existingUser = await this.userRepository.findOne({
        where: { username },
      });
  
      if (existingUser) {
        throw new ConflictException('用户名已存在');
      }
  
      // 验证角色
      const userRole = role === 'admin' ? UserRole.ADMIN : UserRole.USER;
  
      // 加密密码
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // 创建用户
      const user = this.userRepository.create({
        username,
        nickname,
        password: hashedPassword,
        role: userRole,
      });
  
      const savedUser = await this.userRepository.save(user);
  
      // 生成 JWT Token（给新创建的用户）
      const tokens = await this.generateTokens(savedUser);
  
      return {
        ...tokens,
        user: {
          id: savedUser.id,
          username: savedUser.username,
          nickname: savedUser.nickname,
          role: savedUser.role,
        },
      };
    }
  
    // 获取所有用户列表（只有管理员可以访问）
    async getAllUsers(): Promise<User[]> {
      return this.userRepository.find({
        select: ['id', 'username', 'nickname', 'role', 'createdAt', 'lastLoginAt'],
        order: { createdAt: 'DESC' },
      });
    }
  
    private async generateTokens(user: User) {
      const payload: JwtPayload = {
        sub: user.id,
        username: user.username,
        role: user.role,
      };

      const accessSecret = this.configService.get<string>('JWT_SECRET');
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
      const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          secret: accessSecret,
          expiresIn,
        }),
        this.jwtService.signAsync(payload, {
          secret: refreshSecret,
          expiresIn: refreshExpiresIn,
        }),
      ]);
  
      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    }
  
    async getUserById(id: number): Promise<User> {
      const user = await this.userRepository.findOne({
        where: { id },
      });
  
      if (!user) {
        throw new BadRequestException('用户不存在');
      }
  
      return user;
    }
  }