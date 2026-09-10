import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PortfolioDocService } from './portfolio-doc.service';

@Controller('portfolio-doc')
export class PortfolioDocController {
  constructor(private service: PortfolioDocService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getAll(@Req() req: Request) {
    return this.service.getMyDocs((req.user as any).id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: Request, @Body() body: any) {
    return this.service.createDoc((req.user as any).id, body);
  }

  // ─────────────────────────────────────────────────────
  // PUBLIC ACCESS (No JWT Guard) - Placed before :id
  // ─────────────────────────────────────────────────────
  @Get('public/:shareSlug')
  getPublic(@Param('shareSlug') shareSlug: string) {
    return this.service.getPublicDoc(shareSlug);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOne(@Req() req: Request, @Param('id') id: string) {
    return this.service.getDoc((req.user as any).id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.service.updateDoc((req.user as any).id, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  delete(@Req() req: Request, @Param('id') id: string) {
    return this.service.deleteDoc((req.user as any).id, id);
  }

  @Post(':id/ai-generate')
  @UseGuards(JwtAuthGuard)
  aiGenerate(@Req() req: Request, @Param('id') id: string) {
    return this.service.aiGenerate((req.user as any).id, id);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  toggleShare(@Req() req: Request, @Param('id') id: string) {
    return this.service.toggleShareSlug((req.user as any).id, id);
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  async downloadPdf(@Req() req: Request, @Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.service.generatePdf((req.user as any).id, id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="portfolio-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
