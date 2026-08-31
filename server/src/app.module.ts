import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { LinksModule } from './modules/links/links.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ResumeModule } from './modules/resume/resume.module';
import { CoverletterModule } from './modules/cover-letter/cover.letter.module';
import { PortfoliodocModule } from './modules/portfolio-doc/portfolio.doc.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TeamsModule } from './modules/teams/teams.module';
import { EmaillistModule } from './modules/email-list/email.list.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminModule } from './modules/admin/admin.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AwsModule } from './modules/aws/aws.module';

@Module({
  imports: [
    // ── Config (env vars available everywhere)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Rate Limiting (100 req / 15 min globally)
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 900000,
        limit: 100,
      },
    ]),

    // ── Core Infrastructure
    PrismaModule,
    RedisModule,

    // ── Feature Modules
    AuthModule,
    ProfileModule,
    LinksModule,
    IntegrationsModule,
    AnalyticsModule,
    ResumeModule,
    CoverletterModule,
    PortfoliodocModule,
    PaymentsModule,
    TeamsModule,
    EmaillistModule,
    AiModule,
    AdminModule,
    SettingsModule,
    AwsModule,
  ],
})
export class AppModule {}
