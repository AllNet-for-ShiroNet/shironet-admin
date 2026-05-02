// src/chuni/dto/chuni-profile.dto.ts
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ChuniProfileResponseDto {
  id: number;
  userId: number;
  version: number;
  level: number;
  playerName: string;
  playerRating: number;
  highestRating: number;
  playCount: number;
  totalPoint: number;
  characterId: number;
  lastPlayDate: string;
  friendCount: number;
  // 添加其他需要的字段
}

export class ChuniScoreResponseDto {
  id: number;
  musicId: number;
  level: number;
  scoreMax: number;
  playCount: number;
  isFullCombo: boolean;
  isAllJustice: boolean;
  maxComboCount: number;
  scoreRank: number;
}

export class PenguinItemDto {
  id: number;
  itemId: number;
  itemName: string;
  stock: number;
  itemKind: number;
}

export class UserChuniDataDto {
  profile: ChuniProfileResponseDto | null;
  scores: ChuniScoreResponseDto[];
  penguins: PenguinItemDto[];
}
