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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AlertService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
const client_1 = require("@prisma/client");
const PRESET_RULES = [
    {
        name: 'Low ROAS',
        type: client_1.AlertRuleType.PRESET,
        metric: 'roas',
        operator: 'lt',
        threshold: 1.0,
        severity: client_1.AlertSeverity.WARNING,
        description: 'ROAS ต่ำกว่า 1.0 - กำลังขาดทุน',
    },
    {
        name: 'Critical ROAS',
        type: client_1.AlertRuleType.PRESET,
        metric: 'roas',
        operator: 'lt',
        threshold: 0.5,
        severity: client_1.AlertSeverity.CRITICAL,
        description: 'ROAS ต่ำกว่า 0.5 - ขาดทุนหนัก',
    },
    {
        name: 'Overspend',
        type: client_1.AlertRuleType.PRESET,
        metric: 'spend',
        operator: 'gt',
        threshold: 1.1,
        severity: client_1.AlertSeverity.WARNING,
        description: 'ใช้งบเกิน 110% ของ budget',
    },
    {
        name: 'No Conversions',
        type: client_1.AlertRuleType.PRESET,
        metric: 'conversions',
        operator: 'eq',
        threshold: 0,
        severity: client_1.AlertSeverity.CRITICAL,
        description: 'ไม่มี Conversion ใน 7 วัน',
    },
    {
        name: 'CTR Drop',
        type: client_1.AlertRuleType.PRESET,
        metric: 'ctr',
        operator: 'lt',
        threshold: 0.7,
        severity: client_1.AlertSeverity.WARNING,
        description: 'CTR ลดลง 30% จากสัปดาห์ก่อน',
    },
    {
        name: 'Inactive Campaign',
        type: client_1.AlertRuleType.PRESET,
        metric: 'impressions',
        operator: 'eq',
        threshold: 0,
        severity: client_1.AlertSeverity.INFO,
        description: 'ไม่มี Impressions ใน 3 วัน',
    },
];
let AlertService = AlertService_1 = class AlertService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.logger = new common_1.Logger(AlertService_1.name);
    }
    async getRules(tenantId) {
        return this.prisma.alertRule.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async initializePresetRules(tenantId) {
        const existingRules = await this.prisma.alertRule.findMany({
            where: { tenantId, alertType: client_1.AlertRuleType.PRESET },
        });
        if (existingRules.length > 0) {
            this.logger.log(`Preset rules already exist for tenant ${tenantId}`);
            return existingRules;
        }
        const createdRules = await Promise.all(PRESET_RULES.map((rule) => this.prisma.alertRule.create({
            data: {
                tenant: { connect: { id: tenantId } },
                name: rule.name,
                alertType: rule.type,
                metric: rule.metric,
                operator: rule.operator,
                threshold: rule.threshold,
                severity: rule.severity,
                description: rule.description,
            },
        })));
        this.logger.log(`Created ${createdRules.length} preset rules for tenant ${tenantId}`);
        return createdRules;
    }
    async createRule(tenantId, data) {
        return this.prisma.alertRule.create({
            data: {
                tenant: { connect: { id: tenantId } },
                name: data.name,
                metric: data.metric,
                operator: data.operator,
                threshold: data.threshold,
                alertType: client_1.AlertRuleType.CUSTOM,
                severity: data.severity || client_1.AlertSeverity.WARNING,
                description: data.description,
            },
        });
    }
    async updateRule(ruleId, tenantId, data) {
        return this.prisma.alertRule.update({
            where: { id: ruleId },
            data,
        });
    }
    async toggleRule(ruleId, tenantId) {
        const rule = await this.prisma.alertRule.findFirst({
            where: { id: ruleId, tenantId },
        });
        if (!rule) {
            throw new Error('Rule not found');
        }
        return this.prisma.alertRule.update({
            where: { id: ruleId },
            data: { isActive: !rule.isActive },
        });
    }
    async deleteRule(ruleId, tenantId) {
        const rule = await this.prisma.alertRule.findFirst({
            where: { id: ruleId, tenantId },
        });
        if (!rule) {
            throw new Error('Rule not found');
        }
        if (rule.alertType === client_1.AlertRuleType.PRESET) {
            throw new Error('Cannot delete preset rules, only disable them');
        }
        return this.prisma.alertRule.delete({
            where: { id: ruleId },
        });
    }
    async getAlerts(tenantId, options) {
        const { status, severity, limit = 50 } = options || {};
        const whereClause = { tenantId };
        if (status)
            whereClause.status = status;
        if (severity)
            whereClause.severity = severity;
        return this.prisma.alert.findMany({
            where: whereClause,
            include: {
                campaign: {
                    select: { id: true, name: true, platform: true },
                },
                rule: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getOpenAlertsCount(tenantId) {
        const counts = await this.prisma.alert.groupBy({
            by: ['severity'],
            where: {
                tenantId,
                status: client_1.AlertStatus.OPEN,
            },
            _count: true,
        });
        return {
            total: counts.reduce((sum, c) => sum + c._count, 0),
            critical: counts.find((c) => c.severity === client_1.AlertSeverity.CRITICAL)?._count || 0,
            warning: counts.find((c) => c.severity === client_1.AlertSeverity.WARNING)?._count || 0,
            info: counts.find((c) => c.severity === client_1.AlertSeverity.INFO)?._count || 0,
        };
    }
    async acknowledgeAlert(alertId, tenantId) {
        return this.prisma.alert.update({
            where: { id: alertId },
            data: { status: client_1.AlertStatus.ACKNOWLEDGED },
        });
    }
    async resolveAlert(alertId, tenantId) {
        return this.prisma.alert.update({
            where: { id: alertId },
            data: {
                status: client_1.AlertStatus.RESOLVED,
                resolvedAt: new Date(),
            },
        });
    }
    async resolveAllAlerts(tenantId) {
        return this.prisma.alert.updateMany({
            where: {
                tenantId,
                status: { not: client_1.AlertStatus.RESOLVED },
            },
            data: {
                status: client_1.AlertStatus.RESOLVED,
                resolvedAt: new Date(),
            },
        });
    }
    async checkAlerts(tenantId) {
        this.logger.log(`Checking alerts for tenant ${tenantId}`);
        const rules = await this.prisma.alertRule.findMany({
            where: { tenantId, isActive: true },
        });
        if (rules.length === 0) {
            this.logger.log('No active rules found');
            return [];
        }
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const campaigns = await this.prisma.campaign.findMany({
            where: { tenantId },
            include: {
                metrics: {
                    where: { date: { gte: sevenDaysAgo } },
                },
            },
        });
        const newAlerts = [];
        for (const campaign of campaigns) {
            if (campaign.metrics.length === 0)
                continue;
            const aggregated = this.aggregateMetrics(campaign.metrics);
            for (const rule of rules) {
                const budgetNum = Number(campaign.budget ?? 0);
                const violated = this.checkRule(rule, aggregated, budgetNum);
                if (violated) {
                    const existingAlert = await this.prisma.alert.findFirst({
                        where: {
                            tenantId,
                            campaignId: campaign.id,
                            type: rule.name.toUpperCase().replace(/ /g, '_'),
                            status: { not: client_1.AlertStatus.RESOLVED },
                        },
                    });
                    if (!existingAlert) {
                        const alert = await this.prisma.alert.create({
                            data: {
                                tenant: { connect: { id: tenantId } },
                                rule: { connect: { id: rule.id } },
                                campaign: { connect: { id: campaign.id } },
                                type: rule.name.toUpperCase().replace(/ /g, '_'),
                                severity: rule.severity,
                                title: `${rule.name}: ${campaign.name}`,
                                message: this.generateAlertMessage(rule, aggregated, campaign.name),
                                metadata: {
                                    metric: rule.metric,
                                    value: aggregated[rule.metric],
                                    threshold: rule.threshold,
                                },
                            },
                        });
                        await this.notificationService.triggerFromAlert(alert);
                        newAlerts.push(alert);
                    }
                }
            }
        }
        this.logger.log(`Created ${newAlerts.length} new alerts`);
        return newAlerts;
    }
    aggregateMetrics(metrics) {
        const totals = metrics.reduce((acc, m) => ({
            impressions: acc.impressions + m.impressions,
            clicks: acc.clicks + m.clicks,
            spend: acc.spend + m.spend,
            conversions: acc.conversions + m.conversions,
            revenue: acc.revenue + m.revenue,
        }), { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 });
        return {
            ...totals,
            ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
            cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
            roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
        };
    }
    checkRule(rule, metrics, budget) {
        const value = metrics[rule.metric];
        let threshold = rule.threshold;
        if (rule.name === 'Overspend' && budget) {
            threshold = budget * rule.threshold;
        }
        switch (rule.operator) {
            case 'gt':
                return value > threshold;
            case 'lt':
                return value < threshold;
            case 'eq':
                return value === threshold;
            case 'gte':
                return value >= threshold;
            case 'lte':
                return value <= threshold;
            default:
                return false;
        }
    }
    generateAlertMessage(rule, metrics, campaignName) {
        const value = metrics[rule.metric];
        const formatted = typeof value === 'number' ? value.toFixed(2) : value;
        return `Campaign "${campaignName}" มี ${rule.metric} = ${formatted} (เกณฑ์: ${rule.operator} ${rule.threshold})`;
    }
};
exports.AlertService = AlertService;
exports.AlertService = AlertService = AlertService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => notification_service_1.NotificationService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], AlertService);
//# sourceMappingURL=alert.service.js.map