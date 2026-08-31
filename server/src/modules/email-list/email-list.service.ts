import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmailListService {
  constructor(private prisma: PrismaService) {}

  async subscribe(username: string, email: string, name?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { username },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const existing = await this.prisma.emailSubscriber.findUnique({
      where: {
        profileId_email: { profileId: profile.id, email },
      },
    });

    if (existing) {
      throw new ConflictException('You are already subscribed to this profile.');
    }

    return this.prisma.emailSubscriber.create({
      data: {
        profileId: profile.id,
        email,
        name,
      },
    });
  }

  async getMySubscribers(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { ownerUserId: userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.prisma.emailSubscriber.findMany({
      where: { profileId: profile.id, isActive: true },
      orderBy: { subscribedAt: 'desc' },
    });
  }
}
