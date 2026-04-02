// Polyfill for crypto.randomUUID (required for some older Node versions or restricted environments)
import * as crypto from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = crypto;
} else if (!globalThis.crypto.randomUUID) {
  (globalThis.crypto as any).randomUUID = crypto.randomUUID.bind(crypto);
}

import { NestFactory } from '@nestjs/core';

import { ValidationPipe } from '@nestjs/common';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import helmet from 'helmet';

import { Logger } from 'nestjs-pino';

import * as Sentry from '@sentry/node';

import * as dotenv from 'dotenv';

// Load .env BEFORE any other local imports to ensure all services get correct config
dotenv.config();

import { AppModule } from './app.module';

import { GlobalExceptionFilter } from './common/filters/global-exception.filter';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // 1. CORS - MUST be first to handle Preflight (OPTIONS) requests correctly
  const corsOrigins = process.env.CORS_ORIGINS || '';
  const originList = corsOrigins.split(',').map(o => o.trim()).filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow if no origin (like mobile apps or curl) or matches our list/patterns
      if (!origin ||
        origin.includes('localhost') ||
        origin.includes('hostingersite.com') ||
        origin.includes('manus-asia.computer') ||
        origin.includes('manus.space') ||
        originList.some(allowed => origin.startsWith(allowed))) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Rejected Origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'Pragma',
      'Expires',
      'If-None-Match',
      'If-Modified-Since',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useLogger(app.get(Logger));

  // Prevent conditional GET caching
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance() as any;
  if (instance?.set) {
    instance.set('etag', false);
  }

  app.use((req: any, res: any, next: any) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://accounts.google.com', '*'], // Allow connecting to anywhere (less secure, but better for API)
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Initialize Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: false,
    });
    console.log('🔴 Sentry initialized');
  }


  // Global prefix

  app.setGlobalPrefix('api/v1', {

    exclude: [

      'health',

      'health/liveness',

      'health/readiness',

      'auth/google/ads/callback',

      'auth/google/analytics/callback',

      'auth/facebook/ads/callback',

      'auth/line/callback',

      'auth/tiktok/callback',

      'api/ai/webhook/general',

      'api/ai/webhook/ads',

      'api/ai/webhook/seo',

      'api/ai/webhook/*',

    ],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global Exception Filter (Standardized Error Responses)
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE || 'RGA Dashboard API')
    .setDescription(process.env.SWAGGER_DESCRIPTION || 'RGA Marketing Dashboard Backend API')
    .setVersion(process.env.SWAGGER_VERSION || '1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server is running on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();

