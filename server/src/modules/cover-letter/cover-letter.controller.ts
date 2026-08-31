import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoverLetterService } from './cover-letter.service';

@Controller('cover-letter')
export class CoverLetterController {
  constructor(private coverLetterService: CoverLetterService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getAll(@Req() req: Request) {
    return this.coverLetterService.getMyCoverLetters((req.user as any).id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: Request, @Body() body: any) {
    return this.coverLetterService.createCoverLetter((req.user as any).id, body);
  }

  @Get('shared/:slug')
  getShared(@Param('slug') slug: string) {
    return this.coverLetterService.getSharedCoverLetter(slug);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOne(@Req() req: Request, @Param('id') id: string) {
    return this.coverLetterService.getCoverLetter((req.user as any).id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.coverLetterService.updateCoverLetter((req.user as any).id, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  delete(@Req() req: Request, @Param('id') id: string) {
    return this.coverLetterService.deleteCoverLetter((req.user as any).id, id);
  }

  @Post(':id/ai-generate')
  @UseGuards(JwtAuthGuard)
  aiGenerate(@Req() req: Request, @Param('id') id: string) {
    return this.coverLetterService.aiGenerate((req.user as any).id, id);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  share(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { password?: string; expiresInDays?: number },
  ) {
    return this.coverLetterService.createShareLink((req.user as any).id, id, body.password, body.expiresInDays);
  }
}
