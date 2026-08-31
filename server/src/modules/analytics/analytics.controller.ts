import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  // GET /api/analytics/summary
  @Get('summary')
  getSummary(@Req() req: Request) {
    return this.analyticsService.getSummary((req.user as any).id);
  }

  // GET /api/analytics/over-time (Pro)
  @Get('over-time')
  getOverTime(@Req() req: Request) {
    return this.analyticsService.getClicksOverTime((req.user as any).id);
  }

  // GET /api/analytics/by-link (Pro)
  @Get('by-link')
  getByLink(@Req() req: Request) {
    return this.analyticsService.getByLink((req.user as any).id);
  }

  // GET /api/analytics/devices (Pro)
  @Get('devices')
  getDevices(@Req() req: Request) {
    return this.analyticsService.getDevices((req.user as any).id);
  }

  // GET /api/analytics/geo (Pro)
  @Get('geo')
  getGeo(@Req() req: Request) {
    return this.analyticsService.getGeo((req.user as any).id);
  }

  // GET /api/analytics/referrers (Pro)
  @Get('referrers')
  getReferrers(@Req() req: Request) {
    return this.analyticsService.getReferrers((req.user as any).id);
  }
}
