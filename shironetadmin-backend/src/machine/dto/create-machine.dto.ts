import { IsString, IsOptional, IsBoolean, IsInt, IsNotEmpty, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMachineDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  arcade?: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 15)
  serial: string;

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
  arcadeName?: string; // 用于根据名称查找arcade

  @IsOptional()
  data?: any;
}