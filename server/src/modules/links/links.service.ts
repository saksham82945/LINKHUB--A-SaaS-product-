import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateLinkDto, UpdateLinkDto, ReorderLinksDto } from './dto/links.dto';

// Free plan max links
const FREE_LINKS_LIMIT = 5;

@Injectable()
export class LinksService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ─────────────────────────────────────────────────────
  // GET ALL MY LINKS
  // ─────────────────────────────────────────────────────
  async getMyLinks(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.link.findMany({
      where: { profileId: profile.id },
      orderBy: { orderIndex: 'asc' },
    });
  }

  // ─────────────────────────────────────────────────────
  // CREATE LINK
  // ─────────────────────────────────────────────────────
  async createLink(userId: string, dto: CreateLinkDto) {
    const profile = await this.getProfileByUserId(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Free plan limit
    if (user?.plan === 'FREE') {
      const count = await this.prisma.link.count({ where: { profileId: profile.id } });
      if (count >= FREE_LINKS_LIMIT) {
        throw new ForbiddenException(`Free plan allows max ${FREE_LINKS_LIMIT} links. Upgrade to Pro for unlimited links.`);
      }
    }

    // Get max order index
    const maxOrder = await this.prisma.link.aggregate({
      where: { profileId: profile.id },
      _max: { orderIndex: true },
    });
    const nextOrder = (maxOrder._max.orderIndex ?? -1) + 1;

    const link = await this.prisma.link.create({
      data: {
        profileId: profile.id,
        title: dto.title,
        url: dto.url,
        iconUrl: dto.iconUrl,
        type: (dto.type as any) || 'LINK',
        orderIndex: dto.orderIndex ?? nextOrder,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        targetCountry: dto.targetCountry,
        targetDevice: (dto.targetDevice as any) || 'ALL',
        productImage: dto.productImage,
        productPrice: dto.productPrice,
        gateType: (dto.gateType as any),
        gateAmount: dto.gateAmount,
      },
    });

    // Invalidate public profile cache
    await this.redis.del(`profile:${profile.username}`);
    return link;
  }

  // ─────────────────────────────────────────────────────
  // UPDATE LINK
  // ─────────────────────────────────────────────────────
  async updateLink(userId: string, linkId: string, dto: UpdateLinkDto) {
    const link = await this.getLinkOwned(userId, linkId);

    const updated = await this.prisma.link.update({
      where: { id: link.id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.iconUrl !== undefined && { iconUrl: dto.iconUrl }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
        ...(dto.scheduledAt !== undefined && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.expiresAt !== undefined && { expiresAt: new Date(dto.expiresAt) }),
        ...(dto.targetCountry !== undefined && { targetCountry: dto.targetCountry }),
        ...(dto.targetDevice !== undefined && { targetDevice: dto.targetDevice as any }),
        ...(dto.productImage !== undefined && { productImage: dto.productImage }),
        ...(dto.productPrice !== undefined && { productPrice: dto.productPrice }),
      },
    });

    const profile = await this.getProfileByUserId(userId);
    await this.redis.del(`profile:${profile.username}`);
    return updated;
  }

  // ─────────────────────────────────────────────────────
  // DELETE LINK
  // ─────────────────────────────────────────────────────
  async deleteLink(userId: string, linkId: string) {
    await this.getLinkOwned(userId, linkId);

    await this.prisma.link.delete({ where: { id: linkId } });

    const profile = await this.getProfileByUserId(userId);
    await this.redis.del(`profile:${profile.username}`);
    return { message: 'Link deleted successfully' };
  }

  // ─────────────────────────────────────────────────────
  // TOGGLE LINK (active/inactive)
  // ─────────────────────────────────────────────────────
  async toggleLink(userId: string, linkId: string) {
    const link = await this.getLinkOwned(userId, linkId);

    const updated = await this.prisma.link.update({
      where: { id: link.id },
      data: { isActive: !link.isActive },
    });

    const profile = await this.getProfileByUserId(userId);
    await this.redis.del(`profile:${profile.username}`);
    return updated;
  }

  // ─────────────────────────────────────────────────────
  // REORDER LINKS (drag & drop)
  // ─────────────────────────────────────────────────────
  async reorderLinks(userId: string, dto: ReorderLinksDto) {
    const profile = await this.getProfileByUserId(userId);

    // Verify all links belong to this profile
    const links = await this.prisma.link.findMany({
      where: { profileId: profile.id, id: { in: dto.linkIds } },
    });
    if (links.length !== dto.linkIds.length) {
      throw new BadRequestException('Some link IDs are invalid');
    }

    // Update order index for each
    await Promise.all(
      dto.linkIds.map((id, index) =>
        this.prisma.link.update({
          where: { id },
          data: { orderIndex: index },
        }),
      ),
    );

    await this.redis.del(`profile:${profile.username}`);
    return { message: 'Links reordered successfully' };
  }

  // ─────────────────────────────────────────────────────
  // RECORD CLICK + REDIRECT
  // ─────────────────────────────────────────────────────
  async recordClickAndGetUrl(
    linkId: string,
    ip: string,
    country: string,
    device: string,
    browser: string,
    os: string,
    referrer: string,
  ) {
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      include: { profile: true },
    });

    if (!link || !link.isActive) throw new NotFoundException('Link not found or inactive');

    // Check if link has expired
    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new NotFoundException('This link has expired');
    }

    // Check if link is scheduled (not yet active)
    if (link.scheduledAt && link.scheduledAt > new Date()) {
      throw new NotFoundException('This link is not yet active');
    }

    // Record click asynchronously
    this.prisma.click.create({
      data: {
        linkId: link.id,
        profileId: link.profileId,
        ipHash: ip ? require('crypto').createHash('sha256').update(ip).digest('hex') : null,
        country: country || null,
        device: (['MOBILE', 'DESKTOP', 'TABLET'].includes(device?.toUpperCase()) ? device.toUpperCase() : null) as any,
        browser: browser || null,
        os: os || null,
        referrer: referrer || null,
      },
    }).catch(console.error);

    // Increment click count
    this.prisma.link.update({
      where: { id: linkId },
      data: { clickCount: { increment: 1 } },
    }).catch(console.error);

    return { url: link.url };
  }

  // ─────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────
  private async getProfileByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { ownerUserId: userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  private async getLinkOwned(userId: string, linkId: string) {
    const profile = await this.getProfileByUserId(userId);
    const link = await this.prisma.link.findFirst({
      where: { id: linkId, profileId: profile.id },
    });
    if (!link) throw new NotFoundException('Link not found');
    return link;
  }
}
