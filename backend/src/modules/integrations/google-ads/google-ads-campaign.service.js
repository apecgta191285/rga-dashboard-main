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
var GoogleAdsCampaignService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdsCampaignService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const google_ads_api_service_1 = require("./services/google-ads-api.service");
const google_ads_mapper_service_1 = require("./services/google-ads-mapper.service");
let GoogleAdsCampaignService = GoogleAdsCampaignService_1 = class GoogleAdsCampaignService {
    constructor(prisma, googleAdsApiService, googleAdsMapperService) {
        this.prisma = prisma;
        this.googleAdsApiService = googleAdsApiService;
        this.googleAdsMapperService = googleAdsMapperService;
        this.logger = new common_1.Logger(GoogleAdsCampaignService_1.name);
    }
    async findAccount(idOrCustomerId) {
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(idOrCustomerId);
        let account;
        if (isUuid) {
            account = await this.prisma.googleAdsAccount.findUnique({
                where: { id: idOrCustomerId },
            });
        }
        else {
            const cleanId = idOrCustomerId.replace(/-/g, '');
            account = await this.prisma.googleAdsAccount.findFirst({
                where: { customerId: cleanId },
            });
        }
        if (!account) {
            this.logger.error(`Google Ads account not found for identifier: ${idOrCustomerId}`);
            throw new common_1.NotFoundException(`Google Ads account not found for identifier: ${idOrCustomerId}`);
        }
        return account;
    }
    async fetchCampaigns(accountId) {
        const account = await this.findAccount(accountId);
        const results = await this.googleAdsApiService.fetchCampaigns(account);
        const campaigns = this.googleAdsMapperService.transformCampaigns(results);
        return {
            accountId: account.id,
            accountName: account.accountName || account.customerId,
            customerId: account.customerId,
            campaigns,
            totalCampaigns: results.length,
        };
    }
    async getAccounts(tenantId) {
        const accounts = await this.prisma.googleAdsAccount.findMany({
            where: { tenantId },
            select: {
                id: true,
                accountName: true,
                customerId: true,
                lastSyncAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return accounts;
    }
    async fetchCampaignMetrics(accountId, campaignId, startDate, endDate) {
        const account = await this.findAccount(accountId);
        const rawMetrics = await this.googleAdsApiService.fetchCampaignMetrics(account, campaignId, startDate, endDate);
        return this.googleAdsMapperService.transformMetrics(rawMetrics);
    }
};
exports.GoogleAdsCampaignService = GoogleAdsCampaignService;
exports.GoogleAdsCampaignService = GoogleAdsCampaignService = GoogleAdsCampaignService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        google_ads_api_service_1.GoogleAdsApiService,
        google_ads_mapper_service_1.GoogleAdsMapperService])
], GoogleAdsCampaignService);
//# sourceMappingURL=google-ads-campaign.service.js.map