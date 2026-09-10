import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PortfolioDocService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  private parseContent(content: any) {
    if (typeof content === 'string') {
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    }
    return content || {};
  }

  private serializeContent(content: any) {
    if (content && typeof content === 'object') {
      return JSON.stringify(content);
    }
    return content || '{}';
  }

  // ─────────────────────────────────────────────────────
  // GET ALL
  // ─────────────────────────────────────────────────────
  async getMyDocs(userId: string) {
    const docs = await this.prisma.portfolioDoc.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        shareSlug: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return docs;
  }

  // ─────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────
  async createDoc(userId: string, data: { title?: string; type?: string; template?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { include: { integrations: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.plan === 'FREE') {
      const count = await this.prisma.portfolioDoc.count({ where: { userId } });
      if (count >= 1) throw new ForbiddenException('Free plan allows 1 portfolio document. Upgrade to Pro for unlimited.');
    }

    const defaultContent = {
      name: user.name,
      headline: user.profile?.bio?.slice(0, 60) || 'Software Engineer & Builder',
      bio: user.profile?.bio || `${user.name} is a software engineer passionate about building high-quality, impactful applications and distributed systems.`,
      location: 'Remote',
      status: 'Open for opportunities',
      skills: [
        { category: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'] },
        { category: 'Backend', items: ['Node.js', 'NestJS', 'PostgreSQL', 'REST APIs'] },
        { category: 'DevOps & Tools', items: ['Git', 'Docker', 'Vercel'] },
      ],
      projects: [
        {
          title: 'Full-Stack Web Platform',
          description: 'A modern, high-performance web platform featuring responsive dashboard analytics, robust authentication, and cloud infrastructure.',
          tags: ['Next.js', 'TypeScript', 'PostgreSQL'],
          demoUrl: '',
          githubUrl: '',
          featured: true,
        },
      ],
      stats: [
        { label: 'Repositories', value: '15+' },
        { label: 'Projects Built', value: '8+' },
      ],
      socials: {
        github: '',
        linkedin: '',
        twitter: '',
        website: '',
      },
      theme: 'dark-glass',
      accentColor: '#6366f1',
    };

    const docType = data.type || 'DEV_CARD';
    const docTitle = data.title || (docType === 'DEV_CARD' ? `${user.name} - Dev Card` : 'Developer Portfolio');

    const created = await this.prisma.portfolioDoc.create({
      data: {
        userId,
        title: docTitle,
        type: docType,
        content: this.serializeContent(defaultContent),
      },
    });

    return {
      ...created,
      content: defaultContent,
    };
  }

  // ─────────────────────────────────────────────────────
  // GET ONE
  // ─────────────────────────────────────────────────────
  async getDoc(userId: string, id: string) {
    const doc = await this.prisma.portfolioDoc.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');
    return {
      ...doc,
      content: this.parseContent(doc.content),
    };
  }

  // ─────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────
  async updateDoc(userId: string, id: string, data: any) {
    const doc = await this.prisma.portfolioDoc.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');

    const updated = await this.prisma.portfolioDoc.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.content !== undefined && { content: this.serializeContent(data.content) }),
      },
    });

    return {
      ...updated,
      content: this.parseContent(updated.content),
    };
  }

  // ─────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────
  async deleteDoc(userId: string, id: string) {
    const doc = await this.prisma.portfolioDoc.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');

    await this.prisma.portfolioDoc.delete({ where: { id } });
    return { message: 'Document deleted' };
  }

  // ─────────────────────────────────────────────────────
  // AI GENERATE / SYNTHESIZE CONTENT
  // ─────────────────────────────────────────────────────
  async aiGenerate(userId: string, id: string) {
    const doc = await this.prisma.portfolioDoc.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            integrations: true,
          },
        },
        resumes: {
          where: { isActive: true },
          take: 1,
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const integrations = user.profile?.integrations || [];
    const ghIntegration = integrations.find((i) => i.service === 'GITHUB');
    const lcIntegration = integrations.find((i) => i.service === 'LEETCODE');

    let ghData: any = null;
    let lcData: any = null;
    try {
      if (ghIntegration?.syncData) {
        ghData = typeof ghIntegration.syncData === 'string' ? JSON.parse(ghIntegration.syncData) : ghIntegration.syncData;
      }
      if (lcIntegration?.syncData) {
        lcData = typeof lcIntegration.syncData === 'string' ? JSON.parse(lcIntegration.syncData) : lcIntegration.syncData;
      }
    } catch (e) {
      console.warn('Failed to parse integration syncData', e);
    }

    let resumeProjects: any[] = [];
    if (user.resumes?.[0]?.content) {
      try {
        const rc = typeof user.resumes[0].content === 'string' ? JSON.parse(user.resumes[0].content) : user.resumes[0].content;
        if (Array.isArray(rc?.projects)) {
          resumeProjects = rc.projects;
        }
      } catch (e) {}
    }

    const generated = await this.aiService.generatePortfolioContent({
      name: user.name,
      bio: user.profile?.bio || '',
      type: doc.type,
      github: ghData,
      leetcode: lcData,
      resumeProjects,
    });

    const updated = await this.prisma.portfolioDoc.update({
      where: { id },
      data: {
        content: this.serializeContent(generated),
        ...(generated.headline && doc.title.startsWith('My Dev Card') ? { title: `${user.name} - ${generated.headline.slice(0, 35)}` } : {}),
      },
    });

    return {
      ...updated,
      content: this.parseContent(updated.content),
    };
  }

  // ─────────────────────────────────────────────────────
  // SHARE / TOGGLE PUBLIC SLUG
  // ─────────────────────────────────────────────────────
  async toggleShareSlug(userId: string, id: string) {
    const doc = await this.prisma.portfolioDoc.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');

    let slug = doc.shareSlug;
    if (!slug) {
      const cleanTitle = (doc.title || 'portfolio')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 30);
      const rand = Math.random().toString(36).substring(2, 7);
      slug = `${cleanTitle}-${rand}`;

      await this.prisma.portfolioDoc.update({
        where: { id },
        data: { shareSlug: slug },
      });
    }

    return {
      shareSlug: slug,
      url: `/p/${slug}`,
    };
  }

  // ─────────────────────────────────────────────────────
  // GET PUBLIC DOC (Unauthenticated)
  // ─────────────────────────────────────────────────────
  async getPublicDoc(shareSlug: string) {
    const doc = await this.prisma.portfolioDoc.findUnique({
      where: { shareSlug },
      include: {
        user: {
          include: {
            profile: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                primaryColor: true,
              },
            },
          },
        },
      },
    });

    if (!doc) throw new NotFoundException('Portfolio document not found or link has expired');

    // Async increment view counter
    this.prisma.portfolioDoc
      .update({
        where: { id: doc.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((err) => console.error('Failed to increment portfolio view count:', err));

    return {
      id: doc.id,
      title: doc.title,
      type: doc.type,
      shareSlug: doc.shareSlug,
      viewCount: doc.viewCount + 1,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      content: this.parseContent(doc.content),
      author: {
        name: doc.user.name,
        profile: doc.user.profile,
      },
    };
  }

  // ─────────────────────────────────────────────────────
  // GENERATE PDF (Puppeteer with Modern Styling)
  // ─────────────────────────────────────────────────────
  async generatePdf(userId: string, id: string) {
    const doc = await this.prisma.portfolioDoc.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');

    const content = this.parseContent(doc.content);
    const name = content.name || 'Developer';
    const headline = content.headline || 'Software Engineer';
    const bio = content.bio || 'Passionate software engineer building resilient, modern applications.';
    const location = content.location || 'Remote';
    const skills = Array.isArray(content.skills) ? content.skills : [];
    const projects = Array.isArray(content.projects) ? content.projects : [];
    const stats = Array.isArray(content.stats) ? content.stats : [];
    const accentColor = content.accentColor || '#6366f1';

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #090d16;
            color: #f1f5f9;
            padding: 36px;
            font-size: 14px;
            line-height: 1.5;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid #1e293b;
            padding-bottom: 24px;
            margin-bottom: 24px;
          }
          .name {
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.5px;
          }
          .headline {
            font-size: 16px;
            font-weight: 600;
            color: ${accentColor};
            margin-top: 4px;
          }
          .meta {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 6px;
          }
          .badge-status {
            display: inline-block;
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .section {
            margin-bottom: 24px;
          }
          .section-title {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 12px;
            border-left: 3px solid ${accentColor};
            padding-left: 8px;
          }
          .bio-text {
            color: #cbd5e1;
            font-size: 14px;
            line-height: 1.6;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .stat-card {
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 12px;
            padding: 14px;
            text-align: center;
          }
          .stat-val {
            font-size: 20px;
            font-weight: 800;
            color: #ffffff;
          }
          .stat-lbl {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 2px;
          }
          .skills-group {
            margin-bottom: 10px;
          }
          .skill-cat {
            font-size: 12px;
            font-weight: 600;
            color: #94a3b8;
            margin-bottom: 6px;
          }
          .skill-tag {
            display: inline-block;
            background: #1e293b;
            color: #e2e8f0;
            border: 1px solid #334155;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            margin-right: 6px;
            margin-bottom: 6px;
            font-weight: 500;
          }
          .project-card {
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
          }
          .project-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
          }
          .project-title {
            font-size: 15px;
            font-weight: 700;
            color: #ffffff;
          }
          .project-desc {
            font-size: 12px;
            color: #cbd5e1;
            line-height: 1.5;
            margin-bottom: 10px;
          }
          .footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #1e293b;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <h1 class="name">${name}</h1>
              <div class="headline">${headline}</div>
              <div class="meta">📍 ${location} &nbsp;•&nbsp; ${doc.type.replace('_', ' ')}</div>
            </div>
            <div>
              <span class="badge-status">${content.status || 'Active Portfolio'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">About</div>
            <p class="bio-text">${bio}</p>
          </div>

          ${
            stats.length > 0
              ? `
            <div class="stats-grid">
              ${stats
                .map(
                  (s: any) => `
                <div class="stat-card">
                  <div class="stat-val">${s.value}</div>
                  <div class="stat-lbl">${s.label}</div>
                </div>
              `,
                )
                .join('')}
            </div>
          `
              : ''
          }

          <div class="section">
            <div class="section-title">Core Competencies & Tech Stack</div>
            ${skills
              .map(
                (grp: any) => `
              <div class="skills-group">
                <div class="skill-cat">${grp.category || 'Skills'}</div>
                <div>
                  ${(grp.items || [])
                    .map((item: string) => `<span class="skill-tag">${item}</span>`)
                    .join('')}
                </div>
              </div>
            `,
              )
              .join('')}
          </div>

          ${
            projects.length > 0
              ? `
            <div class="section">
              <div class="section-title">Highlighted Projects</div>
              ${projects
                .map(
                  (p: any) => `
                <div class="project-card">
                  <div class="project-header">
                    <span class="project-title">${p.title}</span>
                  </div>
                  <p class="project-desc">${p.description || ''}</p>
                  <div>
                    ${(p.tags || [])
                      .map((t: string) => `<span class="skill-tag" style="background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.25); color: #a5b4fc;">${t}</span>`)
                      .join('')}
                  </div>
                </div>
              `,
                )
                .join('')}
            </div>
          `
              : ''
          }

          <div class="footer">
            <span>Powered by LinkHub — Professional Link-in-Bio & Career Platform</span>
            <span>Generated on ${new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </body>
      </html>
    `;

    let browser: any = null;
    try {
      browser = await puppeteer.launch({
        headless: 'new' as any,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '24px', bottom: '24px', left: '24px', right: '24px' },
      });

      await browser.close();
      return pdfBuffer;
    } catch (error) {
      if (browser) await browser.close();
      throw new Error('Failed to generate PDF: ' + error.message);
    }
  }
}
