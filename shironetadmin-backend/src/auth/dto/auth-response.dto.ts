// src/auth/dto/auth-response.dto.ts
import { UserRole } from '../entities/user.entity';

export class AuthResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    username: string;
    nickname: string;
    role: UserRole;
  };
}