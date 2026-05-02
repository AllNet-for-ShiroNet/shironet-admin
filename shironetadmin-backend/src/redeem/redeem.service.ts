// src/redeem/redeem.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedeemCode } from './entities/redeem-code.entity';
import { RedeemCodeUsage } from './entities/redeem-code-usage.entity';
import { CreateRedeemCodeDto } from './dto/create-redeem-code.dto';
import { UpdateRedeemCodeDto } from './dto/update-redeem-code.dto';
import { BatchCreateRedeemCodeDto } from './dto/batch-create-redeem-code.dto';

@Injectable()
export class RedeemService {
  constructor(
    @InjectRepository(RedeemCode)
    private redeemCodeRepository: Repository<RedeemCode>,
    @InjectRepository(RedeemCodeUsage)
    private redeemCodeUsageRepository: Repository<RedeemCodeUsage>,
  ) {}

  // 生成随机兑换码
  private generateRandomCode(length: number = 20): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 检查兑换码是否唯一
  private async ensureCodeIsUnique(code: string, excludeId?: number): Promise<void> {
    const query = this.redeemCodeRepository.createQueryBuilder('code')
      .where('code.code = :code', { code });
    
    if (excludeId) {
      query.andWhere('code.id != :excludeId', { excludeId });
    }
    
    const existingCode = await query.getOne();
    if (existingCode) {
      throw new ConflictException('兑换码已存在');
    }
  }

  // 验证时间逻辑
  private validateTimeRange(startTime?: Date | string, endTime?: Date | string): void {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (start >= end) {
        throw new BadRequestException('开始时间必须早于结束时间');
      }
    }
  }

  // 获取所有兑换码（包含使用次数）
  async findAll(page: number = 1, limit: number = 10, search?: string, status?: string): Promise<{
    data: RedeemCode[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = this.redeemCodeRepository.createQueryBuilder('code')
      .leftJoin('code.usages', 'usage')
      .addSelect('COUNT(usage.id)', 'usedCount')
      .groupBy('code.id')
      .orderBy('code.created_at', 'DESC');

    // 搜索过滤
    if (search) {
      query.andWhere('code.code LIKE :search', { search: `%${search}%` });
    }

    // 状态过滤
    if (status === 'active') {
      query.andWhere('code.is_active = :active', { active: true })
           .andWhere('(code.end_time IS NULL OR code.end_time > NOW())');
    } else if (status === 'disabled') {
      query.andWhere('code.is_active = :active', { active: false });
    } else if (status === 'expired') {
      query.andWhere('code.end_time IS NOT NULL AND code.end_time <= NOW()');
    }

    // 分页
    const [rawResults, total] = await Promise.all([
      query
        .skip((page - 1) * limit)
        .take(limit)
        .getRawAndEntities(),
      query.getCount()
    ]);

    // 处理结果，添加使用次数
    const data = rawResults.entities.map((code, index) => ({
      ...code,
      usedCount: parseInt(rawResults.raw[index].usedCount) || 0,
    }));

    return {
      data,
      total,
      page,
      limit,
    };
  }

  // 根据ID获取兑换码详情
  async findOne(id: number): Promise<RedeemCode> {
    const code = await this.redeemCodeRepository.findOne({
      where: { id },
      relations: ['usages'],
    });

    if (!code) {
      throw new NotFoundException(`兑换码 ID ${id} 不存在`);
    }

    // 添加使用次数
    (code as any).usedCount = code.usages ? code.usages.length : 0;

    return code;
  }

  // 获取兑换码使用详情
  async getUsageDetails(id: number): Promise<{
    code: RedeemCode;
    usages: Array<{
      id: number;
      user_id: number;
      used_at: Date;
    }>;
  }> {
    const code = await this.findOne(id);
    
    const usages = await this.redeemCodeUsageRepository.find({
      where: { code_id: id },
      order: { used_at: 'DESC' },
    });

    return {
      code,
      usages: usages.map(usage => ({
        id: usage.id,
        user_id: usage.user_id,
        used_at: usage.used_at,
      })),
    };
  }

  // 创建兑换码
  async create(createRedeemCodeDto: CreateRedeemCodeDto): Promise<RedeemCode> {
    // 验证时间逻辑
    this.validateTimeRange(createRedeemCodeDto.start_time, createRedeemCodeDto.end_time);

    // 如果没有提供兑换码，自动生成
    if (!createRedeemCodeDto.code) {
      let generatedCode: string;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        generatedCode = this.generateRandomCode();
        attempts++;
        
        try {
          await this.ensureCodeIsUnique(generatedCode);
          break;
        } catch (error) {
          if (attempts >= maxAttempts) {
            throw new BadRequestException('生成唯一兑换码失败，请重试');
          }
        }
      } while (attempts < maxAttempts);
      
      createRedeemCodeDto.code = generatedCode;
    } else {
      // 检查兑换码是否已存在
      await this.ensureCodeIsUnique(createRedeemCodeDto.code);
    }

    const redeemCode = this.redeemCodeRepository.create({
      ...createRedeemCodeDto,
      start_time: createRedeemCodeDto.start_time ? new Date(createRedeemCodeDto.start_time) : null,
      end_time: createRedeemCodeDto.end_time ? new Date(createRedeemCodeDto.end_time) : null,
    });

    const savedCode = await this.redeemCodeRepository.save(redeemCode);
    
    // 添加使用次数字段
    (savedCode as any).usedCount = 0;
    
    return savedCode;
  }

  // 批量创建兑换码
  async batchCreate(batchCreateDto: BatchCreateRedeemCodeDto): Promise<RedeemCode[]> {
    // 验证时间逻辑
    this.validateTimeRange(batchCreateDto.start_time, batchCreateDto.end_time);

    const codes: RedeemCode[] = [];
    const generatedCodes = new Set<string>();

    // 批量生成兑换码
    for (let i = 0; i < batchCreateDto.count; i++) {
      let generatedCode: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        generatedCode = this.generateRandomCode(batchCreateDto.length || 20);
        attempts++;
        
        if (generatedCodes.has(generatedCode)) {
          continue;
        }
        
        try {
          await this.ensureCodeIsUnique(generatedCode);
          break;
        } catch (error) {
          if (attempts >= maxAttempts) {
            throw new BadRequestException(`批量生成第 ${i + 1} 个兑换码失败，请重试`);
          }
        }
      } while (attempts < maxAttempts);

      generatedCodes.add(generatedCode);

      const redeemCode = this.redeemCodeRepository.create({
        code: generatedCode,
        itemId: batchCreateDto.itemId,
        itemKind: batchCreateDto.itemKind,
        amount: batchCreateDto.amount,
        max_global_uses: batchCreateDto.max_global_uses,
        max_user_uses: batchCreateDto.max_user_uses,
        start_time: batchCreateDto.start_time ? new Date(batchCreateDto.start_time) : null,
        end_time: batchCreateDto.end_time ? new Date(batchCreateDto.end_time) : null,
      });

      codes.push(redeemCode);
    }

    // 使用事务批量保存
    const savedCodes = await this.redeemCodeRepository.save(codes);
    
    // 为每个兑换码添加使用次数
    return savedCodes.map(code => ({
      ...code,
      usedCount: 0,
    } as any));
  }

  // 更新兑换码
  async update(id: number, updateRedeemCodeDto: UpdateRedeemCodeDto): Promise<RedeemCode> {
    const existingCode = await this.findOne(id);

    // 如果更新兑换码，检查是否与其他兑换码重复
    if (updateRedeemCodeDto.code && updateRedeemCodeDto.code !== existingCode.code) {
      await this.ensureCodeIsUnique(updateRedeemCodeDto.code, id);
    }

    // 验证时间逻辑
    const startTime = updateRedeemCodeDto.start_time || existingCode.start_time;
    const endTime = updateRedeemCodeDto.end_time || existingCode.end_time;
    this.validateTimeRange(startTime, endTime);

    // 更新数据
    const updateData = {
      ...updateRedeemCodeDto,
      start_time: updateRedeemCodeDto.start_time ? new Date(updateRedeemCodeDto.start_time) : undefined,
      end_time: updateRedeemCodeDto.end_time ? new Date(updateRedeemCodeDto.end_time) : undefined,
    };

    await this.redeemCodeRepository.update(id, updateData);
    
    return this.findOne(id);
  }

  // 切换兑换码状态
  async toggleStatus(id: number): Promise<RedeemCode> {
    const code = await this.findOne(id);
    
    await this.redeemCodeRepository.update(id, {
      is_active: !code.is_active,
    });
    
    return this.findOne(id);
  }

  // 删除兑换码
  async remove(id: number): Promise<void> {
    const code = await this.findOne(id);
    
    // 使用事务确保数据一致性
    await this.redeemCodeRepository.manager.transaction(async manager => {
      // 先删除相关的使用记录
      await manager.delete(RedeemCodeUsage, { code_id: id });
      
      // 再删除兑换码
      await manager.remove(code);
    });
  }

  // 使用兑换码（供其他模块调用）
  async useRedeemCode(code: string, userId: number): Promise<{
    success: boolean;
    message: string;
    reward?: {
      itemId: number;
      itemKind: number;
      amount: number;
    };
  }> {
    // 使用事务确保数据一致性
    return await this.redeemCodeRepository.manager.transaction(async manager => {
      const redeemCode = await manager.findOne(RedeemCode, {
        where: { code },
        relations: ['usages'],
        lock: { mode: 'pessimistic_write' }, // 悲观锁防止并发问题
      });

      if (!redeemCode) {
        return { success: false, message: '兑换码不存在' };
      }

      if (!redeemCode.is_active) {
        return { success: false, message: '兑换码已被禁用' };
      }

      // 检查时间有效性
      const now = new Date();
      if (redeemCode.start_time && now < redeemCode.start_time) {
        return { success: false, message: '兑换码尚未生效' };
      }
      
      if (redeemCode.end_time && now > redeemCode.end_time) {
        return { success: false, message: '兑换码已过期' };
      }

      // 检查全局使用次数限制
      if (redeemCode.max_global_uses && redeemCode.usages.length >= redeemCode.max_global_uses) {
        return { success: false, message: '兑换码使用次数已达上限' };
      }

      // 检查用户使用次数限制
      if (redeemCode.max_user_uses) {
        const userUsageCount = redeemCode.usages.filter(usage => usage.user_id === userId).length;
        if (userUsageCount >= redeemCode.max_user_uses) {
          return { success: false, message: '您已达到该兑换码的使用次数上限' };
        }
      }

      // 记录使用
      const usage = manager.create(RedeemCodeUsage, {
        code_id: redeemCode.id,
        user_id: userId,
      });
      
      await manager.save(usage);

      return {
        success: true,
        message: '兑换成功',
        reward: {
          itemId: redeemCode.itemId,
          itemKind: redeemCode.itemKind,
          amount: redeemCode.amount,
        },
      };
    });
  }
}