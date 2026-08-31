import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUrl,
  IsNumber,
  IsDateString,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum LinkTypeEnum {
  LINK = 'LINK',
  EMBED = 'EMBED',
  PRODUCT = 'PRODUCT',
  TIPJAR = 'TIPJAR',
  GATED = 'GATED',
  DOCUMENT = 'DOCUMENT',
}

export enum TargetDeviceEnum {
  ALL = 'ALL',
  MOBILE = 'MOBILE',
  DESKTOP = 'DESKTOP',
}

export class CreateLinkDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsEnum(LinkTypeEnum)
  type?: LinkTypeEnum;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  // Smart link (Pro)
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  targetCountry?: string;

  @IsOptional()
  @IsEnum(TargetDeviceEnum)
  targetDevice?: TargetDeviceEnum;

  // Product card
  @IsOptional()
  @IsString()
  productImage?: string;

  @IsOptional()
  @IsNumber()
  productPrice?: number;

  // Gated content
  @IsOptional()
  @IsString()
  gateType?: string;

  @IsOptional()
  @IsNumber()
  gateAmount?: number;
}

export class UpdateLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  targetCountry?: string;

  @IsOptional()
  @IsEnum(TargetDeviceEnum)
  targetDevice?: TargetDeviceEnum;

  @IsOptional()
  @IsString()
  productImage?: string;

  @IsOptional()
  @IsNumber()
  productPrice?: number;
}

export class ReorderLinksDto {
  @IsArray()
  linkIds: string[]; // ordered array of link IDs
}
