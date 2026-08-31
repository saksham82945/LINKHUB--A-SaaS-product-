import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LinksService } from './links.service';
import { CreateLinkDto, UpdateLinkDto, ReorderLinksDto } from './dto/links.dto';

@Controller('links')
export class LinksController {
  constructor(private linksService: LinksService) {}

  // GET /api/links
  @Get()
  @UseGuards(JwtAuthGuard)
  getMyLinks(@Req() req: Request) {
    return this.linksService.getMyLinks((req.user as any).id);
  }

  // POST /api/links
  @Post()
  @UseGuards(JwtAuthGuard)
  createLink(@Req() req: Request, @Body() dto: CreateLinkDto) {
    return this.linksService.createLink((req.user as any).id, dto);
  }

  // PATCH /api/links/reorder
  @Patch('reorder')
  @UseGuards(JwtAuthGuard)
  reorderLinks(@Req() req: Request, @Body() dto: ReorderLinksDto) {
    return this.linksService.reorderLinks((req.user as any).id, dto);
  }

  // POST /api/links/click/:id — Public (no auth)
  @Post('click/:id')
  @HttpCode(HttpStatus.OK)
  recordClick(@Param('id') id: string, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress || '';
    const country = (req.headers['cf-ipcountry'] as string) || '';
    const ua = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] as string || '';

    // Simple device detection from user-agent
    const isMobile = /mobile|android|iphone/i.test(ua);
    const isTablet = /tablet|ipad/i.test(ua);
    const device = isTablet ? 'TABLET' : isMobile ? 'MOBILE' : 'DESKTOP';

    return this.linksService.recordClickAndGetUrl(id, ip, country, device, '', '', referrer);
  }

  // PATCH /api/links/:id
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateLink(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateLinkDto,
  ) {
    return this.linksService.updateLink((req.user as any).id, id, dto);
  }

  // PATCH /api/links/:id/toggle
  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard)
  toggleLink(@Req() req: Request, @Param('id') id: string) {
    return this.linksService.toggleLink((req.user as any).id, id);
  }

  // DELETE /api/links/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  deleteLink(@Req() req: Request, @Param('id') id: string) {
    return this.linksService.deleteLink((req.user as any).id, id);
  }
}
