// src/redeem/dto/create-redeem-code.dto.ts
import { IsString, IsInt, IsOptional, IsBoolean, IsDateString, Min } from 'class-validator';

export class CreateRedeemCodeDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsInt()
  @Min(1)
  itemId: number;

  @IsInt()
  @Min(1)
  itemKind: number;

  @IsInt()
  @Min(1)
  amount: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean = true;

  @IsInt()
  @Min(0)
  @IsOptional()
  max_global_uses?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  max_user_uses?: number;

  @IsDateString()
  @IsOptional()
  start_time?: string;

  @IsDateString()
  @IsOptional()
  end_time?: string;
}