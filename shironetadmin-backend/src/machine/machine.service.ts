import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Machine } from './entities/machine.entity';
import { Arcade } from './entities/arcade.entity';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { SearchMachineDto } from './dto/search-machine.dto';
import { AccountGroup, Account } from './interfaces/machine.interface';

@Injectable()
export class MachineService {
  constructor(
    @InjectRepository(Machine)
    private machineRepository: Repository<Machine>,
    @InjectRepository(Arcade)
    private arcadeRepository: Repository<Arcade>,
  ) {}

  // 获取所有机器（包含arcade信息）
  async getAllMachinesWithArcade(): Promise<Machine[]> {
    return await this.machineRepository.find({
      relations: ['arcade_info'],
      order: {
        arcade_info: { name: 'ASC' },
        serial: 'ASC',
      },
    });
  }

  // 根据arcade分组获取账号信息
  async getAccountsByGroups(): Promise<AccountGroup[]> {
    const machines = await this.getAllMachinesWithArcade();
    
    // 按arcade分组
    const groupMap = new Map<string, Account[]>();
    
    machines.forEach(machine => {
      const groupName = machine.arcade_info?.name || 'other';
      
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, []);
      }
      
      const account: Account = {
        serial: machine.serial,
        game: machine.game || 'SDHD',
        country: machine.country || 'JPN',
        otaEnable: machine.ota_enable || false,
        isCab: machine.is_cab || false,
        note: machine.memo,
        arcadeName: machine.arcade_info?.name,
      };
      
      groupMap.get(groupName)!.push(account);
    });
    
    // 转换为AccountGroup数组
    const groups: AccountGroup[] = [];
    groupMap.forEach((accounts, groupName) => {
      groups.push({
        name: groupName,
        displayName: groupName,
        accounts: accounts,
      });
    });
    
    return groups;
  }

  // 根据serial查找机器
  async getMachineBySerial(serial: string): Promise<Machine> {
    const machine = await this.machineRepository.findOne({
      where: { serial },
      relations: ['arcade_info'],
    });
    
    if (!machine) {
      throw new NotFoundException(`机器 ${serial} 不存在`);
    }
    
    return machine;
  }

  // 创建新机器
  async createMachine(createMachineDto: CreateMachineDto): Promise<Machine> {
    // 检查serial是否已存在
    const existingMachine = await this.machineRepository.findOne({
      where: { serial: createMachineDto.serial },
    });
    
    if (existingMachine) {
      throw new ConflictException(`Serial ${createMachineDto.serial} 已存在`);
    }

    // 如果提供了arcade名称，查找对应的arcade ID
    if (createMachineDto.arcadeName) {
      const arcade = await this.getArcadeByName(createMachineDto.arcadeName);
      if (arcade) {
        createMachineDto.arcade = arcade.id;
      }
    }

    const machine = this.machineRepository.create({
      ...createMachineDto,
      data: createMachineDto.data ? JSON.stringify(createMachineDto.data) : null,
    });

    const savedMachine = await this.machineRepository.save(machine);
    
    // 返回包含arcade_info的完整数据
    return await this.getMachineBySerial(savedMachine.serial);
  }

  // 更新机器信息
  async updateMachine(serial: string, updateMachineDto: UpdateMachineDto): Promise<Machine> {
    const machine = await this.getMachineBySerial(serial);

    // 如果提供了arcade名称，查找对应的arcade ID
    if (updateMachineDto.arcadeName) {
      const arcade = await this.getArcadeByName(updateMachineDto.arcadeName);
      if (arcade) {
        updateMachineDto.arcade = arcade.id;
      }
    }

    Object.assign(machine, {
      ...updateMachineDto,
      data: updateMachineDto.data ? JSON.stringify(updateMachineDto.data) : machine.data,
    });

    await this.machineRepository.save(machine);
    
    // 返回更新后的完整数据
    return await this.getMachineBySerial(serial);
  }

  // 删除机器
  async deleteMachine(serial: string): Promise<void> {
    const machine = await this.getMachineBySerial(serial);
    await this.machineRepository.remove(machine);
  }

  // 搜索和筛选机器
  async searchMachines(searchDto: SearchMachineDto): Promise<Machine[]> {
    const queryBuilder = this.machineRepository
      .createQueryBuilder('machine')
      .leftJoinAndSelect('machine.arcade_info', 'arcade');

    // 搜索条件
    if (searchDto.search) {
      queryBuilder.andWhere(
        '(machine.serial LIKE :search OR machine.memo LIKE :search)',
        { search: `%${searchDto.search}%` }
      );
    }

    // 游戏筛选
    if (searchDto.game) {
      queryBuilder.andWhere('machine.game = :game', { game: searchDto.game });
    }

    // 国家筛选
    if (searchDto.country) {
      queryBuilder.andWhere('machine.country = :country', { country: searchDto.country });
    }

    // arcade筛选
    if (searchDto.arcade) {
      queryBuilder.andWhere(
        '(arcade.name = :arcade OR arcade.nickname = :arcade)',
        { arcade: searchDto.arcade }
      );
    }

    // OTA状态筛选
    if (searchDto.ota_enable !== undefined) {
      queryBuilder.andWhere('machine.ota_enable = :ota_enable', { ota_enable: searchDto.ota_enable });
    }

    // CAB状态筛选
    if (searchDto.is_cab !== undefined) {
      queryBuilder.andWhere('machine.is_cab = :is_cab', { is_cab: searchDto.is_cab });
    }

    return await queryBuilder
      .orderBy('arcade.name', 'ASC')
      .addOrderBy('machine.serial', 'ASC')
      .getMany();
  }

  // 获取所有arcade信息
  async getAllArcades(): Promise<Arcade[]> {
    return await this.arcadeRepository.find({
      order: { name: 'ASC' },
    });
  }

  // 根据名称查找arcade
  async getArcadeByName(name: string): Promise<Arcade | null> {
    return await this.arcadeRepository.findOne({
      where: [
        { name },
        { nickname: name },
      ],
    });
  }
}