import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ─────────────────────────────────────────────────────
  // SUMMARY (Free: 7 days, Pro: 90 days)
  // ─────────────────────────────────────────────────────
  async getSummary(userId: string) {
    const { profile, user } = await this.getProfileAndUser(userId);
    const isPro = user.plan !== 'FREE';
    const days = isPro ? 90 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalClicks, linkCount, profileViews] = await Promise.all([
      this.prisma.click.count({
        where: { profileId: profile.id, clickedAt: { gte: since } },
      }),
      this.prisma.link.count({ where: { profileId: profile.id, isActive: true } }),
      profile.viewCount,
    ]);

    return {
      totalClicks,
      profileViews,
      activeLinks: linkCount,
      dateRange: `${days} days`,
      since: since.toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────
  // CLICKS OVER TIME (day-wise) — Pro only
  // ─────────────────────────────────────────────────────
  async getClicksOverTime(userId: string) {
    const { profile, user } = await this.getProfileAndUser(userId);
    if (user.plan === 'FREE') throw new ForbiddenException('Analytics over time requires Pro plan');

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const clicks = await this.prisma.click.groupBy({
      by: ['clickedAt'],
      where: { profileId: profile.id, clickedAt: { gte: since } },
      _count: { id: true },
    });

    // Group by day
    const byDay: Record<string, number> = {};
    clicks.forEach((c) => {
      const day = c.clickedAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + c._count.id;
    });

    return Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // ─────────────────────────────────────────────────────
  // BY LINK breakdown — Pro only
  // ─────────────────────────────────────────────────────
  async getByLink(userId: string) {
    const { profile, user } = await this.getProfileAndUser(userId);
    if (user.plan === 'FREE') throw new ForbiddenException('Per-link analytics requires Pro plan');

    const links = await this.prisma.link.findMany({
      where: { profileId: profile.id },
      select: {
        id: true,
        title: true,
        url: true,
        clickCount: true,
        isActive: true,
        type: true,
      },
      orderBy: { clickCount: 'desc' },
    });

    return links;
  }

  // ─────────────────────────────────────────────────────
  // DEVICES breakdown — Pro only
  // ─────────────────────────────────────────────────────
  async getDevices(userId: string) {
    const { profile, user } = await this.getProfileAndUser(userId);
    if (user.plan === 'FREE') throw new ForbiddenException('Device analytics requires Pro plan');

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.click.groupBy({
      by: ['device'],
      where: { profileId: profile.id, clickedAt: { gte: since } },
      _count: { id: true },
    });

    return result.map((r) => ({ device: r.device || 'Unknown', count: r._count.id }));
  }

  // ─────────────────────────────────────────────────────
  // GEO breakdown — Pro only
  // ─────────────────────────────────────────────────────
  async getGeo(userId: string) {
    const { profile, user } = await this.getProfileAndUser(userId);
    if (user.plan === 'FREE') throw new ForbiddenException('Geo analytics requires Pro plan');

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.click.groupBy({
      by: ['country'],
      where: { profileId: profile.id, clickedAt: { gte: since } },
      _count: { id: true },
    });

    return result
      .map((r) => ({ country: r.country || 'Unknown', count: r._count.id }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  // ─────────────────────────────────────────────────────
  // REFERRERS — Pro only
  // ─────────────────────────────────────────────────────
  async getReferrers(userId: string) {
    const { profile, user } = await this.getProfileAndUser(userId);
    if (user.plan === 'FREE') throw new ForbiddenException('Referrer analytics requires Pro plan');

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.click.groupBy({
      by: ['referrer'],
      where: { profileId: profile.id, clickedAt: { gte: since } },
      _count: { id: true },
    });

    return result
      .map((r) => ({ referrer: r.referrer || 'Direct', count: r._count.id }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  // ─────────────────────────────────────────────────────
  // PRIVATE HELPER
  // ─────────────────────────────────────────────────────
  private async getProfileAndUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.profile) throw new NotFoundException('Profile not found');
    return { profile: user.profile, user };
  }
}
