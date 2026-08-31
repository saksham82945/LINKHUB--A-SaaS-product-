import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { EmailListService } from './email-list.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('email-list')
export class EmailListController {
  constructor(private readonly emailListService: EmailListService) {}

  @Post('subscribe')
  async subscribe(@Body() body: { username: string; email: string; name?: string }) {
    return this.emailListService.subscribe(body.username, body.email, body.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMySubscribers(@Request() req) {
    return this.emailListService.getMySubscribers(req.user.id);
  }
}
