import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpStatus,
    HttpCode,
  } from '@nestjs/common';
  import { MachineService } from './machine.service';
  import { CreateMachineDto } from './dto/create-machine.dto';
  import { UpdateMachineDto } from './dto/update-machine.dto';
  import { SearchMachineDto } from './dto/search-machine.dto';
  import { ApiResponseDto, AccountGroupDto } from './dto/response.dto';
  import { Machine } from './entities/machine.entity';
  import { Arcade } from './entities/arcade.entity';
  
  @Controller('machines')
  export class MachineController {
    constructor(private readonly machineService: MachineService) {}
  
    // 获取所有机器（按arcade分组）
    @Get('groups')
    async getAccountGroups(): Promise<ApiResponseDto<AccountGroupDto[]>> {
      try {
        const groups = await this.machineService.getAccountsByGroups();
        return {
          success: true,
          data: groups,
        };
      } catch (error) {
        return {
          success: false,
          message: '获取账号分组失败',
          error: error.message,
        };
      }
    }
  
    // 获取所有机器
    @Get()
    async getAllMachines(): Promise<ApiResponseDto<Machine[]>> {
      try {
        const machines = await this.machineService.getAllMachinesWithArcade();
        return {
          success: true,
          data: machines,
        };
      } catch (error) {
        return {
          success: false,
          message: '获取机器列表失败',
          error: error.message,
        };
      }
    }
  
    // 搜索机器
    @Get('search')
    async searchMachines(@Query() searchDto: SearchMachineDto): Promise<ApiResponseDto<Machine[]>> {
      try {
        const machines = await this.machineService.searchMachines(searchDto);
        return {
          success: true,
          data: machines,
        };
      } catch (error) {
        return {
          success: false,
          message: '搜索机器失败',
          error: error.message,
        };
      }
    }
  
    // 获取所有arcade
    @Get('arcades')
    async getAllArcades(): Promise<ApiResponseDto<Arcade[]>> {
      try {
        const arcades = await this.machineService.getAllArcades();
        return {
          success: true,
          data: arcades,
        };
      } catch (error) {
        return {
          success: false,
          message: '获取arcade列表失败',
          error: error.message,
        };
      }
    }
  
    // 根据serial获取机器
    @Get(':serial')
    async getMachineBySerial(@Param('serial') serial: string): Promise<ApiResponseDto<Machine>> {
      try {
        const machine = await this.machineService.getMachineBySerial(serial);
        return {
          success: true,
          data: machine,
        };
      } catch (error) {
        return {
          success: false,
          message: '获取机器信息失败',
          error: error.message,
        };
      }
    }
  
    // 创建新机器
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createMachine(@Body() createMachineDto: CreateMachineDto): Promise<ApiResponseDto<Machine>> {
      try {
        const machine = await this.machineService.createMachine(createMachineDto);
        return {
          success: true,
          message: '机器创建成功',
          data: machine,
        };
      } catch (error) {
        return {
          success: false,
          message: '创建机器失败',
          error: error.message,
        };
      }
    }
  
    // 更新机器信息
    @Put(':serial')
    async updateMachine(
      @Param('serial') serial: string,
      @Body() updateMachineDto: UpdateMachineDto,
    ): Promise<ApiResponseDto<Machine>> {
      try {
        const machine = await this.machineService.updateMachine(serial, updateMachineDto);
        return {
          success: true,
          message: '机器信息更新成功',
          data: machine,
        };
      } catch (error) {
        return {
          success: false,
          message: '更新机器失败',
          error: error.message,
        };
      }
    }
  
    // 删除机器
    @Delete(':serial')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteMachine(@Param('serial') serial: string): Promise<ApiResponseDto<void>> {
      try {
        await this.machineService.deleteMachine(serial);
        return {
          success: true,
          message: '机器删除成功',
        };
      } catch (error) {
        return {
          success: false,
          message: '删除机器失败',
          error: error.message,
        };
      }
    }
  }