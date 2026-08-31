import { Controller, Get } from '@nestjs/common';
import { TeamsService } from './teams.service';

@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get('health')
  health() { return { module: 'teams', status: 'Phase 11 coming soon' }; }
}
