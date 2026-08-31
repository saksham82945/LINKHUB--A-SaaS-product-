import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(private integrationsService: IntegrationsService) {}

  // GET /api/integrations/status — all connection statuses
  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@Req() req: Request) {
    return this.integrationsService.getStatus((req.user as any).id);
  }

  // GET /api/integrations/scorecard
  @Get('scorecard')
  @UseGuards(JwtAuthGuard)
  getScorecard(@Req() req: Request) {
    return this.integrationsService.getDevScorecard((req.user as any).id);
  }

  // GET /api/integrations/github/:username — public endpoint
  @Get('github/:username')
  getGithub(@Param('username') username: string) {
    return this.integrationsService.getGithubStats(username);
  }

  // GET /api/integrations/leetcode/:username — public endpoint
  @Get('leetcode/:username')
  getLeetcode(@Param('username') username: string) {
    return this.integrationsService.getLeetcodeStats(username);
  }

  // GET /api/integrations/codechef/:username — public endpoint
  @Get('codechef/:username')
  getCodechef(@Param('username') username: string) {
    return this.integrationsService.getCodechefStats(username);
  }

  // POST /api/integrations/connect — connect a platform
  @Post('connect')
  @UseGuards(JwtAuthGuard)
  connect(
    @Req() req: Request,
    @Body() body: { service: string; username: string },
  ) {
    return this.integrationsService.connectIntegration(
      (req.user as any).id,
      body.service.toUpperCase(),
      body.username,
    );
  }

  // POST /api/integrations/sync/:service — manual re-sync
  @Post('sync/:service')
  @UseGuards(JwtAuthGuard)
  sync(@Req() req: Request, @Param('service') service: string) {
    return this.integrationsService.syncIntegration((req.user as any).id, service.toUpperCase());
  }

  // DELETE /api/integrations/:service — disconnect
  @Delete(':service')
  @UseGuards(JwtAuthGuard)
  disconnect(@Req() req: Request, @Param('service') service: string) {
    return this.integrationsService.disconnectIntegration(
      (req.user as any).id,
      service.toUpperCase(),
    );
  }
}
