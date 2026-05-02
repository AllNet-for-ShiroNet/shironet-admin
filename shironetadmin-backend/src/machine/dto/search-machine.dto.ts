import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchMachineDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  game?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  arcade?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  ota_enable?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_cab?: boolean;
}