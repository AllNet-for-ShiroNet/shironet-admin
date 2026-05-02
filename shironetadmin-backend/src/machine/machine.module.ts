// src/machine/machine.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Machine } from './entities/machine.entity';
import { Arcade } from './entities/arcade.entity';
import { MachineController } from './machine.controller';
import { MachineService } from './machine.service';

@Module({
  imports: [TypeOrmModule.forFeature([Machine, Arcade])],
  controllers: [MachineController],
  providers: [MachineService],
  exports: [MachineService, TypeOrmModule],
})
export class MachineModule {}