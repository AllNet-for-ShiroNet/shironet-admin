import { IsString, IsOptional, IsBoolean, IsInt, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMachineDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  arcade?: number;

  @IsOptional()
  @IsString()
  @Length(1, 15)
  board?: string;

  @IsOptional()
  @IsString()
  @Length(1, 4)
  game?: string;

  @IsOptional()
  @IsString()
  @Length(1, 3)
  country?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  ota_enable?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  memo?: string;

  @IsOptional()
  @IsBoolean()
  is_cab?: boolean;

  @IsOptional()
  @IsString()
  arcadeName?: string;

  @IsOptional()
  data?: any;
}