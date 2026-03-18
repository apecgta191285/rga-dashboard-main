import { PrismaClient } from '@prisma/client';
export type PreflightStatus = 'PASS' | 'FAIL';
export interface PreflightCheck {
    id: string;
    status: PreflightStatus;
    message: string;
    details?: Record<string, unknown>;
}
export interface ToolkitPreflightResult {
    ok: boolean;
    checkedAt: string;
    checks: PreflightCheck[];
    actions: string[];
}
export declare function runToolkitPreflight(prisma: PrismaClient, options?: {
    requiredNodeMajor?: number;
}): Promise<ToolkitPreflightResult>;
