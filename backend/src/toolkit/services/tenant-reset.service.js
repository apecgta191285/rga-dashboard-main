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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantResetService = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const container_1 = require("../core/container");
const crypto_1 = require("crypto");
const HARD_RESET_TOKEN_TTL_MS = 5 * 60 * 1000;
const HARD_RESET_TOKEN_PREFIX = 'RTH';
const MAX_ACTIVE_HARD_RESET_TOKENS = 2048;
const PRESERVED_TABLES = [
    'Tenant',
    'User',
    'UserSession',
    'Integration',
    'AlertRule',
    'Campaign',
];
const PARTIAL_RESET_TABLES = [
    'Metric',
    'Alert',
    'AlertHistory',
    'AnomalyDetection',
];
const HARD_RESET_ADDITIONAL_TABLES = [
    'Campaign',
    'AlertRule',
    'AlertRuleCondition',
];
let TenantResetService = class TenantResetService {
    constructor(prisma) {
        this.prisma = prisma;
        this.hardResetTokens = new Map();
    }
    async partialReset(tenantId) {
        const startTime = Date.now();
        try {
            const tenant = await this.validateTenant(tenantId);
            if (!tenant) {
                return {
                    success: false,
                    mode: 'PARTIAL',
                    message: `Tenant "${tenantId}" not found.`,
                    error: 'Tenant not found',
                };
            }
            const result = await this.prisma.$transaction(async (tx) => {
                const metricsResult = await tx.metric.deleteMany({
                    where: { tenantId },
                });
                const alertsResult = await tx.alert.deleteMany({
                    where: { tenantId },
                });
                const alertHistoryResult = await tx.alertHistory?.deleteMany({
                    where: { tenantId },
                }) || { count: 0 };
                return {
                    metrics: metricsResult.count,
                    alerts: alertsResult.count,
                    alertHistory: alertHistoryResult.count,
                };
            });
            const duration = Date.now() - startTime;
            return {
                success: true,
                mode: 'PARTIAL',
                message: `Partial reset completed for tenant "${tenant.name}"`,
                data: {
                    tenantId,
                    deletedMetrics: result.metrics,
                    deletedAlerts: result.alerts + result.alertHistory,
                    durationMs: duration,
                },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                mode: 'PARTIAL',
                message: 'Partial reset failed',
                error: errorMessage,
            };
        }
    }
    async hardReset(tenantId, confirmation) {
        const startTime = Date.now();
        try {
            const tenant = await this.validateTenant(tenantId);
            if (!tenant) {
                return {
                    success: false,
                    mode: 'HARD',
                    message: `Tenant "${tenantId}" not found.`,
                    error: 'Tenant not found',
                };
            }
            const validationError = this.validateConfirmation(tenantId, confirmation, 'HARD');
            if (validationError) {
                return {
                    success: false,
                    mode: 'HARD',
                    message: 'Hard reset failed: Invalid confirmation',
                    error: validationError,
                };
            }
            const result = await this.prisma.$transaction(async (tx) => {
                const metricsResult = await tx.metric.deleteMany({
                    where: { tenantId },
                });
                const alertsResult = await tx.alert.deleteMany({
                    where: { tenantId },
                });
                const alertHistoryResult = await tx.alertHistory?.deleteMany({
                    where: { tenantId },
                }) || { count: 0 };
                const alertRulesResult = await tx.alertRule.deleteMany({
                    where: { tenantId },
                });
                const campaignsResult = await tx.campaign.deleteMany({
                    where: { tenantId },
                });
                return {
                    metrics: metricsResult.count,
                    alerts: alertsResult.count,
                    alertHistory: alertHistoryResult.count,
                    alertRules: alertRulesResult.count,
                    campaigns: campaignsResult.count,
                };
            });
            const duration = Date.now() - startTime;
            return {
                success: true,
                mode: 'HARD',
                message: `Hard reset completed for tenant "${tenant.name}"`,
                data: {
                    tenantId,
                    deletedMetrics: result.metrics,
                    deletedAlerts: result.alerts + result.alertHistory,
                    deletedCampaigns: result.campaigns,
                    deletedAlertDefinitions: result.alertRules,
                    durationMs: duration,
                },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                mode: 'HARD',
                message: 'Hard reset failed',
                error: errorMessage,
            };
        }
    }
    generateConfirmationToken(tenantId) {
        this.cleanupExpiredTokens();
        if (this.hardResetTokens.size >= MAX_ACTIVE_HARD_RESET_TOKENS) {
            throw new Error(`Too many active hard reset confirmations (${MAX_ACTIVE_HARD_RESET_TOKENS}). ` +
                'Wait for expiry or restart service.');
        }
        const tokenId = (0, crypto_1.randomUUID)();
        const tokenSecret = (0, crypto_1.randomBytes)(24).toString('base64url');
        const issuedAt = new Date();
        const expiresAt = new Date(issuedAt.getTime() + HARD_RESET_TOKEN_TTL_MS);
        const token = `${HARD_RESET_TOKEN_PREFIX}.${tokenId}.${tokenSecret}`;
        const record = {
            tokenId,
            tenantId,
            mode: 'HARD',
            issuedAt,
            expiresAt,
            tokenHashHex: this.hashTokenSecret(tokenSecret),
            consumedAt: null,
        };
        this.hardResetTokens.set(tokenId, record);
        return { token, expiresAt };
    }
    async validateTenant(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true },
        });
        return tenant;
    }
    validateConfirmation(tenantId, confirmation, expectedMode) {
        this.cleanupExpiredTokens();
        if (confirmation.mode !== expectedMode) {
            return `Confirmation mode mismatch: expected ${expectedMode}, got ${confirmation.mode}`;
        }
        const parsed = this.parseConfirmationToken(confirmation.confirmationToken);
        if (!parsed) {
            return 'Invalid confirmation token format';
        }
        const tokenRecord = this.hardResetTokens.get(parsed.tokenId);
        if (!tokenRecord) {
            return 'Confirmation token is unknown or expired';
        }
        if (tokenRecord.mode !== expectedMode) {
            return `Confirmation token mode mismatch: expected ${expectedMode}, got ${tokenRecord.mode}`;
        }
        if (tokenRecord.tenantId !== tenantId) {
            return 'Confirmation token tenant mismatch';
        }
        if (tokenRecord.consumedAt) {
            return 'Confirmation token already used';
        }
        const now = new Date();
        if (tokenRecord.expiresAt.getTime() < now.getTime()) {
            this.hardResetTokens.delete(tokenRecord.tokenId);
            return 'Confirmation token expired (valid for 5 minutes)';
        }
        if (confirmation.confirmedAt.getTime() < tokenRecord.issuedAt.getTime()) {
            return 'confirmedAt cannot be before token issuance';
        }
        if (confirmation.confirmedAt.getTime() > tokenRecord.expiresAt.getTime()) {
            return 'confirmedAt is outside token validity window';
        }
        if (confirmation.confirmedAt.getTime() > now.getTime() + 30_000) {
            return 'confirmedAt cannot be in the future';
        }
        if (!this.verifyTokenSecret(parsed.tokenSecret, tokenRecord.tokenHashHex)) {
            return 'Invalid confirmation token';
        }
        tokenRecord.consumedAt = now;
        return null;
    }
    cleanupExpiredTokens(referenceTime = new Date()) {
        for (const [tokenId, record] of this.hardResetTokens.entries()) {
            const isExpired = record.expiresAt.getTime() < referenceTime.getTime();
            const isConsumedAndOld = record.consumedAt !== null &&
                record.consumedAt.getTime() < referenceTime.getTime() - HARD_RESET_TOKEN_TTL_MS;
            if (isExpired || isConsumedAndOld) {
                this.hardResetTokens.delete(tokenId);
            }
        }
    }
    parseConfirmationToken(token) {
        if (!token || typeof token !== 'string') {
            return null;
        }
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        const [prefix, tokenId, tokenSecret] = parts;
        if (prefix !== HARD_RESET_TOKEN_PREFIX || !tokenId || !tokenSecret) {
            return null;
        }
        return { tokenId, tokenSecret };
    }
    hashTokenSecret(secret) {
        return (0, crypto_1.createHash)('sha256').update(secret, 'utf8').digest('hex');
    }
    verifyTokenSecret(secret, expectedHashHex) {
        const actualHash = Buffer.from(this.hashTokenSecret(secret), 'hex');
        const expectedHash = Buffer.from(expectedHashHex, 'hex');
        if (actualHash.length !== expectedHash.length) {
            return false;
        }
        return (0, crypto_1.timingSafeEqual)(actualHash, expectedHash);
    }
};
exports.TenantResetService = TenantResetService;
exports.TenantResetService = TenantResetService = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(container_1.TOKENS.PrismaClient)),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], TenantResetService);
//# sourceMappingURL=tenant-reset.service.js.map