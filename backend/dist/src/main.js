"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const nestjs_pino_1 = require("nestjs-pino");
const Sentry = require("@sentry/node");
const dotenv = require("dotenv");
const app_module_1 = require("./app.module");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
dotenv.config();
async function bootstrap() {
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            debug: process.env.NODE_ENV !== 'production',
        });
        console.log('🔴 Sentry initialized');
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    const httpAdapter = app.getHttpAdapter();
    const instance = httpAdapter.getInstance();
    if (instance?.set) {
        instance.set('etag', false);
    }
    app.use((req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        next();
    });
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'https://accounts.google.com'],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
    const corsOrigins = process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://localhost:3001';
    const originList = corsOrigins.split(',').map(o => o.trim());
    app.enableCors({
        origin: [
            "https://saddlebrown-eagle-972006.hostingersite.com",
            "https://wheat-cassowary-760257.hostingersite.com",
            ...originList,
            /^https:\/\/.*\.manus-asia\.computer$/,
            /^https:\/\/.*\.manus\.space$/,
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Cache-Control',
            'Pragma',
            'Expires',
            'If-None-Match',
            'If-Modified-Since',
        ],
    });
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
        ],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
    const config = new swagger_1.DocumentBuilder()
        .setTitle(process.env.SWAGGER_TITLE || 'RGA Dashboard API')
        .setDescription(process.env.SWAGGER_DESCRIPTION || 'RGA Marketing Dashboard Backend API')
        .setVersion(process.env.SWAGGER_VERSION || '1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map