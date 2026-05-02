import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { AimeUser, UserRole } from './entities/aime-user.entity';
import { AimeCard } from './entities/aime-card.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { CardActionDto } from './dto/card-action.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(AimeUser)
    private userRepository: Repository<AimeUser>,
    @InjectRepository(AimeCard)
    private cardRepository: Repository<AimeCard>,
  ) {}

  // 获取用户列表
  async findAll(query: UserQueryDto): Promise<{ users: UserResponseDto[], total: number }> {
    const { search, role, cardStatus, page = 1, limit = 10 } = query;
    
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.cards', 'card')
      .orderBy('user.id', 'ASC');

    // 搜索用户名或邮箱
    if (search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // 按权限组筛选
    if (role) {
      const permissions = this.roleToPermissions(role);
      if (role === 'user') {
        // 普通用户：排除超管(255)、管理员(145)、可信用户(125)
        queryBuilder.andWhere('user.permissions NOT IN (:...excludePermissions)', {
          excludePermissions: [255, 145, 125]
        });
      } else {
        // 特定角色：精确匹配权限值
        queryBuilder.andWhere('user.permissions = :permissions', { permissions });
      }
    }

    // 按卡片状态筛选
    if (cardStatus) {
      switch (cardStatus) {
        case 'locked':
          queryBuilder.andWhere('card.is_locked = 1');
          break;
        case 'banned':
          queryBuilder.andWhere('card.is_banned = 1');
          break;
        case 'normal':
          queryBuilder.andWhere('(card.is_locked = 0 AND card.is_banned = 0)');
          break;
      }
    }

    // 先获取总数
    const total = await queryBuilder.getCount();

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // 获取数据
    const users = await queryBuilder.getMany();

    // 转换为响应 DTO
    const userResponses: UserResponseDto[] = users.map(user => this.transformUserToResponse(user));

    return { users: userResponses, total };
  }

  // 根据ID获取用户
  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['cards']
    });

    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }

    return this.transformUserToResponse(user);
  }

  // 创建用户
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { username, email, aimeCard, role, cardLocked = false, cardBanned = false } = createUserDto;

    // 检查用户名是否已存在
    if (username) {
      const existingUser = await this.userRepository.findOne({
        where: { username }
      });
      if (existingUser) {
        throw new BadRequestException('用户名已存在');
      }
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingUser = await this.userRepository.findOne({
        where: { email }
      });
      if (existingUser) {
        throw new BadRequestException('邮箱已存在');
      }
    }

    // 如果提供了aimeCard，检查是否已存在
    if (aimeCard) {
      const existingCard = await this.cardRepository.findOne({
        where: { access_code: aimeCard }
      });
      if (existingCard) {
        throw new BadRequestException('AIME卡号已存在');
      }
    }

    // 创建用户 - 确保 permissions 字段被正确设置
    const permissions = this.roleToPermissions(role);
    const user = this.userRepository.create({
      username,
      email,
      permissions,
    });

    console.log(`创建用户：用户名=${username}, 角色=${role}, 权限值=${permissions}`);

    const savedUser = await this.userRepository.save(user);

    // 如果提供了aimeCard，创建卡片
    if (aimeCard) {
      const card = this.cardRepository.create({
        access_code: aimeCard,
        user: savedUser,
        is_locked: cardLocked ? 1 : 0,
        is_banned: cardBanned ? 1 : 0,
      });
      await this.cardRepository.save(card);
      console.log(`创建卡片：卡号=${aimeCard}, 用户ID=${savedUser.id}`);
    }

    return this.findOne(savedUser.id);
  }

  // 更新用户 - 完全安全版本（只更新字段，绝不删除重建）
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['cards']
    });

    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }

    const { username, email, aimeCard, role, cardLocked, cardBanned } = updateUserDto;

    // 标记是否需要保存用户
    let needsSaveUser = false;

    // ==================== 更新用户基本信息 ====================
    
    // 更新用户名（只在值改变时）
    if (username !== undefined && user.username !== username) {
      // 检查新用户名是否已被其他用户使用
      const existingUser = await this.userRepository.findOne({
        where: { username }
      });
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('用户名已被其他用户使用');
      }
      console.log(`更新用户名：${user.username} -> ${username}`);
      user.username = username;
      needsSaveUser = true;
    }

    // 更新邮箱（只在值改变时）
    if (email !== undefined && user.email !== email) {
      // 检查新邮箱是否已被其他用户使用
      const existingUser = await this.userRepository.findOne({
        where: { email }
      });
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('邮箱已被其他用户使用');
      }
      console.log(`更新邮箱：${user.email} -> ${email}`);
      user.email = email;
      needsSaveUser = true;
    }

    // 更新权限（只在值改变时）
    if (role !== undefined) {
      const newPermissions = this.roleToPermissions(role);
      if (user.permissions !== newPermissions) {
        console.log(`更新权限：${user.permissions} -> ${newPermissions} (${role})`);
        user.permissions = newPermissions;
        needsSaveUser = true;
      }
    }

    // 只在有变化时才保存用户
    if (needsSaveUser) {
      await this.userRepository.save(user);
      console.log(`用户信息已更新：ID=${id}`);
    } else {
      console.log(`用户信息无变化，跳过更新：ID=${id}`);
    }

    // ==================== 更新 AIME 卡信息 ====================
    
    const existingCard = user.cards && user.cards.length > 0 ? user.cards[0] : null;
    let needsSaveCard = false;

    if (aimeCard !== undefined) {
      if (aimeCard === '' || aimeCard === null) {
        // ⚠️ 用户想要解绑卡片（删除操作）
        if (existingCard) {
          console.warn(`警告：准备删除卡片 ID=${existingCard.id}, access_code=${existingCard.access_code}`);
          console.warn(`这将导致所有关联到 card_id=${existingCard.id} 的游戏数据无法访问！`);
          // 如果你不想删除卡片，可以注释掉下面这行，改为标记为"未激活"
          await this.cardRepository.remove(existingCard);
          console.log(`卡片已删除：ID=${existingCard.id}`);
        }
      } else {
        // 用户想要绑定或更换卡片
        if (existingCard) {
          // ✅ 用户已有卡片，只更新 access_code（不删除重建）
          if (existingCard.access_code !== aimeCard) {
            // 检查新卡号是否已被其他卡片使用
            const cardWithSameCode = await this.cardRepository.findOne({
              where: { access_code: aimeCard }
            });
            if (cardWithSameCode && cardWithSameCode.id !== existingCard.id) {
              throw new BadRequestException('AIME卡号已被其他用户使用');
            }

            console.log(`更新卡号：${existingCard.access_code} -> ${aimeCard} (ID=${existingCard.id})`);
            existingCard.access_code = aimeCard;
            needsSaveCard = true;
          } else {
            console.log(`卡号无变化，跳过更新：${aimeCard}`);
          }
        } else {
          // ✅ 用户之前没有卡片，创建新卡片
          const cardWithSameCode = await this.cardRepository.findOne({
            where: { access_code: aimeCard }
          });
          if (cardWithSameCode) {
            throw new BadRequestException('AIME卡号已存在');
          }

          console.log(`创建新卡片：卡号=${aimeCard}, 用户ID=${id}`);
          const newCard = this.cardRepository.create({
            access_code: aimeCard,
            user: user,
            is_locked: cardLocked ? 1 : 0,
            is_banned: cardBanned ? 1 : 0,
          });
          await this.cardRepository.save(newCard);
          console.log(`新卡片已创建：ID=${newCard.id}`);
          
          // 新卡片已保存，直接返回
          return this.findOne(id);
        }
      }
    }

    // 更新卡片锁定状态（只在有卡片且值改变时）
    if (existingCard && cardLocked !== undefined) {
      const newLockedValue = cardLocked ? 1 : 0;
      if (existingCard.is_locked !== newLockedValue) {
        console.log(`更新卡片锁定状态：${existingCard.is_locked} -> ${newLockedValue}`);
        existingCard.is_locked = newLockedValue;
        needsSaveCard = true;
      }
    }

    // 更新卡片封禁状态（只在有卡片且值改变时）
    if (existingCard && cardBanned !== undefined) {
      const newBannedValue = cardBanned ? 1 : 0;
      if (existingCard.is_banned !== newBannedValue) {
        console.log(`更新卡片封禁状态：${existingCard.is_banned} -> ${newBannedValue}`);
        existingCard.is_banned = newBannedValue;
        needsSaveCard = true;
      }
    }

    // 只在有变化时才保存卡片
    if (existingCard && needsSaveCard) {
      await this.cardRepository.save(existingCard);
      console.log(`卡片已更新：ID=${existingCard.id}, access_code=${existingCard.access_code}`);
    } else if (existingCard) {
      console.log(`卡片无变化，跳过更新：ID=${existingCard.id}`);
    }

    return this.findOne(id);
  }

  // 删除用户
  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ 
      where: { id },
      relations: ['cards']
    });
    
    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }

    // ⚠️ 警告：删除用户会级联删除其关联的卡片数据
    if (user.cards && user.cards.length > 0) {
      console.warn(`警告：准备删除用户 ${user.username}，这将级联删除 ${user.cards.length} 张卡片`);
      user.cards.forEach(card => {
        console.warn(`  - 卡片 ID=${card.id}, access_code=${card.access_code}`);
      });
    }
    
    await this.userRepository.remove(user);
    console.log(`用户已删除：ID=${id}, username=${user.username}`);
  }

  // 切换卡片锁定状态
  async toggleCardLock(userId: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['cards']
    });

    if (!user) {
      throw new NotFoundException(`用户 ID ${userId} 不存在`);
    }

    if (!user.cards || user.cards.length === 0) {
      throw new BadRequestException('用户没有绑定AIME卡');
    }

    const card = user.cards[0];
    const newValue = card.is_locked === 1 ? 0 : 1;
    console.log(`切换卡片锁定状态：${card.is_locked} -> ${newValue} (卡片ID=${card.id})`);
    
    card.is_locked = newValue;
    await this.cardRepository.save(card);

    return this.findOne(userId);
  }

  // 切换卡片封禁状态
  async toggleCardBan(userId: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['cards']
    });

    if (!user) {
      throw new NotFoundException(`用户 ID ${userId} 不存在`);
    }

    if (!user.cards || user.cards.length === 0) {
      throw new BadRequestException('用户没有绑定AIME卡');
    }

    const card = user.cards[0];
    const newValue = card.is_banned === 1 ? 0 : 1;
    console.log(`切换卡片封禁状态：${card.is_banned} -> ${newValue} (卡片ID=${card.id})`);
    
    card.is_banned = newValue;
    await this.cardRepository.save(card);

    return this.findOne(userId);
  }

  // 更新用户最后登录时间
  async updateLastLoginDate(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`用户 ID ${userId} 不存在`);
    }

    // ✅ 只更新 last_login_date 字段
    const now = new Date();
    if (user.last_login_date?.getTime() !== now.getTime()) {
      user.last_login_date = now;
      await this.userRepository.save(user);
      console.log(`更新用户最后登录时间：ID=${userId}`);
    }
  }

  // 根据访问码查找卡片
  async findCardByAccessCode(accessCode: string): Promise<AimeCard | null> {
    return await this.cardRepository.findOne({
      where: { access_code: accessCode },
      relations: ['user']
    });
  }

  // 辅助方法：角色转权限值
  private roleToPermissions(role: UserRole): number {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 255;
      case UserRole.ADMIN:
        return 145;
      case UserRole.TRUST_USER:
        return 125;
      case UserRole.USER:
      default:
        return 1;
    }
  }

  // 辅助方法：权限值转角色
  private permissionsToRole(permissions: number): UserRole {
    switch (permissions) {
      case 255:
        return UserRole.SUPER_ADMIN;
      case 145:
        return UserRole.ADMIN;
      case 125:
        return UserRole.TRUST_USER;
      default:
        return UserRole.USER;
    }
  }

  // 辅助方法：转换用户实体为响应DTO
  private transformUserToResponse(user: AimeUser): UserResponseDto {
    const primaryCard = user.cards && user.cards.length > 0 ? user.cards[0] : null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: this.permissionsToRole(user.permissions),           
      aimeCard: primaryCard?.access_code || '',
      cardLocked: primaryCard ? primaryCard.is_locked === 1 : false,
      cardBanned: primaryCard ? primaryCard.is_banned === 1 : false,
      createdAt: user.created_date?.toISOString() || '',
      lastLogin: user.last_login_date?.toISOString() || null,   
      permissions: user.permissions,                             
    };
  }
}