// src/user/dto/user-response.dto.ts
import { UserRole } from '../entities/aime-user.entity';

export class UserResponseDto {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  aimeCard?: string;
  cardLocked: boolean;
  cardBanned: boolean;
  createdAt: string;
  lastLogin: string | null;
  permissions: number;
}