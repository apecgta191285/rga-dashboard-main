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
var GoogleSearchConsoleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSearchConsoleService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const googleapis_1 = require("googleapis");
let GoogleSearchConsoleService = GoogleSearchConsoleService_1 = class GoogleSearchConsoleService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(GoogleSearchConsoleService_1.name);
    }
    getSiteUrl(tenantSettings) {
        const fromTenant = tenantSettings?.seo?.gscSiteUrl;
        const fromEnv = this.configService.get('GSC_SITE_URL');
        return (fromTenant || fromEnv || null);
    }
    hasCredentials() {
        const json = this.configService.get('GSC_SERVICE_ACCOUNT_JSON');
        const keyFile = this.configService.get('GSC_SERVICE_ACCOUNT_KEY_FILE');
        return !!(json || keyFile);
    }
    getAuth() {
        const json = this.configService.get('GSC_SERVICE_ACCOUNT_JSON');
        const keyFile = this.configService.get('GSC_SERVICE_ACCOUNT_KEY_FILE');
        const scopes = ['https://www.googleapis.com/auth/webmasters.readonly'];
        if (json) {
            try {
                const credentials = JSON.parse(json);
                return new googleapis_1.google.auth.GoogleAuth({ credentials, scopes });
            }
            catch (error) {
                throw new Error(`Invalid GSC_SERVICE_ACCOUNT_JSON: ${error.message}`);
            }
        }
        if (keyFile) {
            return new googleapis_1.google.auth.GoogleAuth({ keyFile, scopes });
        }
        throw new Error('GSC credentials not configured');
    }
    async querySearchAnalytics(params) {
        const auth = this.getAuth();
        const searchconsole = googleapis_1.google.searchconsole({
            version: 'v1',
            auth,
        });
        try {
            const response = await searchconsole.searchanalytics.query({
                siteUrl: params.siteUrl,
                requestBody: {
                    startDate: params.startDate,
                    endDate: params.endDate,
                    dimensions: params.dimensions ?? ['date', 'page', 'query', 'device', 'country'],
                    startRow: params.startRow ?? 0,
                    rowLimit: params.rowLimit ?? 25000,
                },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`GSC query failed: ${error.message}`);
            throw error;
        }
    }
};
exports.GoogleSearchConsoleService = GoogleSearchConsoleService;
exports.GoogleSearchConsoleService = GoogleSearchConsoleService = GoogleSearchConsoleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GoogleSearchConsoleService);
//# sourceMappingURL=google-search-console.service.js.map