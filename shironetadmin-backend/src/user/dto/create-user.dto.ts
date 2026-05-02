// create-user.dto.ts
import { IsEmail, IsOptional, IsString, IsIn, IsBoolean, Length } from 'class-validator';
import { UserRole } from '../entities/aime-user.entity';

export class CreateUserDto {
  @IsString()
  @Length(2, 25)
  username: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Length(20, 20)
  aimeCard?: string;

  @IsIn(['super_admin', 'admin', 'trust_user', 'user'])
  role: UserRole;

  @IsOptional()
  @IsBoolean()
  cardLocked?: boolean;

  @IsOptional()
  @IsBoolean()
  cardBanned?: boolean;
}