import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  // TODO Phase 10: Implement Razorpay + Stripe payment flows
  async createOrder(userId: string, plan: string, billingCycle: string) {
    return { message: 'Payments coming in Phase 10', plan, billingCycle };
  }

  async getHistory(userId: string) {
    return this.prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }
}
