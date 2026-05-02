// src/auth/dto/jwt-payload.dto.ts
import { UserRole } from '../entities/user.entity';

export interface JwtPayload {
  sub: number; // user id
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}