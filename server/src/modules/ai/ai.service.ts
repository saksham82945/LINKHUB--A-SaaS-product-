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

  // ─────────────────────────────────────────────────────
  // GENERATE PORTFOLIO CONTENT (Phase 8)
  // ─────────────────────────────────────────────────────
  async generatePortfolioContent(context: {
    name: string;
    bio?: string;
    type?: string;
    github?: any;
    leetcode?: any;
    resumeProjects?: any[];
  }) {
    const prompt = `
Generate a structured, professional developer portfolio for:
Name: ${context.name}
Bio: ${context.bio || ''}
Type: ${context.type || 'DEV_CARD'}
GitHub data: ${JSON.stringify(context.github || {})}
LeetCode data: ${JSON.stringify(context.leetcode || {})}
Projects from resume: ${JSON.stringify(context.resumeProjects || [])}

Return a valid JSON object with the following structure:
{
  "name": "${context.name}",
  "headline": "Short, punchy professional title/headline (e.g. Senior Full-Stack Engineer)",
  "bio": "Compelling, impressive 2-3 sentence elevator pitch / story highlighting impact and craftsmanship",
  "location": "e.g. San Francisco, CA / Remote",
  "status": "Available for high-impact roles",
  "skills": [
    { "category": "Frontend", "items": ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
    { "category": "Backend", "items": ["Node.js", "NestJS", "PostgreSQL", "Redis"] },
    { "category": "DevOps & Cloud", "items": ["Docker", "AWS", "CI/CD", "Vercel"] },
    { "category": "Tools & Methods", "items": ["Git", "REST / GraphQL", "Agile", "Testing"] }
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "2-sentence impact-driven description of what it is and what was built.",
      "tags": ["Next.js", "TypeScript", "PostgreSQL"],
      "demoUrl": "https://example.com",
      "githubUrl": "https://github.com/example",
      "featured": true
    }
  ],
  "stats": [
    { "label": "Code Repos", "value": "20+" },
    { "label": "Problems Solved", "value": "150+" },
    { "label": "Stars & Contributions", "value": "500+" }
  ],
  "socials": {
    "github": "",
    "linkedin": "",
    "twitter": "",
    "website": ""
  },
  "theme": "dark-glass",
  "accentColor": "#6366f1"
}
`;

    const apiKey = this.config.get('OPENAI_API_KEY');
    if (apiKey && apiKey !== 'mock_key' && !apiKey.startsWith('sk-test') && apiKey.length > 20) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'You are an elite developer portfolio strategist. Create compelling, high-converting portfolios showcasing projects, measurable metrics, and technical expertise. Return only strict JSON matching the requested schema.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        });

        const parsed = JSON.parse(completion.choices[0].message.content || '{}');
        if (parsed.name && parsed.headline) {
          return parsed;
        }
      } catch (err) {
        console.warn('OpenAI portfolio generation fallback triggered:', err.message);
      }
    }

    return this.fallbackPortfolioContent(context);
  }

  private fallbackPortfolioContent(context: {
    name: string;
    bio?: string;
    type?: string;
    github?: any;
    leetcode?: any;
    resumeProjects?: any[];
  }) {
    const gh = context.github || {};
    const lc = context.leetcode || {};

    const projects = [];
    if (context.resumeProjects && context.resumeProjects.length > 0) {
      for (const p of context.resumeProjects.slice(0, 4)) {
        projects.push({
          title: p.name || p.title || 'Featured Project',
          description: p.description || 'Full-stack application built for scale and high performance.',
          tags: Array.isArray(p.tech) ? p.tech : ['React', 'Node.js', 'TypeScript'],
          demoUrl: p.url || '',
          githubUrl: p.githubUrl || '',
          featured: true,
        });
      }
    } else if (gh.topRepos && Array.isArray(gh.topRepos) && gh.topRepos.length > 0) {
      for (const r of gh.topRepos.slice(0, 4)) {
        projects.push({
          title: r.name || 'Open Source Project',
          description: r.description || `High performance repository with ${r.stars || 0} GitHub stars and active contributions.`,
          tags: [r.language || 'TypeScript', 'Node.js', 'Web'],
          demoUrl: r.homepage || '',
          githubUrl: r.url || `https://github.com/${gh.username || 'developer'}/${r.name}`,
          featured: true,
        });
      }
    } else {
      projects.push(
        {
          title: 'CloudScale SaaS Platform',
          description: 'High-throughput distributed backend and responsive dashboard supporting real-time analytics and team collaboration.',
          tags: ['Next.js', 'NestJS', 'PostgreSQL', 'Redis'],
          demoUrl: 'https://example.com',
          githubUrl: 'https://github.com',
          featured: true,
        },
        {
          title: 'AI Workflow Assistant',
          description: 'Intelligent multi-model agentic application providing automated document analysis and code transformations.',
          tags: ['React', 'TypeScript', 'OpenAI API', 'TailwindCSS'],
          demoUrl: 'https://example.com',
          githubUrl: 'https://github.com',
          featured: true,
        },
        {
          title: 'DevMetrics Dashboard',
          description: 'Comprehensive developer analytics engine displaying repository traffic, code velocity, and algorithmic benchmarks.',
          tags: ['TypeScript', 'Node.js', 'Chart.js', 'Docker'],
          demoUrl: 'https://example.com',
          githubUrl: 'https://github.com',
          featured: false,
        }
      );
    }

    const stats = [];
    if (gh.publicRepos !== undefined) {
      stats.push({ label: 'Public Repos', value: `${gh.publicRepos}` });
    } else {
      stats.push({ label: 'Repositories', value: '25+' });
    }
    if (gh.totalStars !== undefined && gh.totalStars > 0) {
      stats.push({ label: 'GitHub Stars', value: `${gh.totalStars}` });
    } else {
      stats.push({ label: 'Production Apps', value: '12+' });
    }
    if (lc.totalSolved !== undefined && lc.totalSolved > 0) {
      stats.push({ label: 'LeetCode Solved', value: `${lc.totalSolved}` });
    } else {
      stats.push({ label: 'System Uptime', value: '99.9%' });
    }

    return {
      name: context.name,
      headline: context.bio ? `${context.bio.slice(0, 60)}...` : 'Senior Full-Stack Software Engineer',
      bio: context.bio || `${context.name} is a software engineer dedicated to building resilient, beautiful, and user-centric web applications and distributed systems.`,
      location: 'San Francisco, CA / Remote',
      status: 'Available for high-impact roles',
      skills: [
        { category: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'State Management'] },
        { category: 'Backend', items: ['Node.js', 'NestJS', 'PostgreSQL', 'Redis', 'REST & GraphQL APIs'] },
        { category: 'DevOps & Cloud', items: ['Docker', 'AWS S3', 'CI/CD Pipelines', 'Vercel', 'Linux'] },
        { category: 'Architecture & Tools', items: ['Git', 'Microservices', 'Clean Code', 'Performance Optimization'] },
      ],
      projects,
      stats,
      socials: {
        github: gh.username ? `https://github.com/${gh.username}` : '',
        linkedin: '',
        twitter: '',
        website: '',
      },
      theme: 'dark-glass',
      accentColor: '#6366f1',
    };
  }
}
