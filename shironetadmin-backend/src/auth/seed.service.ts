// src/auth/seed.service.ts
import { Injectable, OnModuleInit, ConsoleLogger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new ConsoleLogger(SeedService.name);

  constructor(
    @InjectRepository(User, 'shironet')
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultUser();
  }

  /**
   * 创建默认管理员账户
   * 仅在用户表为空时执行
   */
  private async seedDefaultUser() {
    try {
      // 检查用户表是否为空
      const userCount = await this.userRepository.count();

      if (userCount > 0) {
        this.logger.log('用户表已有数据，跳过初始化');
        return;
      }

      this.logger.warn('========================================');
      this.logger.warn('检测到用户表为空，正在创建默认管理员账户...');
      this.logger.warn('========================================');

      // 生成随机密码（12位，包含大小写字母、数字和特殊字符）
      const defaultPassword = this.generateRandomPassword(12);

      // 加密密码
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // 创建默认管理员
      const defaultAdmin = this.userRepository.create({
        username: 'admin',
        nickname: '系统管理员',
        password: hashedPassword,
        role: UserRole.ADMIN,
      });

      await this.userRepository.save(defaultAdmin);

      // 输出账号密码信息
      this.logger.log('');
      this.logger.log('✅ 默认管理员账户创建成功！');
      this.logger.log('----------------------------------------');
      this.logger.log(`📝 用户名: admin`);
      this.logger.log(`🔑 密码:   ${defaultPassword}`);
      this.logger.log('----------------------------------------');
      this.logger.warn('⚠️  重要提示：');
      this.logger.warn('   1. 请立即登录并修改默认密码！');
      this.logger.warn('   2. 此密码只会显示一次，请妥善保存！');
      this.logger.warn('   3. 建议在生产环境中禁用此功能。');
      this.logger.warn('========================================');
      this.logger.log('');
    } catch (error) {
      this.logger.error('创建默认管理员账户失败:', error);
      throw error;
    }
  }

  /**
   * 生成随机密码
   * @param length 密码长度
   * @returns 随机密码
   */
  private generateRandomPassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + specialChars;
    let password = '';

    // 确保至少包含一个每种类型的字符
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // 填充剩余长度
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // 打乱字符顺序
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
