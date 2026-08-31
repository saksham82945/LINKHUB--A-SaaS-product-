import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { S3Service } from '../aws/s3.service';
import { UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private s3Service: S3Service,
  ) {}

  // ─────────────────────────────────────────────────────
  // GET MY PROFILE
  // ─────────────────────────────────────────────────────
  async getMyProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { ownerUserId: userId },
      include: {
        links: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        },
        integrations: {
          where: { isActive: true },
          select: {
            service: true,
            username: true,
            lastSyncedAt: true,
            syncData: true,
          },
        },
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  // ─────────────────────────────────────────────────────
  // UPDATE MY PROFILE
  // ─────────────────────────────────────────────────────
  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { ownerUserId: userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    // Check username uniqueness if changing
    if (dto.username && dto.username !== profile.username) {
      const taken = await this.prisma.profile.findUnique({
        where: { username: dto.username },
      });
      if (taken) throw new ConflictException('Username already taken');
    }

    const updated = await this.prisma.profile.update({
      where: { id: profile.id },
      data: {
        ...(dto.username && { username: dto.username }),
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.theme !== undefined && { theme: dto.theme }),
        ...(dto.primaryColor !== undefined && { primaryColor: dto.primaryColor }),
        ...(dto.buttonStyle !== undefined && { buttonStyle: dto.buttonStyle }),
        ...(dto.seoTitle !== undefined && { seoTitle: dto.seoTitle }),
        ...(dto.seoDescription !== undefined && { seoDescription: dto.seoDescription }),
        ...(dto.isPubliclyListed !== undefined && { isPubliclyListed: dto.isPubliclyListed }),
        ...(dto.showBranding !== undefined && { showBranding: dto.showBranding }),
      },
    });

    // Invalidate Redis cache
    await this.redis.del(`profile:${profile.username}`);
    if (dto.username) await this.redis.del(`profile:${dto.username}`);

    return updated;
  }

  // ─────────────────────────────────────────────────────
  // CHECK USERNAME AVAILABILITY
  // ─────────────────────────────────────────────────────
  async checkUsername(username: string) {
    const existing = await this.prisma.profile.findUnique({ where: { username } });
    return { available: !existing };
  }

  // ─────────────────────────────────────────────────────
  // GET PUBLIC PROFILE (with Redis cache)
  // ─────────────────────────────────────────────────────
  async getPublicProfile(username: string, viewerIp?: string) {
    const cacheKey = `profile:${username}`;

    // Try Redis cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      // Increment view count asynchronously
      this.incrementViewCount(username).catch(console.error);
      return JSON.parse(cached);
    }

    const profile = await this.prisma.profile.findUnique({
      where: { username },
      include: {
        links: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            url: true,
            iconUrl: true,
            type: true,
            orderIndex: true,
            clickCount: true,
            productImage: true,
            productPrice: true,
            gateType: true,
          },
        },
        integrations: {
          where: { isActive: true },
          select: {
            service: true,
            username: true,
            syncData: true,
          },
        },
        owner: {
          select: {
            plan: true,
          },
        },
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    const result = {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      backgroundUrl: profile.backgroundUrl,
      theme: profile.theme,
      primaryColor: profile.primaryColor,
      buttonStyle: profile.buttonStyle,
      showBranding: profile.showBranding,
      seoTitle: profile.seoTitle,
      seoDescription: profile.seoDescription,
      viewCount: profile.viewCount,
      links: profile.links,
      integrations: profile.integrations,
      plan: profile.owner?.plan || 'FREE',
    };

    // Cache for 5 minutes
    await this.redis.set(cacheKey, JSON.stringify(result), 300);

    // Increment view count
    this.incrementViewCount(username).catch(console.error);

    return result;
  }

  // ─────────────────────────────────────────────────────
  // UPLOAD AVATAR (via S3)
  // ─────────────────────────────────────────────────────
  async uploadAvatar(userId: string, file: any) {
    if (!file) throw new NotFoundException('No file uploaded');

    const profile = await this.prisma.profile.findUnique({
      where: { ownerUserId: userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const ext = file.originalname?.split('.').pop() || 'png';
    const fileName = `avatars/${profile.id}-${Date.now()}.${ext}`;

    const avatarUrl = await this.s3Service.uploadFile(file.buffer, fileName, file.mimetype);

    const updated = await this.prisma.profile.update({
      where: { id: profile.id },
      data: { avatarUrl },
    });

    await this.redis.del(`profile:${profile.username}`);
    return { avatarUrl: updated.avatarUrl };
  }

  // ─────────────────────────────────────────────────────
  // UPDATE BACKGROUND URL
  // ─────────────────────────────────────────────────────
  async updateBackground(userId: string, backgroundUrl: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { ownerUserId: userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const updated = await this.prisma.profile.update({
      where: { id: profile.id },
      data: { backgroundUrl },
    });

    await this.redis.del(`profile:${profile.username}`);
    return { backgroundUrl: updated.backgroundUrl };
  }

  // ─────────────────────────────────────────────────────
  // SET CUSTOM DOMAIN (Pro only)
  // ─────────────────────────────────────────────────────
  async setCustomDomain(userId: string, domain: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { ownerUserId: userId },
      include: { owner: true },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    if (profile.owner?.plan === 'FREE') {
      throw new ForbiddenException('Custom domain requires Pro plan');
    }

    // Check domain uniqueness
    const taken = await this.prisma.profile.findUnique({ where: { customDomain: domain } });
    if (taken && taken.id !== profile.id) throw new ConflictException('Domain already in use');

    const updated = await this.prisma.profile.update({
      where: { id: profile.id },
      data: { customDomain: domain },
    });

    return { customDomain: updated.customDomain };
  }

  // ─────────────────────────────────────────────────────
  // PRIVACY SETTINGS
  // ─────────────────────────────────────────────────────
  async updatePrivacy(userId: string, isPubliclyListed: boolean) {
    const profile = await this.prisma.profile.findUnique({
      where: { ownerUserId: userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.profile.update({
      where: { id: profile.id },
      data: { isPubliclyListed },
    });
  }

  // ─────────────────────────────────────────────────────
  // PRIVATE: Increment view count
  // ─────────────────────────────────────────────────────
  private async incrementViewCount(username: string) {
    await this.prisma.profile.update({
      where: { username },
      data: { viewCount: { increment: 1 } },
    });
  }
}
