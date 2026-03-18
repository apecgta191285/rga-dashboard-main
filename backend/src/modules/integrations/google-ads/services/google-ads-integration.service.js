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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdsIntegrationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const google_ads_oauth_service_1 = require("../google-ads-oauth.service");
const google_ads_client_service_1 = require("./google-ads-client.service");
let GoogleAdsIntegrationService = class GoogleAdsIntegrationService {
    constructor(prisma, oauthService, clientService) {
        this.prisma = prisma;
        this.oauthService = oauthService;
        this.clientService = clientService;
    }
    async getAuthUrl(userId, tenantId) {
        return {
            authUrl: await this.oauthService.generateAuthUrl(userId, tenantId),
        };
    }
};
exports.GoogleAdsIntegrationService = GoogleAdsIntegrationService;
exports.GoogleAdsIntegrationService = GoogleAdsIntegrationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        google_ads_oauth_service_1.GoogleAdsOAuthService,
        google_ads_client_service_1.GoogleAdsClientService])
], GoogleAdsIntegrationService);
//# sourceMappingURL=google-ads-integration.service.js.map