import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  // POST /api/ai/bio
  @Post('bio')
  generateBio(@Req() req: Request) {
    return this.aiService.generateBio((req.user as any).id);
  }

  // POST /api/ai/enhance-bullets
  @Post('enhance-bullets')
  enhanceBullets(
    @Req() req: Request,
    @Body() body: { bullets: string[]; jobDescription: string },
  ) {
    return this.aiService.enhanceBullets((req.user as any).id, body.bullets, body.jobDescription);
  }

  // POST /api/ai/ats-check
  @Post('ats-check')
  atsCheck(@Body() body: { resumeText: string; jobDescription: string }) {
    return this.aiService.checkAtsScore(body.resumeText, body.jobDescription);
  }

  // POST /api/ai/cover-letter
  @Post('cover-letter')
  generateCoverLetter(
    @Req() req: Request,
    @Body()
    body: {
      companyName: string;
      roleName: string;
      jobDescription: string;
      tone: string;
    },
  ) {
    return this.aiService.generateCoverLetter(
      (req.user as any).id,
      body.companyName,
      body.roleName,
      body.jobDescription,
      body.tone,
    );
  }

  // POST /api/ai/keywords
  @Post('keywords')
  extractKeywords(@Body() body: { jobDescription: string }) {
    return this.aiService.extractKeywords(body.jobDescription);
  }

  // POST /api/ai/smart-link
  @Post('smart-link')
  smartLink(@Body() body: { url: string }) {
    return this.aiService.generateSmartLink(body.url);
  }
}
