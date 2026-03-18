"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const response_transform_interceptor_1 = require("./common/interceptors/response-transform.interceptor");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const nestjs_pino_1 = require("nestjs-pino");
const cache_manager_1 = require("@nestjs/cache-manager");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const campaigns_module_1 = require("./modules/campaigns/campaigns.module");
const ad_groups_module_1 = require("./modules/ad-groups/ad-groups.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const google_ads_module_1 = require("./modules/integrations/google-ads/google-ads.module");
const audit_logs_module_1 = require("./modules/audit-logs/audit-logs.module");
const sync_module_1 = require("./modules/sync/sync.module");
const facebook_ads_module_1 = require("./modules/integrations/facebook/facebook-ads.module");
const google_analytics_module_1 = require("./modules/integrations/google-analytics/google-analytics.module");
const tiktok_ads_module_1 = require("./modules/integrations/tiktok/tiktok-ads.module");
const line_ads_module_1 = require("./modules/integrations/line-ads/line-ads.module");
const alert_module_1 = require("./modules/alerts/alert.module");
const seo_module_1 = require("./modules/seo/seo.module");
const health_module_1 = require("./modules/health/health.module");
const notification_module_1 = require("./modules/notification/notification.module");
const env_validation_1 = require("./config/env.validation");
const common_module_1 = require("./common/common.module");
const chat_module_1 = require("./modules/chat/chat.module");
const ai_module_1 = require("./modules/ai/ai.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: env_validation_1.envValidationSchema,
                validationOptions: {
                    abortEarly: true,
                },
            }),
            schedule_1.ScheduleModule.forRoot(),
            cache_manager_1.CacheModule.registerAsync({
                isGlobal: true,
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    ttl: configService.get('CACHE_TTL', 600000),
                    max: configService.get('CACHE_MAX', 100),
                }),
                inject: [config_1.ConfigService],
            }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    transport: process.env.NODE_ENV !== 'production' ? {
                        target: 'pino-pretty',
                        options: {
                            singleLine: true,
                        },
                    } : undefined,
                    autoLogging: true,
                    redact: ['req.headers.authorization', 'req.headers.cookie'],
                },
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ([{
                        ttl: config.get('THROTTLE_TTL', 60000),
                        limit: config.get('THROTTLE_LIMIT', 100),
                    }]),
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            campaigns_module_1.CampaignsModule,
            ad_groups_module_1.AdGroupsModule,
            dashboard_module_1.DashboardModule,
            google_ads_module_1.GoogleAdsModule,
            audit_logs_module_1.AuditLogsModule,
            google_analytics_module_1.GoogleAnalyticsModule,
            sync_module_1.SyncModule,
            facebook_ads_module_1.FacebookAdsModule,
            tiktok_ads_module_1.TikTokAdsModule,
            line_ads_module_1.LineAdsModule,
            alert_module_1.AlertModule,
            seo_module_1.SeoModule,
            health_module_1.HealthModule,
            notification_module_1.NotificationModule,
            chat_module_1.ChatModule,
            ai_module_1.AiModule,
            common_module_1.CommonModule,
            ...(process.env.NODE_ENV !== 'production' ? [require('./modules/debug/debug.module').DebugModule] : []),
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: response_transform_interceptor_1.ResponseTransformInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map