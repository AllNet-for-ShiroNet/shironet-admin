// src/auth/decorators/auth.decorator.ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from '../entities/user.entity';
import { Roles } from './roles.decorator';

// 基础认证装饰器
export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(...roles),
  );
}

// 特定角色的便捷装饰器
export function AdminOnly() {
  return Auth(UserRole.ADMIN);
}

export function AnyUser() {
  return Auth(UserRole.ADMIN, UserRole.USER);
}