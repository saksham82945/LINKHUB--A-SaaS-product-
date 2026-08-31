import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security Headers
  app.use(helmet());

  // ── Cookie Parser (for refresh token httpOnly cookie)
  app.use(cookieParser());

  // ── Global Validation Pipe (DTOs with class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,        // Auto-transform payloads to DTO instances
    }),
  );

  // ── CORS — Only allow frontend origin
  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,        // Allow cookies (refresh token)
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // ── Global prefix for all routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`🚀 LinkPort API running on: http://localhost:${port}/api`);
}

bootstrap();
