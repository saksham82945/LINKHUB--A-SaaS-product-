import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto, SetCustomDomainDto, UpdatePrivacyDto } from './dto/profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  // GET /api/profile/me
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@Req() req: Request) {
    return this.profileService.getMyProfile((req.user as any).id);
  }

  // PATCH /api/profile/me
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateMyProfile((req.user as any).id, dto);
  }

  // GET /api/profile/check/:username
  @Get('check/:username')
  checkUsername(@Param('username') username: string) {
    return this.profileService.checkUsername(username);
  }

  // GET /api/profile/:username/qr — Public QR code (no auth)
  @Get(':username/qr')
  getPublicProfileQr(@Param('username') username: string) {
    return this.profileService.getPublicProfileQr(username);
  }

  // GET /api/profile/:username  — Public profile (no auth)
  @Get(':username')
  getPublicProfile(@Param('username') username: string, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.profileService.getPublicProfile(username, ip);
  }

  // POST /api/profile/avatar — Upload avatar to S3
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@Req() req: Request, @UploadedFile() file: any) {
    return this.profileService.uploadAvatar((req.user as any).id, file);
  }

  // PATCH /api/profile/background
  @Patch('background')
  @UseGuards(JwtAuthGuard)
  updateBackground(@Req() req: Request, @Body() body: { backgroundUrl: string }) {
    return this.profileService.updateBackground((req.user as any).id, body.backgroundUrl);
  }

  // PATCH /api/profile/domain — Pro only
  @Patch('domain')
  @UseGuards(JwtAuthGuard)
  setCustomDomain(@Req() req: Request, @Body() dto: SetCustomDomainDto) {
    return this.profileService.setCustomDomain((req.user as any).id, dto.domain);
  }

  // PATCH /api/profile/privacy
  @Patch('privacy')
  @UseGuards(JwtAuthGuard)
  updatePrivacy(@Req() req: Request, @Body() dto: UpdatePrivacyDto) {
    return this.profileService.updatePrivacy((req.user as any).id, dto.isPubliclyListed);
  }
}
