"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../../prisma/prisma.service");
const google_ads_api_service_1 = require("./google-ads-api.service");
const google_ads_client_service_1 = require("./google-ads-client.service");
const common_1 = require("@nestjs/common");
describe('GoogleAdsApiService', () => {
    let service;
    let prismaService;
    let googleAdsClientService;
    const mockConfigService = {
        get: jest.fn((key) => {
            if (key === 'GOOGLE_CLIENT_ID')
                return 'mock-client-id';
            if (key === 'GOOGLE_CLIENT_SECRET')
                return 'mock-client-secret';
            return null;
        }),
    };
    const mockPrismaService = {
        googleAdsAccount: {
            update: jest.fn(),
        },
    };
    const mockGoogleAdsClientService = {
        getCustomer: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                google_ads_api_service_1.GoogleAdsApiService,
                { provide: config_1.ConfigService, useValue: mockConfigService },
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: google_ads_client_service_1.GoogleAdsClientService, useValue: mockGoogleAdsClientService },
            ],
        }).compile();
        service = module.get(google_ads_api_service_1.GoogleAdsApiService);
        prismaService = module.get(prisma_service_1.PrismaService);
        googleAdsClientService = module.get(google_ads_client_service_1.GoogleAdsClientService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('fetchCampaigns', () => {
        it('should fetch campaigns successfully', async () => {
            const mockAccount = {
                id: 'account-1',
                customerId: '1234567890',
                refreshToken: 'mock-refresh-token',
            };
            const mockCustomer = {
                query: jest.fn().mockResolvedValue([{ campaign: { id: 1, name: 'Test' } }]),
            };
            mockGoogleAdsClientService.getCustomer.mockReturnValue(mockCustomer);
            const result = await service.fetchCampaigns(mockAccount);
            expect(mockGoogleAdsClientService.getCustomer).toHaveBeenCalledWith(mockAccount.customerId, mockAccount.refreshToken);
            expect(mockCustomer.query).toHaveBeenCalled();
            expect(result).toHaveLength(1);
        });
        it('should throw error if account has no refresh token', async () => {
            const mockAccount = { id: 'account-1' };
            await expect(service.fetchCampaigns(mockAccount)).rejects.toThrow('Google Ads account not found or not connected');
        });
    });
    describe('fetchCampaignMetrics', () => {
        it('should fetch metrics successfully', async () => {
            const mockAccount = {
                id: 'account-1',
                customerId: '1234567890',
                refreshToken: 'mock-refresh-token',
                tokenExpiresAt: new Date(Date.now() + 3600000),
            };
            const mockCustomer = {
                query: jest.fn().mockResolvedValue([{ metrics: { clicks: 10 } }]),
            };
            mockGoogleAdsClientService.getCustomer.mockReturnValue(mockCustomer);
            const result = await service.fetchCampaignMetrics(mockAccount, 'campaign-1', new Date(), new Date());
            expect(result).toHaveLength(1);
        });
        it('should throw BadRequestException if no refresh token', async () => {
            const mockAccount = { id: 'account-1' };
            await expect(service.fetchCampaignMetrics(mockAccount, 'c-1', new Date(), new Date())).rejects.toThrow(common_1.BadRequestException);
        });
    });
});
//# sourceMappingURL=google-ads-api.service.spec.js.map