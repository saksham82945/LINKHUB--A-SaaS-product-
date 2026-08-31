import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

interface ResumeContent {
  contactInfo: { name: string; email: string; phone?: string; location?: string; linkedin?: string; github?: string };
  summary?: string;
  experience: Array<{ company: string; role: string; duration: string; bullets: string[] }>;
  education: Array<{ institution: string; degree: string; year: string }>;
  skills: string[];
  projects: Array<{ name: string; description: string; tech: string[]; url?: string }>;
  certifications?: string[];
  achievements?: string[];
  competitive?: { leetcode?: string; codechef?: string };
}

@Injectable()
export class ResumeService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  // ─────────────────────────────────────────────────────
  // GET ALL MY RESUMES
  // ─────────────────────────────────────────────────────
  async getMyResumes(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        title: true,
        template: true,
        atsScore: true,
        createdAt: true,
        updatedAt: true,
        shareSlug: true,
        viewCount: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────────────
  // CREATE RESUME
  // ─────────────────────────────────────────────────────
  async createResume(userId: string, title: string, template: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user) throw new NotFoundException('User not found');

    // Free plan: max 1 resume
    if (user.plan === 'FREE') {
      const count = await this.prisma.resume.count({ where: { userId, isActive: true } });
      if (count >= 1) {
        throw new ForbiddenException('Free plan allows 1 resume. Upgrade for unlimited.');
      }
    }

    const defaultContent: ResumeContent = {
      contactInfo: {
        name: user.name,
        email: user.email,
        linkedin: '',
        github: '',
      },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      achievements: [],
      competitive: {},
    };

    return this.prisma.resume.create({
      data: {
        userId,
        title: title || 'My Resume',
        template: (template as any) || 'ATS_CLEAN',
        content: defaultContent as any,
      },
    });
  }

  // ─────────────────────────────────────────────────────
  // GET RESUME BY ID
  // ─────────────────────────────────────────────────────
  async getResume(userId: string, resumeId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!resume) throw new NotFoundException('Resume not found');
    return resume;
  }

  // ─────────────────────────────────────────────────────
  // UPDATE RESUME CONTENT
  // ─────────────────────────────────────────────────────
  async updateResume(userId: string, resumeId: string, data: Partial<{ title: string; template: string; content: any }>) {
    const resume = await this.prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (!resume) throw new NotFoundException('Resume not found');

    // Save version before updating
    await this.saveVersion(resumeId, 'RESUME', resume.content, resume.id);

    return this.prisma.resume.update({
      where: { id: resumeId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.template && { template: data.template as any }),
        ...(data.content && { content: data.content }),
      },
    });
  }

  // ─────────────────────────────────────────────────────
  // DELETE RESUME
  // ─────────────────────────────────────────────────────
  async deleteResume(userId: string, resumeId: string) {
    const resume = await this.prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (!resume) throw new NotFoundException('Resume not found');

    await this.prisma.resume.update({
      where: { id: resumeId },
      data: { isActive: false },
    });
    return { message: 'Resume deleted' };
  }

  // ─────────────────────────────────────────────────────
  // AUTO-FILL FROM INTEGRATIONS
  // ─────────────────────────────────────────────────────
  async autoFillFromIntegrations(userId: string, resumeId: string) {
    const resume = await this.prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (!resume) throw new NotFoundException('Resume not found');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: { include: { integrations: { where: { isActive: true } } } },
      },
    });
    if (!user || !user.profile) throw new NotFoundException('Profile not found');

    const integrations = user.profile.integrations;
    const github = integrations.find((i) => i.service === 'GITHUB')?.syncData as any;
    const leetcode = integrations.find((i) => i.service === 'LEETCODE')?.syncData as any;
    const codechef = integrations.find((i) => i.service === 'CODECHEF')?.syncData as any;

    const currentContent = resume.content as any as ResumeContent;

    const updatedContent: ResumeContent = {
      ...currentContent,
      contactInfo: {
        ...currentContent.contactInfo,
        name: user.name,
        email: user.email,
        github: github ? `github.com/${github.username}` : currentContent.contactInfo.github,
      },
      projects: github?.topRepos
        ? github.topRepos.slice(0, 4).map((repo: any) => ({
            name: repo.name,
            description: repo.description || '',
            tech: [repo.language || 'Code'],
            url: repo.url,
          }))
        : currentContent.projects,
      competitive: {
        leetcode: leetcode
          ? `Solved ${leetcode.totalSolved}+ problems, Rating ${leetcode.rating}, Rank #${leetcode.ranking}`
          : currentContent.competitive?.leetcode,
        codechef: codechef
          ? `${codechef.stars} rated, Rating ${codechef.currentRating}`
          : currentContent.competitive?.codechef,
      },
    };

    return this.prisma.resume.update({
      where: { id: resumeId },
      data: { content: updatedContent as any },
    });
  }

  // ─────────────────────────────────────────────────────
  // ATS SCORE CHECK
  // ─────────────────────────────────────────────────────
  async checkAtsScore(userId: string, resumeId: string, jobDescription: string) {
    const resume = await this.prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (!resume) throw new NotFoundException('Resume not found');

    // Convert content to plain text for analysis
    const content = resume.content as any;
    const resumeText = JSON.stringify(content);

    const result = await this.aiService.checkAtsScore(resumeText, jobDescription);

    // Save ATS score
    await this.prisma.resume.update({
      where: { id: resumeId },
      data: { atsScore: result.score, lastJobDesc: jobDescription },
    });

    return result;
  }

  // ─────────────────────────────────────────────────────
  // CREATE SHARE LINK
  // ─────────────────────────────────────────────────────
  async createShareLink(userId: string, resumeId: string, password?: string, expiresInDays?: number) {
    const resume = await this.prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (!resume) throw new NotFoundException('Resume not found');

    const slug = `${userId.substring(0, 8)}-${Date.now().toString(36)}`;

    return this.prisma.resume.update({
      where: { id: resumeId },
      data: {
        shareSlug: slug,
        ...(password && { sharePassword: password }),
        ...(expiresInDays && {
          shareExpiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
        }),
      },
      select: { shareSlug: true, shareExpiresAt: true },
    });
  }

  // ─────────────────────────────────────────────────────
  // VIEW SHARED RESUME (public)
  // ─────────────────────────────────────────────────────
  async getSharedResume(slug: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { shareSlug: slug },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!resume) throw new NotFoundException('Resume not found');
    if (resume.shareExpiresAt && resume.shareExpiresAt < new Date()) {
      throw new NotFoundException('This share link has expired');
    }

    // Increment view count
    this.prisma.resume.update({ where: { id: resume.id }, data: { viewCount: { increment: 1 } } }).catch(console.error);

    return resume;
  }

  // ─────────────────────────────────────────────────────
  // PRIVATE: Save version snapshot
  // ─────────────────────────────────────────────────────
  private async saveVersion(documentId: string, documentType: 'RESUME' | 'COVER_LETTER' | 'PORTFOLIO', content: any, resumeId?: string) {
    const existing = await this.prisma.documentVersion.count({ where: { resumeId: documentId } });

    // Keep max 10 versions (Pro) or 3 (Free)
    await this.prisma.documentVersion.create({
      data: {
        documentType: documentType as any,
        versionNumber: existing + 1,
        contentSnapshot: content,
        resumeId: documentId,
      },
    });
  }

  async getVersions(userId: string, resumeId: string) {
    const resume = await this.prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (!resume) throw new NotFoundException('Resume not found');

    return this.prisma.documentVersion.findMany({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
      take: 10,
    });
  }
}
