import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}
  // TODO Phase 11: Team management
  async getTeam(teamId: string) { return { message: 'Teams coming in Phase 11', teamId }; }
}
