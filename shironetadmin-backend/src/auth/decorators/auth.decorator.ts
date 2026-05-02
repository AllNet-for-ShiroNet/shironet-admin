import { UserRole } from '../entities/user.entity';
import { Roles } from './roles.decorator';

/** 类方法上的角色元数据；需与全局 RolesGuard 配合 */
export function Auth(...roles: UserRole[]) {
  return Roles(...roles);
}

export function AdminOnly() {
  return Roles(UserRole.ADMIN);
}

export function AnyUser() {
  return Roles(UserRole.ADMIN, UserRole.USER);
}
