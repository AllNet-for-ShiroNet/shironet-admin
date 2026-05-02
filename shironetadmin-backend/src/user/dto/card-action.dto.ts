// src/user/dto/card-action.dto.ts
import { IsBoolean } from 'class-validator';

export class CardActionDto {
  @IsBoolean()
  locked?: boolean;

  @IsBoolean()
  banned?: boolean;
}