"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockDataService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const dashboard_overview_dto_1 = require("../dashboard/dto/dashboard-overview.dto");
function stableUuidFromString(input) {
    const bytes = (0, crypto_1.createHash)('sha256').update(input).digest();
    const uuidBytes = bytes.subarray(0, 16);
    uuidBytes[6] = (uuidBytes[6] & 0x0f) | 0x40;
    uuidBytes[8] = (uuidBytes[8] & 0x3f) | 0x80;
    const hex = Buffer.from(uuidBytes).toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
let MockDataService = class MockDataService {
    getMockOverview(period) {
        const days = this.getDaysFromPeriod(period);
        const summary = this.generateSummary(days);
        const growth = this.generateGrowth();
        const trends = this.generateTrends(days);
        const recentCampaigns = this.generateRecentCampaigns();
        return {
            summary,
            growth,
            trends,
            recentCampaigns
        };
    }
    getMockCampaigns() {
        return this.generateRecentCampaigns(10);
    }
    getDaysFromPeriod(period) {
        switch (period) {
            case dashboard_overview_dto_1.PeriodEnum.SEVEN_DAYS: return 7;
            case dashboard_overview_dto_1.PeriodEnum.THIRTY_DAYS: return 30;
            case dashboard_overview_dto_1.PeriodEnum.THIS_MONTH: return new Date().getDate();
            case dashboard_overview_dto_1.PeriodEnum.LAST_MONTH: return 30;
            default: return 7;
        }
    }
    generateSummary(days) {
        const baseImpressions = 500000;
        const multiplier = days / 30;
        const impressions = Math.floor(baseImpressions * multiplier * (0.8 + Math.random() * 0.4));
        const clicks = Math.floor(impressions * 0.02 * (0.8 + Math.random() * 0.4));
        const cost = clicks * 15 * (0.8 + Math.random() * 0.4);
        const conversions = Math.floor(clicks * 0.05 * (0.8 + Math.random() * 0.4));
        const revenue = cost * 2.5 * (0.8 + Math.random() * 0.4);
        const safeImpressions = impressions > 0 ? impressions : 1;
        const safeCost = cost > 0 ? cost : 1;
        const ctr = (clicks / safeImpressions) * 100;
        const roas = revenue / safeCost;
        const cpm = (cost / safeImpressions) * 1000;
        const roi = ((revenue - cost) / safeCost) * 100;
        return {
            totalImpressions: impressions,
            totalClicks: clicks,
            totalCost: Number(cost.toFixed(2)),
            totalConversions: conversions,
            averageCtr: Number(ctr.toFixed(2)),
            averageRoas: Number(roas.toFixed(2)),
            averageCpm: Number(cpm.toFixed(2)),
            averageRoi: Number(roi.toFixed(2)),
        };
    }
    generateGrowth() {
        const randomGrowth = () => Number((Math.random() * 40 - 10).toFixed(1));
        return {
            impressionsGrowth: randomGrowth(),
            clicksGrowth: randomGrowth(),
            costGrowth: randomGrowth(),
            conversionsGrowth: randomGrowth(),
            ctrGrowth: randomGrowth(),
            cpmGrowth: randomGrowth(),
            roasGrowth: randomGrowth(),
            roiGrowth: randomGrowth(),
        };
    }
    generateTrends(days) {
        const trends = [];
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dailyFactor = 0.5 + Math.random();
            const impressions = Math.floor(20000 * dailyFactor);
            const clicks = Math.floor(impressions * 0.025);
            const cost = clicks * 12;
            const conversions = Math.floor(clicks * 0.08);
            trends.push({
                date: date.toISOString().split('T')[0],
                impressions,
                clicks,
                cost: Number(cost.toFixed(2)),
                conversions
            });
        }
        return trends;
    }
    generateRecentCampaigns(count = 5) {
        const campaigns = [
            {
                id: stableUuidFromString('mock-cmp-1'),
                name: 'Summer Sale 2026 - Phase 1',
                status: client_1.CampaignStatus.ACTIVE,
                platform: client_1.AdPlatform.FACEBOOK,
                spending: 12500,
                impressions: 150000,
                clicks: 5200,
                conversions: 310,
                budgetUtilization: 85
            },
            {
                id: stableUuidFromString('mock-cmp-2'),
                name: 'Brand Awareness Q1',
                status: client_1.CampaignStatus.ACTIVE,
                platform: client_1.AdPlatform.GOOGLE_ADS,
                spending: 45000,
                impressions: 420000,
                clicks: 16800,
                conversions: 980,
                budgetUtilization: 92
            },
            {
                id: stableUuidFromString('mock-cmp-3'),
                name: 'Retargeting - Cart Abandoners',
                status: client_1.CampaignStatus.PAUSED,
                platform: client_1.AdPlatform.TIKTOK,
                spending: 8200,
                impressions: 80000,
                clicks: 2200,
                conversions: 140,
                budgetUtilization: 45
            },
            {
                id: stableUuidFromString('mock-cmp-4'),
                name: 'New Product Launch',
                status: client_1.CampaignStatus.ACTIVE,
                platform: client_1.AdPlatform.LINE_ADS,
                spending: 15600,
                impressions: 120000,
                clicks: 3400,
                conversions: 210,
                budgetUtilization: 60
            },
            {
                id: stableUuidFromString('mock-cmp-5'),
                name: 'Competitor Conquesting',
                status: client_1.CampaignStatus.ENDED,
                platform: client_1.AdPlatform.GOOGLE_ADS,
                spending: 5400,
                impressions: 56000,
                clicks: 980,
                conversions: 55,
                budgetUtilization: 100
            }
        ];
        if (count > 5) {
            for (let i = 6; i <= count; i++) {
                const impressions = Math.floor(Math.random() * 200000) + 1000;
                const clicks = Math.floor(impressions * (0.01 + Math.random() * 0.04));
                const conversions = Math.floor(clicks * (0.01 + Math.random() * 0.12));
                campaigns.push({
                    id: stableUuidFromString(`mock-cmp-${i}`),
                    name: `Mock Campaign #${i}`,
                    status: Math.random() > 0.3 ? client_1.CampaignStatus.ACTIVE : client_1.CampaignStatus.PAUSED,
                    platform: Math.random() > 0.5 ? client_1.AdPlatform.FACEBOOK : client_1.AdPlatform.GOOGLE_ADS,
                    spending: Math.floor(Math.random() * 10000),
                    impressions,
                    clicks,
                    conversions,
                    budgetUtilization: Math.floor(Math.random() * 100)
                });
            }
        }
        return campaigns.slice(0, count);
    }
};
exports.MockDataService = MockDataService;
exports.MockDataService = MockDataService = __decorate([
    (0, common_1.Injectable)()
], MockDataService);
//# sourceMappingURL=mock-data.service.js.map