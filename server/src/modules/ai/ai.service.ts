import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get('OPENAI_API_KEY'),
    });
  }

  // ─────────────────────────────────────────────────────
  // GENERATE PROFILE BIO
  // ─────────────────────────────────────────────────────
  async generateBio(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: { integrations: true },
        },
      },
    });
    if (!user || !user.profile) throw new NotFoundException('Profile not found');
    if (!['PRO', 'AGENCY', 'ENTERPRISE'].includes(user.plan)) {
      throw new ForbiddenException('AI features require Pro plan');
    }

    const integrations = user.profile.integrations;
    const github = integrations.find((i) => i.service === 'GITHUB')?.syncData as any;
    const leetcode = integrations.find((i) => i.service === 'LEETCODE')?.syncData as any;

    const context = [
      `Name: ${user.name}`,
      github && `GitHub: ${github.publicRepos} repos, ${github.totalStars} stars, ${github.followers} followers`,
      leetcode && `LeetCode: solved ${leetcode.totalSolved} problems, ranking #${leetcode.ranking}`,
    ]
      .filter(Boolean)
      .join('\n');

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional bio writer. Write a concise, impressive 2-3 sentence professional bio for a developer profile page. Focus on achievements. No fluff.',
        },
        {
          role: 'user',
          content: `Write a bio for this developer:\n${context}`,
        },
      ],
      max_tokens: 200,
    });

    return { bio: completion.choices[0].message.content?.trim() };
  }

  // ─────────────────────────────────────────────────────
  // ENHANCE RESUME BULLETS (from JD)
  // ─────────────────────────────────────────────────────
  async enhanceBullets(userId: string, bullets: string[], jobDescription: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!['PRO', 'AGENCY', 'ENTERPRISE'].includes(user.plan)) {
      throw new ForbiddenException('AI features require Pro plan');
    }

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a resume expert. Rewrite resume bullet points to match the provided job description, using strong action verbs and quantifiable impact. Keep each bullet under 20 words. Return a JSON array of strings.',
        },
        {
          role: 'user',
          content: `Job Description:\n${jobDescription}\n\nOriginal Bullets:\n${bullets.join('\n')}\n\nRewrite these bullets to match the JD keywords and style.`,
        },
      ],
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content || '{"bullets":[]}';
    return JSON.parse(content);
  }

  // ─────────────────────────────────────────────────────
  // ATS SCORE CHECK
  // ─────────────────────────────────────────────────────
  async checkAtsScore(resumeText: string, jobDescription: string) {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an ATS (Applicant Tracking System) expert. Analyze the resume against the job description and return a JSON object with: score (0-100), missingKeywords (array of strings), presentKeywords (array of strings), feedback (string).',
        },
        {
          role: 'user',
          content: `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}`,
        },
      ],
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content || '{}';
    return JSON.parse(content);
  }

  // ─────────────────────────────────────────────────────
  // GENERATE COVER LETTER
  // ─────────────────────────────────────────────────────
  async generateCoverLetter(
    userId: string,
    companyName: string,
    roleName: string,
    jobDescription: string,
    tone: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: { include: { integrations: true } },
        resumes: { where: { isActive: true }, take: 1 },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!['PRO', 'AGENCY', 'ENTERPRISE'].includes(user.plan)) {
      throw new ForbiddenException('AI cover letter requires Pro plan');
    }

    const resume = user.resumes[0];
    const resumeContext = resume
      ? `My resume summary: ${JSON.stringify(resume.content).substring(0, 1000)}`
      : '';

    const toneGuide: Record<string, string> = {
      FORMAL: 'formal and traditional',
      PROFESSIONAL: 'professional and polished',
      FRIENDLY: 'warm and friendly, good for startups',
      TECHNICAL: 'technical and detail-oriented',
      ENTHUSIASTIC: 'enthusiastic and passionate',
    };

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert cover letter writer. Write a ${toneGuide[tone] || 'professional'} cover letter. Make it personalized, relevant, and impressive. 3 paragraphs. No placeholder text.`,
        },
        {
          role: 'user',
          content: `
Company: ${companyName}
Role: ${roleName}
My Name: ${user.name}
${resumeContext}

Job Description:
${jobDescription}

Write a complete cover letter.`,
        },
      ],
      max_tokens: 800,
    });

    return { content: completion.choices[0].message.content?.trim() };
  }

  // ─────────────────────────────────────────────────────
  // EXTRACT KEYWORDS FROM JD
  // ─────────────────────────────────────────────────────
  async extractKeywords(jobDescription: string) {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'Extract the most important technical keywords and skills from this job description. Return JSON: { technical: string[], soft: string[], tools: string[] }',
        },
        { role: 'user', content: jobDescription },
      ],
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  }

  // ─────────────────────────────────────────────────────
  // GENERATE SMART LINK TITLE (from URL)
  // ─────────────────────────────────────────────────────
  async generateSmartLink(url: string) {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'Given a URL, suggest a short, professional title for a link button (max 5 words). Return JSON: { title: string }',
        },
        { role: 'user', content: `URL: ${url}` },
      ],
      max_tokens: 50,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(completion.choices[0].message.content || '{"title":"Link"}');
  }
}
