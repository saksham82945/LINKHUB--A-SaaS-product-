import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create-order')
  createOrder(@Req() req: Request, @Body() body: { plan: string; billingCycle: string }) {
    return this.paymentsService.createOrder((req.user as any).id, body.plan, body.billingCycle);
  }

  @Get('history')
  getHistory(@Req() req: Request) {
    return this.paymentsService.getHistory((req.user as any).id);
  }
}
