"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const google_ads_sync_service_1 = require("./google-ads-sync.service");
const prisma_service_1 = require("../../../prisma/prisma.service");
const google_ads_api_service_1 = require("./google-ads-api.service");
const google_ads_mapper_service_1 = require("./google-ads-mapper.service");
const mock_data_seeder_service_1 = require("../../../dashboard/mock-data-seeder.service");
describe('GoogleAdsSyncService', () => {
    let service;
    let prismaService;
    let apiService;
    let mapperService;
    const mockPrismaService = {
        googleAdsAccount: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        campaign: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        metric: {
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };
    const mockApiService = {
        fetchCampaigns: jest.fn(),
        fetchCampaignMetrics: jest.fn(),
    };
    const mockMapperService = {
        transformCampaigns: jest.fn(),
        transformMetrics: jest.fn(),
    };
    const mockSeederService = {
        seedCampaignMetrics: jest.fn().mockResolvedValue({ createdCount: 5 }),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                google_ads_sync_service_1.GoogleAdsSyncService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: google_ads_api_service_1.GoogleAdsApiService, useValue: mockApiService },
                { provide: google_ads_mapper_service_1.GoogleAdsMapperService, useValue: mockMapperService },
                { provide: mock_data_seeder_service_1.MockDataSeederService, useValue: mockSeederService },
            ],
        }).compile();
        service = module.get(google_ads_sync_service_1.GoogleAdsSyncService);
        prismaService = module.get(prisma_service_1.PrismaService);
        apiService = module.get(google_ads_api_service_1.GoogleAdsApiService);
        mapperService = module.get(google_ads_mapper_service_1.GoogleAdsMapperService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('syncCampaigns', () => {
        it('should sync campaigns successfully', async () => {
            const mockAccount = { id: 'acc-1', tenantId: 'tenant-1' };
            mockPrismaService.googleAdsAccount.findUnique.mockResolvedValue(mockAccount);
            mockApiService.fetchCampaigns.mockResolvedValue([]);
            mockMapperService.transformCampaigns.mockReturnValue([
                { externalId: '1', name: 'Camp 1', status: 'ACTIVE' },
            ]);
            mockPrismaService.campaign.findFirst.mockResolvedValue(null);
            mockPrismaService.campaign.create.mockResolvedValue({ id: 'c-1' });
            jest.spyOn(service, 'syncAllCampaignMetrics').mockResolvedValue({});
            const result = await service.syncCampaigns('acc-1');
            expect(result.createdCount).toBe(1);
            expect(mockPrismaService.campaign.create).toHaveBeenCalled();
        });
        it('should throw error if account not found', async () => {
            mockPrismaService.googleAdsAccount.findUnique.mockResolvedValue(null);
            await expect(service.syncCampaigns('acc-1')).rejects.toThrow('Google Ads account not found');
        });
    });
    describe('syncCampaignMetrics', () => {
        it('should sync metrics successfully', async () => {
            const mockCampaign = { id: 'c-1', externalId: 'ext-1' };
            const mockAccount = { id: 'acc-1' };
            mockPrismaService.campaign.findFirst.mockResolvedValue(mockCampaign);
            mockPrismaService.googleAdsAccount.findUnique.mockResolvedValue(mockAccount);
            mockApiService.fetchCampaignMetrics.mockResolvedValue([]);
            mockMapperService.transformMetrics.mockReturnValue([
                { date: new Date(), impressions: 100, clicks: 10 },
            ]);
            mockPrismaService.metric.findFirst.mockResolvedValue(null);
            const result = await service.syncCampaignMetrics('acc-1', 'c-1');
            expect(result.success).toBe(true);
            expect(result.syncedCount).toBe(1);
            expect(mockPrismaService.metric.create).toHaveBeenCalled();
        });
        it('should seed mock data if no real metrics found', async () => {
            const mockCampaign = { id: 'c-1', externalId: 'ext-1' };
            const mockAccount = { id: 'acc-1' };
            mockPrismaService.campaign.findFirst.mockResolvedValue(mockCampaign);
            mockPrismaService.googleAdsAccount.findUnique.mockResolvedValue(mockAccount);
            mockApiService.fetchCampaignMetrics.mockResolvedValue([]);
            mockMapperService.transformMetrics.mockReturnValue([]);
            const result = await service.syncCampaignMetrics('acc-1', 'c-1');
            expect(mockSeederService.seedCampaignMetrics).toHaveBeenCalled();
            expect(result.createdCount).toBe(5);
        });
    });
});
//# sourceMappingURL=google-ads-sync.service.spec.js.map