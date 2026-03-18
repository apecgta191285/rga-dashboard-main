"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VerificationSeeder_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationSeeder = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const uuid_1 = require("uuid");
let VerificationSeeder = VerificationSeeder_1 = class VerificationSeeder {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(VerificationSeeder_1.name);
    }
    async seedHeavyCampaigns(tenantId, count = 10000) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true },
        });
        if (!tenant) {
            throw new Error(`Tenant ${tenantId} not found`);
        }
        const BATCH_SIZE = 1000;
        const METRICS_DAYS = 90;
        const platforms = [
            client_1.AdPlatform.GOOGLE_ADS,
            client_1.AdPlatform.FACEBOOK,
            client_1.AdPlatform.TIKTOK,
        ];
        const thaiPrefixes = [
            'โปรโมชั่น',
            'แคมเปญ',
            'เปิดตัว',
            'ลดราคา',
            'เทศกาล',
            'แบรนด์',
            'รีมาร์เก็ตติ้ง',
            'ยิงแอด',
            'ปิดการขาย',
        ];
        const englishPrefixes = [
            'Brand',
            'Performance',
            'Always On',
            'Remarketing',
            'Prospecting',
            'Acquisition',
            'Retention',
            'Awareness',
        ];
        const products = [
            'Sneakers',
            'Skincare',
            'Electronics',
            'Fashion',
            'Coffee',
            'Supplements',
            'Home & Living',
            'Travel',
            'Insurance',
            'อาหารเสริม',
            'เสื้อผ้า',
            'เครื่องสำอาง',
            'มือถือ',
            'ของแต่งบ้าน',
        ];
        const objectives = ['SALES', 'LEADS', 'TRAFFIC', 'AWARENESS', 'APP_INSTALL'];
        const campaignTypes = ['SEARCH', 'DISPLAY', 'VIDEO', 'SHOPPING', 'SOCIAL', 'APP'];
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const randomInt = (min, max) => {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };
        const randomChoice = (arr) => {
            return arr[Math.floor(Math.random() * arr.length)];
        };
        const pickStatus = () => {
            const r = Math.random();
            if (r < 0.65)
                return client_1.CampaignStatus.ACTIVE;
            if (r < 0.80)
                return client_1.CampaignStatus.PAUSED;
            if (r < 0.88)
                return client_1.CampaignStatus.COMPLETED;
            if (r < 0.94)
                return client_1.CampaignStatus.PENDING;
            if (r < 0.98)
                return client_1.CampaignStatus.DRAFT;
            return client_1.CampaignStatus.ENDED;
        };
        const buildName = (platform, index) => {
            const isThai = Math.random() < 0.5;
            const prefix = isThai ? randomChoice(thaiPrefixes) : randomChoice(englishPrefixes);
            const product = randomChoice(products);
            const month = todayUTC.toISOString().slice(0, 7);
            const platformLabel = platform === client_1.AdPlatform.GOOGLE_ADS
                ? 'Google'
                : platform === client_1.AdPlatform.FACEBOOK
                    ? 'Facebook'
                    : 'TikTok';
            return `${platformLabel} - ${prefix} ${product} - ${month} #${index}`;
        };
        const buildSchedule = () => {
            const startOffsetDays = randomInt(0, 90);
            const startDate = new Date(todayUTC);
            startDate.setUTCDate(startDate.getUTCDate() - startOffsetDays);
            const durationDays = randomInt(7, 60);
            const endDate = new Date(startDate);
            endDate.setUTCDate(endDate.getUTCDate() + durationDays);
            return { startDate, endDate };
        };
        const buildBudget = () => {
            const base = randomInt(5000, 250000);
            const rounded = Math.round(base / 100) * 100;
            return rounded;
        };
        const buildExternalId = (platform, id) => {
            const p = platform === client_1.AdPlatform.GOOGLE_ADS
                ? 'gads'
                : platform === client_1.AdPlatform.FACEBOOK
                    ? 'fb'
                    : 'tiktok';
            return `heavy-${p}-${id}`;
        };
        const buildDailyMetric = (platform) => {
            const impressions = randomInt(500, 25000);
            const ctr = 0.012 + Math.random() * 0.035;
            const clicks = Math.max(0, Math.floor(impressions * ctr));
            const cpc = 2 + Math.random() * 25;
            const spend = Math.max(0, Number((clicks * cpc).toFixed(2)));
            const convRate = 0.005 + Math.random() * 0.04;
            const conversions = Math.max(0, Math.floor(clicks * convRate));
            const aov = 300 + Math.random() * 2500;
            const revenue = Math.max(0, Number((conversions * aov).toFixed(2)));
            const roas = spend > 0 ? Number((revenue / spend).toFixed(4)) : 0;
            return {
                platform,
                impressions,
                clicks,
                conversions,
                spend,
                revenue,
                roas,
                isMockData: true,
            };
        };
        let totalCampaignsInserted = 0;
        let totalMetricsInserted = 0;
        const startedAt = Date.now();
        this.logger.log(`Starting Heavy Seed: ${count} campaigns for Tenant ${tenantId}`);
        for (let offset = 0; offset < count; offset += BATCH_SIZE) {
            const batchCount = Math.min(BATCH_SIZE, count - offset);
            const campaignData = [];
            const metricRows = [];
            for (let i = 0; i < batchCount; i++) {
                const seq = offset + i + 1;
                const platform = platforms[(offset + i) % platforms.length];
                const id = (0, uuid_1.v4)();
                const { startDate, endDate } = buildSchedule();
                const budget = buildBudget();
                const status = pickStatus();
                campaignData.push({
                    id,
                    tenantId,
                    integrationId: null,
                    externalId: buildExternalId(platform, id),
                    name: buildName(platform, seq),
                    platform,
                    campaignType: randomChoice(campaignTypes),
                    objective: randomChoice(objectives),
                    status,
                    budget,
                    budgetType: Math.random() < 0.5 ? 'DAILY' : 'LIFETIME',
                    currency: 'THB',
                    startDate,
                    endDate,
                    lastSyncedAt: null,
                    syncStatus: client_1.SyncStatus.PENDING,
                    googleAdsAccountId: null,
                    facebookAdsAccountId: null,
                    tiktokAdsAccountId: null,
                    lineAdsAccountId: null,
                });
                for (let d = 0; d < METRICS_DAYS; d++) {
                    const date = new Date(todayUTC);
                    date.setUTCDate(date.getUTCDate() - d);
                    const daily = buildDailyMetric(platform);
                    metricRows.push({
                        tenantId,
                        campaignId: id,
                        date,
                        platform: daily.platform,
                        impressions: daily.impressions,
                        clicks: daily.clicks,
                        conversions: daily.conversions,
                        spend: daily.spend,
                        revenue: daily.revenue,
                        roas: daily.roas,
                        isMockData: true,
                    });
                }
            }
            const created = await this.prisma.campaign.createMany({
                data: campaignData,
                skipDuplicates: true,
            });
            totalCampaignsInserted += created.count;
            const METRICS_BATCH_SIZE = 2000;
            for (let m = 0; m < metricRows.length; m += METRICS_BATCH_SIZE) {
                const chunk = metricRows.slice(m, m + METRICS_BATCH_SIZE);
                const metricCreated = await this.prisma.metric.createMany({
                    data: chunk,
                    skipDuplicates: true,
                });
                totalMetricsInserted += metricCreated.count;
            }
            this.logger.log(`Seeded batch ${Math.floor(offset / BATCH_SIZE) + 1} / ${Math.ceil(count / BATCH_SIZE)} ` +
                `(${batchCount} campaigns) → inserted: ${created.count} campaigns, metrics: ${metricRows.length}`);
        }
        const durationMs = Date.now() - startedAt;
        this.logger.log(`Heavy Seed Completed: ${totalCampaignsInserted} campaigns, ${totalMetricsInserted} metrics in ${durationMs}ms`);
        return {
            success: true,
            tenantId,
            requested: count,
            insertedCampaigns: totalCampaignsInserted,
            insertedMetrics: totalMetricsInserted,
            batchSize: BATCH_SIZE,
            metricsDaysPerCampaign: METRICS_DAYS,
            durationMs,
        };
    }
};
exports.VerificationSeeder = VerificationSeeder;
exports.VerificationSeeder = VerificationSeeder = VerificationSeeder_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VerificationSeeder);
//# sourceMappingURL=verification-seeder.js.map