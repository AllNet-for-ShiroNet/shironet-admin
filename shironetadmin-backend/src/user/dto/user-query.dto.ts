// user-query.dto.ts
import { IsOptional, IsString, IsIn } from 'class-validator';
import { UserRole } from '../entities/aime-user.entity';

export class UserQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['super_admin', 'admin', 'trust_user', 'user'])
  role?: UserRole;

  @IsOptional()
  @IsIn(['normal', 'locked', 'banned'])
  cardStatus?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 10;
}