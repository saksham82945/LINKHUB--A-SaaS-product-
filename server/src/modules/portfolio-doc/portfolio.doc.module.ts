import { Module } from '@nestjs/common';
import { PortfolioDocController } from './portfolio-doc.controller';
import { PortfolioDocService } from './portfolio-doc.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [PortfolioDocController],
  providers: [PortfolioDocService],
  exports: [PortfolioDocService],
})
export class PortfoliodocModule {}
