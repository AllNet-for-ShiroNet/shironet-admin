// src/redeem/dto/batch-create-redeem-code.dto.ts
import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class BatchCreateRedeemCodeDto {
  @IsInt()
  @Min(1)
  @Max(100)
  count: number;

  @IsInt()
  @Min(10)
  @Max(30)
  length: number;

  @IsInt()
  @Min(1)
  itemId: number;

  @IsInt()
  @Min(1)
  itemKind: number;

  @IsInt()
  @Min(1)
  amount: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  max_global_uses?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  max_user_uses?: number;

  @IsOptional()
  start_time?: string;

  @IsOptional()
  end_time?: string;
}