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
import { ResumeService } from './resume.service';

@Controller('resume')
export class ResumeController {
  constructor(private resumeService: ResumeService) {}

  // GET /api/resume
  @Get()
  @UseGuards(JwtAuthGuard)
  getMyResumes(@Req() req: Request) {
    return this.resumeService.getMyResumes((req.user as any).id);
  }

  // POST /api/resume
  @Post()
  @UseGuards(JwtAuthGuard)
  createResume(
    @Req() req: Request,
    @Body() body: { title?: string; template?: string },
  ) {
    return this.resumeService.createResume((req.user as any).id, body.title || 'My Resume', body.template || 'ATS_CLEAN');
  }

  // GET /api/resume/shared/:slug — Public
  @Get('shared/:slug')
  getSharedResume(@Param('slug') slug: string) {
    return this.resumeService.getSharedResume(slug);
  }

  // GET /api/resume/:id
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getResume(@Req() req: Request, @Param('id') id: string) {
    return this.resumeService.getResume((req.user as any).id, id);
  }

  // PATCH /api/resume/:id
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateResume(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { title?: string; template?: string; content?: any },
  ) {
    return this.resumeService.updateResume((req.user as any).id, id, body);
  }

  // DELETE /api/resume/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  deleteResume(@Req() req: Request, @Param('id') id: string) {
    return this.resumeService.deleteResume((req.user as any).id, id);
  }

  // POST /api/resume/:id/ai-fill
  @Post(':id/ai-fill')
  @UseGuards(JwtAuthGuard)
  autoFill(@Req() req: Request, @Param('id') id: string) {
    return this.resumeService.autoFillFromIntegrations((req.user as any).id, id);
  }

  // POST /api/resume/:id/ats-check
  @Post(':id/ats-check')
  @UseGuards(JwtAuthGuard)
  atsCheck(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { jobDescription: string },
  ) {
    return this.resumeService.checkAtsScore((req.user as any).id, id, body.jobDescription);
  }

  // POST /api/resume/:id/share
  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  createShare(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { password?: string; expiresInDays?: number },
  ) {
    return this.resumeService.createShareLink((req.user as any).id, id, body.password, body.expiresInDays);
  }

  // GET /api/resume/:id/versions
  @Get(':id/versions')
  @UseGuards(JwtAuthGuard)
  getVersions(@Req() req: Request, @Param('id') id: string) {
    return this.resumeService.getVersions((req.user as any).id, id);
  }
}
