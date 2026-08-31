import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class CoverLetterService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  // ─────────────────────────────────────────────────────
  // GET ALL MY COVER LETTERS
  // ─────────────────────────────────────────────────────
  async getMyCoverLetters(userId: string) {
    return this.prisma.coverLetter.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        companyName: true,
        roleName: true,
        tone: true,
        template: true,
        createdAt: true,
        updatedAt: true,
        shareSlug: true,
        viewCount: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────────────
  // CREATE COVER LETTER (empty — fill with AI after)
  // ─────────────────────────────────────────────────────
  async createCoverLetter(
    userId: string,
    data: {
      title?: string;
      companyName?: string;
      roleName?: string;
      jobDescription?: string;
      tone?: string;
      template?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Free plan: max 1 cover letter
    if (user.plan === 'FREE') {
      const count = await this.prisma.coverLetter.count({ where: { userId } });
      if (count >= 1) {
        throw new ForbiddenException('Free plan allows 1 cover letter. Upgrade for unlimited.');
      }
    }

    return this.prisma.coverLetter.create({
      data: {
        userId,
        title: data.title || 'Cover Letter',
        companyName: data.companyName || '',
        roleName: data.roleName || '',
        jobDescription: data.jobDescription || '',
        tone: (data.tone as any) || 'PROFESSIONAL',
        template: (data.template as any) || 'STANDARD',
        content: '',
      },
    });
  }

  // ─────────────────────────────────────────────────────
  // GET SINGLE
  // ─────────────────────────────────────────────────────
  async getCoverLetter(userId: string, id: string) {
    const letter = await this.prisma.coverLetter.findFirst({ where: { id, userId } });
    if (!letter) throw new NotFoundException('Cover letter not found');
    return letter;
  }

  // ─────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────
  async updateCoverLetter(userId: string, id: string, data: Partial<{ title: string; content: string; companyName: string; roleName: string; tone: string }>) {
    const letter = await this.prisma.coverLetter.findFirst({ where: { id, userId } });
    if (!letter) throw new NotFoundException('Cover letter not found');

    return this.prisma.coverLetter.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.companyName && { companyName: data.companyName }),
        ...(data.roleName && { roleName: data.roleName }),
        ...(data.tone && { tone: data.tone as any }),
      },
    });
  }

  // ─────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────
  async deleteCoverLetter(userId: string, id: string) {
    const letter = await this.prisma.coverLetter.findFirst({ where: { id, userId } });
    if (!letter) throw new NotFoundException('Cover letter not found');
    await this.prisma.coverLetter.delete({ where: { id } });
    return { message: 'Cover letter deleted' };
  }

  // ─────────────────────────────────────────────────────
  // AI GENERATE FULL LETTER
  // ─────────────────────────────────────────────────────
  async aiGenerate(userId: string, id: string) {
    const letter = await this.prisma.coverLetter.findFirst({ where: { id, userId } });
    if (!letter) throw new NotFoundException('Cover letter not found');
    if (!letter.companyName || !letter.roleName || !letter.jobDescription) {
      throw new NotFoundException('Please fill company name, role, and job description first');
    }

    const result = await this.aiService.generateCoverLetter(
      userId,
      letter.companyName,
      letter.roleName,
      letter.jobDescription,
      letter.tone,
    );

    return this.prisma.coverLetter.update({
      where: { id },
      data: { content: result.content || '' },
    });
  }

  // ─────────────────────────────────────────────────────
  // CREATE SHARE LINK
  // ─────────────────────────────────────────────────────
  async createShareLink(userId: string, id: string, password?: string, expiresInDays?: number) {
    const letter = await this.prisma.coverLetter.findFirst({ where: { id, userId } });
    if (!letter) throw new NotFoundException('Cover letter not found');

    const slug = `cl-${userId.substring(0, 8)}-${Date.now().toString(36)}`;

    return this.prisma.coverLetter.update({
      where: { id },
      data: {
        shareSlug: slug,
        ...(password && { sharePassword: password }),
        ...(expiresInDays && { shareExpiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) }),
      },
      select: { shareSlug: true, shareExpiresAt: true },
    });
  }

  // ─────────────────────────────────────────────────────
  // VIEW SHARED (public)
  // ─────────────────────────────────────────────────────
  async getSharedCoverLetter(slug: string) {
    const letter = await this.prisma.coverLetter.findUnique({ where: { shareSlug: slug } });
    if (!letter) throw new NotFoundException('Not found');
    if (letter.shareExpiresAt && letter.shareExpiresAt < new Date()) {
      throw new NotFoundException('Share link expired');
    }
    this.prisma.coverLetter.update({ where: { id: letter.id }, data: { viewCount: { increment: 1 } } }).catch(console.error);
    return letter;
  }
}
