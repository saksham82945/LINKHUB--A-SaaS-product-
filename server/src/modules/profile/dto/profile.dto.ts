import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
  IsHexColor,
  IsIn,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_]+$/, { message: 'Username can only contain lowercase letters, numbers, and underscores' })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @IsIn(['rounded', 'sharp', 'pill'])
  buttonStyle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  seoDescription?: string;

  @IsOptional()
  @IsBoolean()
  isPubliclyListed?: boolean;

  @IsOptional()
  @IsBoolean()
  showBranding?: boolean;
}

export class SetCustomDomainDto {
  @IsString()
  domain: string;
}

export class UpdatePrivacyDto {
  @IsBoolean()
  isPubliclyListed: boolean;
}
