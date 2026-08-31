import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private http: HttpService,
  ) {}

  // ─────────────────────────────────────────────────────
  // GET ALL INTEGRATION STATUSES
  // ─────────────────────────────────────────────────────
  async getStatus(userId: string) {
    const profile = await this.getProfileByUserId(userId);

    const integrations = await this.prisma.integration.findMany({
      where: { profileId: profile.id },
      select: {
        service: true,
        username: true,
        isActive: true,
        lastSyncedAt: true,
      },
    });

    const statusMap: Record<string, any> = {
      GITHUB: null,
      LINKEDIN: null,
      TWITTER: null,
      LEETCODE: null,
      CODECHEF: null,
      NAUKRI: null,
    };

    integrations.forEach((i) => {
      statusMap[i.service] = {
        connected: i.isActive,
        username: i.username,
        lastSyncedAt: i.lastSyncedAt,
      };
    });

    return statusMap;
  }

  // ─────────────────────────────────────────────────────
  // GITHUB STATS
  // ─────────────────────────────────────────────────────
  async getGithubStats(username: string) {
    const cacheKey = `github:${username}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const [userRes, reposRes] = await Promise.all([
        firstValueFrom(
          this.http.get(`https://api.github.com/users/${username}`, {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              ...(process.env.GITHUB_TOKEN && {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
              }),
            },
          }),
        ),
        firstValueFrom(
          this.http.get(`https://api.github.com/users/${username}/repos?sort=stars&per_page=6`, {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              ...(process.env.GITHUB_TOKEN && {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
              }),
            },
          }),
        ),
      ]);

      const user = userRes.data;
      const repos = reposRes.data;

      const result = {
        username: user.login,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        totalStars: repos.reduce((sum: number, r: any) => sum + r.stargazers_count, 0),
        topRepos: repos.slice(0, 6).map((r: any) => ({
          name: r.name,
          description: r.description,
          stars: r.stargazers_count,
          forks: r.forks_count,
          language: r.language,
          url: r.html_url,
        })),
        profileUrl: user.html_url,
      };

      // Cache for 1 hour
      await this.redis.set(cacheKey, JSON.stringify(result), 3600);
      return result;
    } catch (error) {
      throw new NotFoundException(`GitHub user '${username}' not found`);
    }
  }

  // ─────────────────────────────────────────────────────
  // LEETCODE STATS (public API)
  // ─────────────────────────────────────────────────────
  async getLeetcodeStats(username: string) {
    const cacheKey = `leetcode:${username}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const query = `
        query userPublicProfile($username: String!) {
          matchedUser(username: $username) {
            username
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
            profile {
              ranking
              userAvatar
              realName
              countryName
            }
            badges { name }
            activeBadge { displayName }
          }
          userContestRanking(username: $username) {
            attendedContestsCount
            rating
            globalRanking
            topPercentage
          }
        }
      `;

      const res = await firstValueFrom(
        this.http.post(
          'https://leetcode.com/graphql',
          { query, variables: { username } },
          { headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' } },
        ),
      );

      const data = res.data?.data;
      const user = data?.matchedUser;
      if (!user) throw new Error('User not found');

      const stats = user.submitStats?.acSubmissionNum || [];
      const easy = stats.find((s: any) => s.difficulty === 'Easy')?.count || 0;
      const medium = stats.find((s: any) => s.difficulty === 'Medium')?.count || 0;
      const hard = stats.find((s: any) => s.difficulty === 'Hard')?.count || 0;

      const result = {
        username,
        ranking: user.profile?.ranking,
        rating: Math.round(data?.userContestRanking?.rating || 0),
        globalRanking: data?.userContestRanking?.globalRanking,
        topPercentage: data?.userContestRanking?.topPercentage,
        contestsAttended: data?.userContestRanking?.attendedContestsCount || 0,
        totalSolved: easy + medium + hard,
        easySolved: easy,
        mediumSolved: medium,
        hardSolved: hard,
        activeBadge: user.activeBadge?.displayName,
        profileUrl: `https://leetcode.com/${username}`,
      };

      // Cache for 6 hours
      await this.redis.set(cacheKey, JSON.stringify(result), 21600);
      return result;
    } catch {
      throw new NotFoundException(`LeetCode user '${username}' not found`);
    }
  }

  // ─────────────────────────────────────────────────────
  // CODECHEF STATS (public profile scraping via unofficial API)
  // ─────────────────────────────────────────────────────
  async getCodechefStats(username: string) {
    const cacheKey = `codechef:${username}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      // CodeChef unofficial API
      const res = await firstValueFrom(
        this.http.get(`https://codechef-api.vercel.app/handle/${username}`),
      );

      const data = res.data;

      const result = {
        username,
        name: data.name,
        currentRating: data.currentRating,
        highestRating: data.highestRating,
        countryRank: data.countryRank,
        globalRank: data.globalRank,
        stars: data.stars,
        profileUrl: `https://www.codechef.com/users/${username}`,
      };

      // Cache for 6 hours
      await this.redis.set(cacheKey, JSON.stringify(result), 21600);
      return result;
    } catch {
      throw new NotFoundException(`CodeChef user '${username}' not found`);
    }
  }

  // ─────────────────────────────────────────────────────
  // DEV SCORECARD — Combined score from all platforms
  // ─────────────────────────────────────────────────────
  async getDevScorecard(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    const integrations = await this.prisma.integration.findMany({
      where: { profileId: profile.id, isActive: true },
    });

    let githubScore = 0;
    let leetcodeScore = 0;
    let codechefScore = 0;
    let details: any = {};

    for (const integration of integrations) {
      const data = integration.syncData as any;
      if (!data) continue;

      if (integration.service === 'GITHUB') {
        // Score: stars (30) + followers (20) + repos (20) + contributions (30)
        const stars = Math.min(data.totalStars || 0, 100);
        const followers = Math.min(data.followers || 0, 100);
        const repos = Math.min(data.publicRepos || 0, 50);
        githubScore = Math.round((stars * 0.3 + followers * 0.2 + repos * 0.5));
        details.github = { score: githubScore, stars, followers, repos };
      }

      if (integration.service === 'LEETCODE') {
        // Score based on problems solved (0-500) and rating
        const solved = Math.min(data.totalSolved || 0, 500);
        const rating = Math.min(data.rating || 0, 3500);
        leetcodeScore = Math.round((solved / 500) * 50 + (rating / 3500) * 50);
        details.leetcode = { score: leetcodeScore, solved, rating };
      }

      if (integration.service === 'CODECHEF') {
        // Score based on rating (1200-2500)
        const rating = Math.max(0, Math.min(data.currentRating || 0, 2500) - 1200);
        codechefScore = Math.round((rating / 1300) * 100);
        details.codechef = { score: codechefScore, rating: data.currentRating, stars: data.stars };
      }
    }

    // Combined formula from plan
    const overallScore = Math.round(
      leetcodeScore * 0.35 + githubScore * 0.35 + codechefScore * 0.30,
    );

    // Badge assignment
    let badge = 'Beginner';
    if (overallScore >= 80) badge = 'Elite Developer';
    else if (overallScore >= 60) badge = 'Advanced Developer';
    else if (overallScore >= 40) badge = 'Intermediate Developer';
    else if (overallScore >= 20) badge = 'Junior Developer';

    return { overallScore, badge, details };
  }

  // ─────────────────────────────────────────────────────
  // CONNECT INTEGRATION (save username + trigger sync)
  // ─────────────────────────────────────────────────────
  async connectIntegration(userId: string, service: string, username: string) {
    const profile = await this.getProfileByUserId(userId);

    // Fetch and cache data
    let syncData: any = null;
    try {
      if (service === 'GITHUB') syncData = await this.getGithubStats(username);
      else if (service === 'LEETCODE') syncData = await this.getLeetcodeStats(username);
      else if (service === 'CODECHEF') syncData = await this.getCodechefStats(username);
    } catch {
      // Still save even if data fetch fails
    }

    const integration = await this.prisma.integration.upsert({
      where: { profileId_service: { profileId: profile.id, service: service as any } },
      create: {
        profileId: profile.id,
        service: service as any,
        username,
        isActive: true,
        lastSyncedAt: new Date(),
        syncData,
      },
      update: {
        username,
        isActive: true,
        lastSyncedAt: new Date(),
        syncData,
      },
    });

    await this.redis.del(`profile:${profile.username}`);
    return integration;
  }

  // ─────────────────────────────────────────────────────
  // DISCONNECT INTEGRATION
  // ─────────────────────────────────────────────────────
  async disconnectIntegration(userId: string, service: string) {
    const profile = await this.getProfileByUserId(userId);

    await this.prisma.integration.updateMany({
      where: { profileId: profile.id, service: service as any },
      data: { isActive: false },
    });

    await this.redis.del(`profile:${profile.username}`);
    return { message: `${service} disconnected successfully` };
  }

  // ─────────────────────────────────────────────────────
  // MANUAL SYNC
  // ─────────────────────────────────────────────────────
  async syncIntegration(userId: string, service: string) {
    const profile = await this.getProfileByUserId(userId);

    const integration = await this.prisma.integration.findUnique({
      where: { profileId_service: { profileId: profile.id, service: service as any } },
    });

    if (!integration || !integration.username) {
      throw new NotFoundException('Integration not found');
    }

    // Clear cache and re-fetch
    let cacheKey = '';
    if (service === 'GITHUB') cacheKey = `github:${integration.username}`;
    else if (service === 'LEETCODE') cacheKey = `leetcode:${integration.username}`;
    else if (service === 'CODECHEF') cacheKey = `codechef:${integration.username}`;

    if (cacheKey) await this.redis.del(cacheKey);

    return this.connectIntegration(userId, service, integration.username);
  }

  // ─────────────────────────────────────────────────────
  // PRIVATE HELPER
  // ─────────────────────────────────────────────────────
  private async getProfileByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { ownerUserId: userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }
}
