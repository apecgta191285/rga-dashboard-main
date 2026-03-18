"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = crypto;
}
else if (!globalThis.crypto.randomUUID) {
    globalThis.crypto.randomUUID = crypto.randomUUID.bind(crypto);
}
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const nestjs_pino_1 = require("nestjs-pino");
const Sentry = __importStar(require("@sentry/node"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const app_module_1 = require("./app.module");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    const corsOrigins = process.env.CORS_ORIGINS || '';
    const originList = corsOrigins.split(',').map(o => o.trim()).filter(Boolean);
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin ||
                origin.includes('localhost') ||
                origin.includes('hostingersite.com') ||
                origin.includes('manus-asia.computer') ||
                origin.includes('manus.space') ||
                originList.some(allowed => origin.startsWith(allowed))) {
                callback(null, true);
            }
            else {
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
                connectSrc: ["'self'", 'https://accounts.google.com', '*'],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            debug: false,
        });
        console.log('🔴 Sentry initialized');
    }
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