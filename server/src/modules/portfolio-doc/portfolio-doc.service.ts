import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PortfolioDocService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────
  // GET ALL
  // ─────────────────────────────────────────────────────
  async getMyDocs(userId: string) {
    return this.prisma.portfolioDoc.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // ─────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────
  async createDoc(userId: string, data: { title: string; type: string; template: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { include: { integrations: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.plan === 'FREE') {
      const count = await this.prisma.portfolioDoc.count({ where: { userId } });
      if (count >= 1) throw new ForbiddenException('Free plan allows 1 portfolio document.');
    }

    // Auto-fill basic context from integrations
    let content = { name: user.name, bio: user.profile?.bio || '', projects: [], skills: [] };

    return this.prisma.portfolioDoc.create({
      data: {
        userId,
        title: data.title || 'My Dev Card',
        type: (data.type as any) || 'DEV_CARD',
        content: content as any,
      },
    });
  }

  // ─────────────────────────────────────────────────────
  // GET ONE
  // ─────────────────────────────────────────────────────
  async getDoc(userId: string, id: string) {
    const doc = await this.prisma.portfolioDoc.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  // ─────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────
  async updateDoc(userId: string, id: string, data: any) {
    const doc = await this.prisma.portfolioDoc.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.portfolioDoc.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
      },
    });
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
  // GENERATE PDF (Puppeteer)
  // ─────────────────────────────────────────────────────
  async generatePdf(userId: string, id: string) {
    const doc = await this.prisma.portfolioDoc.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');

    const content = doc.content as any;

    // Very basic HTML template for Dev Card
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #0f172a; color: white; padding: 40px; }
          .card { background: #1e293b; border-radius: 20px; padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h1 { color: #818cf8; font-size: 3rem; margin-bottom: 10px; }
          p { color: #cbd5e1; font-size: 1.2rem; line-height: 1.6; }
          .badge { display: inline-block; background: #3730a3; color: white; padding: 8px 16px; border-radius: 20px; margin: 5px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${content.name || 'Developer'}</h1>
          <p>${content.bio || 'Passionate software engineer building amazing things.'}</p>
          <div style="margin-top: 30px;">
            <span class="badge">Next.js</span>
            <span class="badge">NestJS</span>
            <span class="badge">TypeScript</span>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html);
      
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw new Error('Failed to generate PDF: ' + error.message);
    }
  }
}
