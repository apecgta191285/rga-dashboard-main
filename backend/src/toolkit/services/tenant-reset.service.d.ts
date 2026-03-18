import { PrismaClient } from '@prisma/client';
export type ResetMode = 'PARTIAL' | 'HARD';
export interface ResetConfirmation {
    readonly mode: ResetMode;
    readonly confirmedAt: Date;
    readonly confirmationToken: string;
}
export interface ResetResult {
    readonly success: boolean;
    readonly mode: ResetMode;
    readonly message: string;
    readonly data?: {
        readonly tenantId: string;
        readonly deletedMetrics: number;
        readonly deletedAlerts: number;
        readonly deletedCampaigns?: number;
        readonly deletedAlertDefinitions?: number;
        readonly durationMs: number;
    };
    readonly error?: string;
}
export declare class TenantResetService {
    private readonly prisma;
    private readonly hardResetTokens;
    constructor(prisma: PrismaClient);
    partialReset(tenantId: string): Promise<ResetResult>;
    hardReset(tenantId: string, confirmation: ResetConfirmation): Promise<ResetResult>;
    generateConfirmationToken(tenantId: string): {
        token: string;
        expiresAt: Date;
    };
    private validateTenant;
    private validateConfirmation;
    private cleanupExpiredTokens;
    private parseConfirmationToken;
    private hashTokenSecret;
    private verifyTokenSecret;
}
